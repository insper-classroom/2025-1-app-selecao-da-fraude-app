import os
from io import BytesIO
from datetime import datetime
from typing import List
from contextlib import asynccontextmanager

import pandas as pd
import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient

from dataset import process_dataset

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb+srv://admin:admin@projeficaz.fsc9tus.mongodb.net/"
    mongodb_db: str = "meli_logs"
    model_path: str = "model.pkl"
    data_folder: str = "data"
    model_version: str = "1.0.0"

    class Config:
        env_file = ".env"

settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.mongodb_client = AsyncIOMotorClient(settings.mongodb_uri)
    app.db = app.mongodb_client[settings.mongodb_db]
    os.makedirs(settings.data_folder, exist_ok=True)
    yield
    app.mongodb_client.close()

app = FastAPI(title="Meli Selecao da Fraude API", lifespan=lifespan)

async def get_logs_collection():
    return app.db["logs"]

model = joblib.load(settings.model_path)

def save_file_and_read(upload: UploadFile, name: str) -> pd.DataFrame:
    path = os.path.join(settings.data_folder, name)
    with open(path, "wb") as f:
        f.write(upload.file.read())
    return pd.read_feather(path)

def log_predictions(
    records: List[dict],
    logs_collection,
):
    return logs_collection.insert_many(records)

class SinglePrediction(BaseSettings):
    transaction_id: str
    prediction: int
    probability: float

@app.post("/predict/single", response_model=SinglePrediction)
async def predict_single(
    payers: UploadFile = File(...),
    sellers: UploadFile = File(...),
    transactions: UploadFile = File(...),
    logs_collection=Depends(get_logs_collection),
):
    df_payers = save_file_and_read(payers, "payers.feather")
    df_sellers = save_file_and_read(sellers, "sellers.feather")
    df_txns   = save_file_and_read(transactions, "transactions.feather")

    df_proc = process_dataset(df_payers, df_sellers, df_txns)

    if df_proc.shape[0] != 1:
        raise HTTPException(400, "Espere exatamente 1 transação para /single")
    X = df_proc.values
    pred = int(model.predict(X)[0])
    prob = float(model.predict_proba(X)[0, pred])

    log_record = {
        **df_proc.iloc[0].to_dict(),
        "prediction": pred,
        "probability": prob,
        "timestamp": datetime.utcnow(),
        "model_version": settings.model_version,
    }
    await logs_collection.insert_one(log_record)

    return {
        "transaction_id": str(df_txns.iloc[0].get("transaction_id", "")),
        "prediction": pred,
        "probability": prob,
    }

@app.post("/predict/batch")
async def predict_batch(
    payers: UploadFile = File(...),
    sellers: UploadFile = File(...),
    transactions: UploadFile = File(...),
    logs_collection=Depends(get_logs_collection),
):
    df_payers = save_file_and_read(payers, "payers.feather")
    df_sellers = save_file_and_read(sellers, "sellers.feather")
    df_txns   = save_file_and_read(transactions, "transactions.feather")
    df_proc   = process_dataset(df_payers, df_sellers, df_txns)

    X = df_proc.values
    preds = model.predict(X)
    probs = model.predict_proba(X).max(axis=1)

    df_out = df_txns.copy()
    df_out["prediction"] = preds
    df_out["probability"] = probs

    records = []
    for i, row in df_proc.iterrows():
        rec = {
            **row.to_dict(),
            "prediction": int(preds[i]),
            "probability": float(probs[i]),
            "timestamp": datetime.utcnow(),
            "model_version": settings.model_version,
        }
        records.append(rec)
    await log_predictions(records, logs_collection)

    buffer = BytesIO()
    df_out.reset_index(drop=True).to_feather(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=results.feather"},
    )