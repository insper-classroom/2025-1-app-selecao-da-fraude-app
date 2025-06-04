from io import BytesIO
from datetime import datetime, UTC
from typing import List, Optional
from contextlib import asynccontextmanager
import time
from fastapi import BackgroundTasks
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError
from sqlalchemy import inspect, text
import backoff

import pandas as pd
import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from dataset import process_dataset

Base = declarative_base()

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String)
    prediction = Column(Integer)
    probability = Column(Float)
    is_fraud = Column(Boolean)
    is_batch = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)
    transaction_date = Column(DateTime)

class Settings(BaseSettings):
    postgres_uri: str = "postgresql://neondb_owner:npg_2rLXGsuf0CVU@ep-restless-bush-ac8o7zoh-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    model_path: str = "xgb_smote_model.pkl"
    model_version: str = "1.0.0"
    max_retries: int = 3
    pool_size: int = 5
    max_overflow: int = 10
    generate_csv: bool = False
    generate_logs: bool = True

    class Config:
        env_file = ".env"

settings = Settings()

def ensure_table_exists(engine):
    inspector = inspect(engine)
    if not inspector.has_table("logs"):
        Base.metadata.create_all(bind=engine)
        print("Table 'logs' created successfully")
    else:
        print("Table 'logs' already exists")

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_engine(
        settings.postgres_uri,
        poolclass=QueuePool,
        pool_size=settings.pool_size,
        max_overflow=settings.max_overflow,
        pool_timeout=30,
        pool_recycle=1800
    )
    
    try:
        ensure_table_exists(engine)
    except Exception as e:
        print(f"Error ensuring table exists: {str(e)}")
        raise e
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    app.db = SessionLocal()
    
    yield
    
    app.db.close()
    engine.dispose()

app = FastAPI(title="Meli Selecao da Fraude API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = app.db
    try:
        yield db
    finally:
        db.close()

model = joblib.load(settings.model_path)

async def read_feather_file(file: UploadFile) -> pd.DataFrame:
    contents = await file.read()
    buffer = BytesIO(contents)
    return pd.read_feather(buffer)

@backoff.on_exception(
    backoff.expo,
    OperationalError,
    max_tries=settings.max_retries,
    max_time=30
)
def insert_with_retry(db: Session, records: List[dict]):
    try:
        for record in records:
            log = Log(**record)
            db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

async def log_predictions(records: List[dict], db: Session):
    inicio = time.time()
    try:
        insert_with_retry(db, records)
    except Exception as e:
        print(f'Erro ao inserir logs: {str(e)}')
        raise e

async def log_single_prediction(record: dict, db: Session):
    try:
        insert_with_retry(db, [record])
    except Exception as e:
        print(f'Erro ao inserir log único: {str(e)}')
        raise e

class BatchPredictionResponse(BaseSettings):
    message: str
    total_transactions: int

@app.post("/predict/single", response_model=BatchPredictionResponse)
async def predict_single(
    background_tasks: BackgroundTasks,
    transactions: UploadFile = File(...),
    generate_logs: bool = Query(True, description="Whether to generate logs for this prediction"),
    db = Depends(get_db),
):
    df_txns = await read_feather_file(transactions)
    
    if df_txns.shape[0] != 1:
        raise HTTPException(400, "Espere exatamente 1 transação para /single")
    
    # Return quick response
    response = {
        "message": "Prediction is being processed and logged in the background",
        "total_transactions": 1
    }
    
    # Process the rest asynchronously
    async def process_single_prediction(df_txns: pd.DataFrame):
        df_payers = pd.read_feather('data/payers-v1.feather')
        df_sellers = pd.read_feather('data/seller_terminals-v1.feather')
        df_old_transactions = pd.read_feather('data/transactions_train-v1.feather')

        df_old_transactions['tx_datetime'] = pd.to_datetime(df_old_transactions['tx_datetime'])
        df_txns['tx_datetime'] = pd.to_datetime(df_txns['tx_datetime'])
        
        df_old_transactions = df_old_transactions.sort_values('tx_datetime')
        df_txns = df_txns.sort_values('tx_datetime')

        missing_cols = ['is_transactional_fraud', 'is_fraud', 'tx_fraud_report_date']
        for col in missing_cols:
            if col not in df_txns.columns:
                df_txns[col] = None

        df_merged = pd.concat([df_old_transactions, df_txns], ignore_index=True)
        df_merged = df_merged.sort_values('tx_datetime')

        df_proc = process_dataset(df_payers, df_sellers, df_merged)
        df_proc.to_csv('df_proc.csv')

        df_new_txns = df_proc[df_proc['transaction_id'].isin(df_txns['transaction_id'])]

        to_drop = ['tx_datetime','tx_date','tx_time','tx_fraud_report_date','card_first_transaction',
                   'terminal_operation_start', 'terminal_soft_descriptor', 'transaction_city', 'card_bin_category', 'transaction_id']
        existing_columns = [col for col in to_drop if col in df_new_txns.columns]
        if existing_columns:
            df_new_txns = df_new_txns.drop(columns=existing_columns)

        probabilities = model.predict_proba(df_new_txns)[0]
        fraud_probability = float(probabilities[1])
        
        pred = 1 if fraud_probability > 0.98 else 0

        log_record = {
            "transaction_id": str(df_txns.iloc[0].get("transaction_id", "")),
            "prediction": int(pred),
            "probability": fraud_probability,
            "is_fraud": bool(pred),
            "is_batch": False,
            "transaction_date": datetime.now(UTC)
        }
        
        if generate_logs:
            await log_single_prediction(log_record, db)

    background_tasks.add_task(process_single_prediction, df_txns)
    return response

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    background_tasks: BackgroundTasks,
    transactions: UploadFile = File(...),
    generate_logs: bool = Query(True, description="Whether to generate logs for this prediction"),
    db = Depends(get_db),
):
    df_txns = await read_feather_file(transactions)
    total_transactions = len(df_txns)
    
    # Return quick response
    response = {
        "message": "Predictions are being processed and logged in the background",
        "total_transactions": total_transactions
    }
    
    # Process the rest asynchronously
    async def process_batch_prediction(df_txns: pd.DataFrame):
        df_payers = pd.read_feather('data/payers-v1.feather')
        df_sellers = pd.read_feather('data/seller_terminals-v1.feather')
        df_old_transactions = pd.read_feather('data/transactions_train-v1.feather')

        df_old_transactions['tx_datetime'] = pd.to_datetime(df_old_transactions['tx_datetime'])
        df_txns['tx_datetime'] = pd.to_datetime(df_txns['tx_datetime'])
        
        df_old_transactions = df_old_transactions.sort_values('tx_datetime')
        df_txns = df_txns.sort_values('tx_datetime')

        missing_cols = ['is_transactional_fraud', 'is_fraud', 'tx_fraud_report_date']
        for col in missing_cols:
            if col not in df_txns.columns:
                df_txns[col] = None

        df_merged = pd.concat([df_old_transactions, df_txns], ignore_index=True)
        df_merged = df_merged.sort_values('tx_datetime')

        df_proc = process_dataset(df_payers, df_sellers, df_merged)
        df_proc.to_csv('df_proc.csv')

        df_new_txns = df_proc[df_proc['transaction_id'].isin(df_txns['transaction_id'])]

        to_drop = ['tx_datetime','tx_date','tx_time','tx_fraud_report_date','card_first_transaction',
                   'terminal_operation_start', 'terminal_soft_descriptor', 'transaction_city', 'card_bin_category', 'transaction_id']
        existing_columns = [col for col in to_drop if col in df_new_txns.columns]
        if existing_columns:
            df_new_txns = df_new_txns.drop(columns=existing_columns)

        X = df_new_txns.drop(columns=['is_fraud', 'is_transactional_fraud'])
        
        probabilities = model.predict_proba(X)
        fraud_probabilities = probabilities[:, 1]

        threshold = 0.1
        preds = (fraud_probabilities > threshold).astype(int)

        if settings.generate_csv:
            results_df = pd.DataFrame({
                'transaction_id': df_txns['transaction_id'],
                'is_fraud': preds
            })
            results_df.to_csv('predictions.csv', index=False)

        if generate_logs:
            records = []
            total_fraudes = 0
            total_nao_fraudes = 0
            for i, tx_id in enumerate(df_txns['transaction_id']):
                log_record = {
                    "transaction_id": str(tx_id),
                    "prediction": int(preds[i]),
                    "probability": float(fraud_probabilities[i]),
                    "is_fraud": bool(preds[i]),
                    "is_batch": True,
                    "transaction_date": datetime.now(UTC)
                }
                records.append(log_record)
                if preds[i] == 1:
                    total_fraudes += 1
                else:
                    total_nao_fraudes += 1

            print(f'Total de fraudes: {total_fraudes}')
            print(f'Total de nao fraudes: {total_nao_fraudes}')
            porcentagem_fraudes = (total_fraudes / (total_fraudes + total_nao_fraudes)) * 100
            print(f'Porcentagem de fraudes: {porcentagem_fraudes:.2f}%')
            await log_predictions(records, db)

    background_tasks.add_task(process_batch_prediction, df_txns)
    return response

class LogResponse(BaseSettings):
    id: int
    transaction_id: str
    prediction: int
    probability: float
    is_fraud: bool
    is_batch: bool
    created_at: datetime
    transaction_date: datetime

class PaginatedLogsResponse(BaseSettings):
    logs: List[LogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

@app.get("/logs", response_model=PaginatedLogsResponse)
async def get_logs(
    start_date: Optional[datetime] = Query(None, description="Start date for filtering logs"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering logs"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Number of items per page"),
    db = Depends(get_db),
):
    query = db.query(Log)
    
    if start_date:
        query = query.filter(Log.transaction_date >= start_date)
    if end_date:
        query = query.filter(Log.transaction_date <= end_date)
    
    # Get total count for pagination
    total = query.count()
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results
    logs = query.order_by(Log.transaction_date.desc()).offset(offset).limit(page_size).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "transaction_id": log.transaction_id,
                "prediction": log.prediction,
                "probability": log.probability,
                "is_fraud": log.is_fraud,
                "is_batch": log.is_batch,
                "created_at": log.created_at,
                "transaction_date": log.transaction_date
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)