import os
from io import BytesIO
from datetime import datetime, UTC
from typing import List, Optional
from contextlib import asynccontextmanager
import asyncio
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
import asyncio

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
    model_path: str = "model.pkl"
    model_version: str = "1.0.0"
    max_retries: int = 3
    pool_size: int = 5
    max_overflow: int = 10

    class Config:
        env_file = ".env"

settings = Settings()

def ensure_table_exists(engine):
    """
    Verifica se a tabela existe e a cria se necessário.
    """
    inspector = inspect(engine)
    if not inspector.has_table("logs"):
        Base.metadata.create_all(bind=engine)
        print("Table 'logs' created successfully")
    else:
        print("Table 'logs' already exists")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database engine with connection pooling
    engine = create_engine(
        settings.postgres_uri,
        poolclass=QueuePool,
        pool_size=settings.pool_size,
        max_overflow=settings.max_overflow,
        pool_timeout=30,
        pool_recycle=1800
    )
    
    # Ensure table exists
    try:
        ensure_table_exists(engine)
    except Exception as e:
        print(f"Error ensuring table exists: {str(e)}")
        raise e
    
    # Create session factory
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    app.db = SessionLocal()
    
    yield
    
    # Close database connection
    app.db.close()
    engine.dispose()

app = FastAPI(title="Meli Selecao da Fraude API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
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
    """
    Insere registros com retry logic usando backoff.
    """
    try:
        for record in records:
            log = Log(**record)
            db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

async def log_predictions(records: List[dict], db: Session):
    """
    Insere registros em lote com retry logic.
    """
    inicio = time.time()
    print('Iniciando log...')
    try:
        insert_with_retry(db, records)
        fim = time.time()
        print(f'Tempo de log: {fim - inicio} segundos')
    except Exception as e:
        print(f'Erro ao inserir logs: {str(e)}')
        raise e

async def log_single_prediction(record: dict, db: Session):
    """
    Insere um único registro com retry logic.
    """
    try:
        insert_with_retry(db, [record])
    except Exception as e:
        print(f'Erro ao inserir log único: {str(e)}')
        raise e

class SinglePrediction(BaseSettings):
    transaction_id: str
    prediction: int
    probability: float
    is_fraud: bool

@app.post("/predict/single", response_model=SinglePrediction)
async def predict_single(
    background_tasks: BackgroundTasks,
    transactions: UploadFile = File(...),
    db = Depends(get_db),
):
    print('Iniciando predição única...')
    df_payers = pd.read_feather('data/payers.feather')
    df_sellers = pd.read_feather('data/seller.feather')
    df_old_transactions = pd.read_feather('data/transactions_train-v1.feather')
    df_txns = await read_feather_file(transactions)

    print('Colunas do df_payers:', df_payers.columns.tolist())
    print('Colunas do df_txns:', df_txns.columns.tolist())

    # Sort both dataframes by datetime
    df_old_transactions['tx_datetime'] = pd.to_datetime(df_old_transactions['tx_datetime'])
    df_txns['tx_datetime'] = pd.to_datetime(df_txns['tx_datetime'])
    
    df_old_transactions = df_old_transactions.sort_values('tx_datetime')
    df_txns = df_txns.sort_values('tx_datetime')

    # Handle missing columns by filling with appropriate values
    missing_cols = ['is_transactional_fraud', 'is_fraud', 'tx_fraud_report_date']
    for col in missing_cols:
        if col not in df_txns.columns:
            df_txns[col] = None

    # Merge transactions and sort by datetime
    print('Concatenando datasets...')
    df_merged = pd.concat([df_old_transactions, df_txns], ignore_index=True)
    df_merged = df_merged.sort_values('tx_datetime')
    print('Dataset concatenado e ordenado')

    print('Processando dataset...')
    df_proc = process_dataset(df_payers, df_sellers, df_merged)
    df_proc.to_csv('df_proc.csv')

    # Split to get only new transactions
    df_new_txns = df_proc[df_proc['transaction_id'].isin(df_txns['transaction_id'])]

    to_drop = ['tx_datetime','tx_date','tx_time','tx_fraud_report_date','card_first_transaction',
               'terminal_operation_start', 'terminal_soft_descriptor', 'transaction_city', 'card_bin_category', 'transaction_id']
    # Only drop columns that exist in the DataFrame
    existing_columns = [col for col in to_drop if col in df_new_txns.columns]
    if existing_columns:
        df_new_txns = df_new_txns.drop(columns=existing_columns)
    print('Dataset processado')

    if df_new_txns.shape[0] != 1:
        raise HTTPException(400, "Espere exatamente 1 transação para /single")
    
    # Keep as DataFrame for model prediction
    probabilities = model.predict_proba(df_new_txns)[0]
    fraud_probability = float(probabilities[1])
    
    # Usa um limiar mais alto para reduzir falsos positivos
    pred = 1 if fraud_probability > 0.98 else 0

    total_fraudes = 0
    total_nao_fraudes = 0
    if pred == 1:
        total_fraudes += 1
    else:
        total_nao_fraudes += 1

    print(f'Total de fraudes: {total_fraudes}')
    print(f'Total de nao fraudes: {total_nao_fraudes}')
    porcentagem_fraudes = (total_fraudes / (total_fraudes + total_nao_fraudes)) * 100
    print(f'Porcentagem de fraudes: {porcentagem_fraudes:.2f}%')

    log_record = {
        "transaction_id": str(df_txns.iloc[0].get("transaction_id", "")),
        "prediction": int(pred),
        "probability": fraud_probability,
        "is_fraud": bool(pred),
        "is_batch": False,
        "transaction_date": datetime.now(UTC)
    }
    
    # Add logging to background tasks
    background_tasks.add_task(log_single_prediction, log_record, db)

    return {
        "transaction_id": str(df_txns.iloc[0].get("transaction_id", "")),
        "prediction": pred,
        "probability": fraud_probability,
        "is_fraud": bool(pred)
    }

class BatchPredictionResponse(BaseSettings):
    message: str
    total_transactions: int

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    background_tasks: BackgroundTasks,
    transactions: UploadFile = File(...),
    db = Depends(get_db),
):
    print('Iniciando predição em lote...')
    df_payers = pd.read_feather('data/payers.feather')
    df_sellers = pd.read_feather('data/seller.feather')
    df_old_transactions = pd.read_feather('data/transactions_train-v1.feather')
    df_txns = await read_feather_file(transactions)

    print('Colunas do df_payers:', df_payers.columns.tolist())
    print('Colunas do df_txns:', df_txns.columns.tolist())

    # Sort both dataframes by datetime
    df_old_transactions['tx_datetime'] = pd.to_datetime(df_old_transactions['tx_datetime'])
    df_txns['tx_datetime'] = pd.to_datetime(df_txns['tx_datetime'])
    
    df_old_transactions = df_old_transactions.sort_values('tx_datetime')
    df_txns = df_txns.sort_values('tx_datetime')

    # Handle missing columns by filling with appropriate values
    missing_cols = ['is_transactional_fraud', 'is_fraud', 'tx_fraud_report_date']
    for col in missing_cols:
        if col not in df_txns.columns:
            df_txns[col] = None

    # Merge transactions and sort by datetime
    print('Concatenando datasets...')
    df_merged = pd.concat([df_old_transactions, df_txns], ignore_index=True)
    df_merged = df_merged.sort_values('tx_datetime')
    print('Dataset concatenado e ordenado')

    print('Processando dataset...')
    df_proc = process_dataset(df_payers, df_sellers, df_merged)
    df_proc.to_csv('df_proc.csv')

    # Split to get only new transactions
    df_new_txns = df_proc[df_proc['transaction_id'].isin(df_txns['transaction_id'])]

    to_drop = ['tx_datetime','tx_date','tx_time','tx_fraud_report_date','card_first_transaction',
               'terminal_operation_start', 'terminal_soft_descriptor', 'transaction_city', 'card_bin_category', 'transaction_id']
    # Only drop columns that exist in the DataFrame
    existing_columns = [col for col in to_drop if col in df_new_txns.columns]
    if existing_columns:
        df_new_txns = df_new_txns.drop(columns=existing_columns)
    print('Dataset processado')

    # Separate X and y
    X = df_new_txns.drop(columns=['is_fraud', 'is_transactional_fraud'])
    
    probabilities = model.predict_proba(X)
    fraud_probabilities = probabilities[:, 1]

    threshold = 0.1
    # Usa um limiar mais alto para reduzir falsos positivos
    preds = (fraud_probabilities > threshold).astype(int)

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

    # Add logging to background tasks
    background_tasks.add_task(log_predictions, records, db)

    # Criar DataFrame com resultados e salvar em CSV
    df_results = pd.DataFrame({
        'transaction_id': df_txns['transaction_id'],
        'is_fraud': preds
    })
    df_results.to_csv('predictions_results.csv', index=False)
    print('Resultados salvos em predictions_results.csv')

    return {
        "message": "Predictions are being processed and logged in the background",
        "total_transactions": len(df_txns)
    }

@app.get("/logs")
async def get_logs(
    start_date: Optional[datetime] = Query(None, description="Start date for filtering logs"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering logs"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    db = Depends(get_db),
):
    query = db.query(Log)
    
    if start_date:
        query = query.filter(Log.transaction_date >= start_date)
    if end_date:
        query = query.filter(Log.transaction_date <= end_date)
    
    logs = query.order_by(Log.transaction_date.desc()).limit(limit).all()
    
    return [
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
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)