import os
from io import BytesIO
from datetime import datetime, UTC
from typing import List, Optional
from contextlib import asynccontextmanager

import pandas as pd
import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient

from dataset import process_dataset

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb+srv://admin:admin@projeficaz.fsc9tus.mongodb.net/"
    mongodb_db: str = "meli_logs"
    model_path: str = "model.pkl"
    model_version: str = "1.0.0"

    class Config:
        env_file = ".env"

settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.mongodb_client = AsyncIOMotorClient(settings.mongodb_uri)
    app.db = app.mongodb_client[settings.mongodb_db]
    yield
    app.mongodb_client.close()

app = FastAPI(title="Meli Selecao da Fraude API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

async def get_logs_collection():
    return app.db["logs"]

model = joblib.load(settings.model_path)

async def read_feather_file(file: UploadFile) -> pd.DataFrame:
    contents = await file.read()
    buffer = BytesIO(contents)
    return pd.read_feather(buffer)

def log_predictions(
    records: List[dict],
    logs_collection,
):
    return logs_collection.insert_many(records)

class SinglePrediction(BaseSettings):
    transaction_id: str
    prediction: int
    probability: float
    is_fraud: bool

@app.post("/predict/single", response_model=SinglePrediction)
async def predict_single(
    payers: UploadFile = File(...),
    sellers: UploadFile = File(...),
    transactions: UploadFile = File(...),
    logs_collection=Depends(get_logs_collection),
):
    df_payers = await read_feather_file(payers)
    df_sellers = await read_feather_file(sellers)
    df_txns = await read_feather_file(transactions)

    df_proc = process_dataset(df_txns, df_payers, df_sellers)

    if df_proc.shape[0] != 1:
        raise HTTPException(400, "Espere exatamente 1 transação para /single")
    
    print(f"Number of features: {df_proc.shape[1]}")
    
    # Keep as DataFrame for model prediction
    pred = int(model.predict(df_proc)[0])
    prob = float(model.predict_proba(df_proc)[0, pred])

    print(f"Prediction: {pred}, Probability: {prob}")

    log_record = {
        **df_proc.iloc[0].to_dict(),
        "prediction": pred,
        "probability": prob,
        "timestamp": datetime.now(UTC),
        "model_version": settings.model_version,
        "is_fraud": bool(pred)
    }
    await logs_collection.insert_one(log_record)

    return {
        "transaction_id": str(df_txns.iloc[0].get("transaction_id", "")),
        "prediction": pred,
        "probability": prob,
        "is_fraud": bool(pred)
    }

@app.post("/predict/batch")
async def predict_batch(
    payers: UploadFile = File(...),
    sellers: UploadFile = File(...),
    transactions: UploadFile = File(...),
    logs_collection=Depends(get_logs_collection),
):
    df_payers = await read_feather_file(payers)
    df_sellers = await read_feather_file(sellers)
    df_txns = await read_feather_file(transactions)
    df_proc = process_dataset(df_txns, df_payers, df_sellers)

    X = df_proc.values
    preds = model.predict(X)
    probs = model.predict_proba(X).max(axis=1)

    # Create dictionary with transaction IDs as keys
    results = {}
    for i, tx_id in enumerate(df_txns['transaction_id']):
        results[str(tx_id)] = {
            "prediction": int(preds[i]),
            "probability": float(probs[i]),
            "is_fraud": bool(preds[i])
        }

    # Log predictions
    records = []
    for i, row in df_proc.iterrows():
        rec = {
            **row.to_dict(),
            "prediction": int(preds[i]),
            "probability": float(probs[i]),
            "timestamp": datetime.now(UTC),
            "model_version": settings.model_version,
        }
        records.append(rec)
    await log_predictions(records, logs_collection)

    return results

@app.get("/logs")
async def get_logs(
    start_date: Optional[datetime] = Query(None, description="Start date for filtering logs"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering logs"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    logs_collection=Depends(get_logs_collection),
):
    query = {}
    
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            query["timestamp"]["$gte"] = start_date
        if end_date:
            query["timestamp"]["$lte"] = end_date

    cursor = logs_collection.find(query).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string for JSON serialization
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return logs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)