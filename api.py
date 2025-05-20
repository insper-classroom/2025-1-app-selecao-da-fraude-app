import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import io
import uvicorn

app = FastAPI(
    title="API de Dados para Detecção de Fraude",
    description="API simplificada para disponibilização do dataset de detecção de fraude",
    version="1.0.0"
)

DATASET_PATH = "data/merged_dataset.csv"

@app.get("/")
async def root():
    """Endpoint raiz da API"""
    return {
        "message": "API de Dados para Detecção de Fraude",
        "download_dataset": "/download"
    }

@app.get("/download")
async def download_dataset():
    """
    Disponibiliza o dataset para download.
    Retorna:
    - Arquivo CSV como stream
    """
    if not os.path.exists(DATASET_PATH):
        raise HTTPException(status_code=404, detail=f"Dataset não encontrado. Execute 'python export.py' primeiro.")
    
    try:
        df = pd.read_csv(DATASET_PATH)
        
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        stream.seek(0)
        
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=fraud_detection_dataset.csv"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados: {str(e)}")

if __name__ == "__main__":
    if not os.path.exists(DATASET_PATH):
        print(f"Aviso: Arquivo {DATASET_PATH} não encontrado.")
        print("Execute 'python export.py --mode train' para gerar o dataset primeiro.")
    else:
        print("Iniciando API FastAPI para disponibilização de dados")
        print("Download do dataset em: http://localhost:8000/download")
        uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
