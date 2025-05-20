import os
import logging
from typing import Dict, Any
from datetime import datetime
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel, Field
import uvicorn
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import io

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DATASET_PATH = Path("data/merged_dataset.csv")
API_VERSION = "1.0.0"
API_TITLE = "API de Dados para Detecção de Fraude"
API_DESCRIPTION = "API para disponibilização do dataset de detecção de fraude. Fornece endpoints para download do dataset e informações sobre os dados."

limiter = Limiter(key_func=get_remote_address)

class HealthCheck(BaseModel):
    status: str = Field(..., description="Status da API")
    version: str = Field(..., description="Versão da API")
    timestamp: datetime = Field(..., description="Timestamp da verificação")
    dataset_available: bool = Field(..., description="Indica se o dataset está disponível")

class APIInfo(BaseModel):
    message: str = Field(..., description="Mensagem de boas-vindas")
    version: str = Field(..., description="Versão da API")
    endpoints: Dict[str, str] = Field(..., description="Endpoints disponíveis")

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    docs_url=None,
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

async def validate_dataset() -> bool:
    """Validates if the dataset exists and is accessible"""
    if not DATASET_PATH.exists():
        logger.warning(f"Dataset não encontrado em {DATASET_PATH}")
        return False
    try:
        pd.read_csv(DATASET_PATH)
        return True
    except Exception as e:
        logger.error(f"Erro ao validar dataset: {str(e)}")
        return False

@app.get("/", response_model=APIInfo)
@limiter.limit("5/minute")
async def root(request: Request):
    """Endpoint raiz da API"""
    return APIInfo(
        message="API de Dados para Detecção de Fraude",
        version=API_VERSION,
        endpoints={
            "health": "/health",
            "download": "/download",
            "docs": "/docs"
        }
    )

@app.get("/health", response_model=HealthCheck)
@limiter.limit("10/minute")
async def health_check(request: Request):
    """Endpoint para verificação de saúde da API"""
    dataset_available = await validate_dataset()
    return HealthCheck(
        status="healthy",
        version=API_VERSION,
        timestamp=datetime.now(),
        dataset_available=dataset_available
    )

@app.get("/download")
@limiter.limit("2/minute")
async def download_dataset(request: Request):
    """
    Disponibiliza o dataset para download.
    
    Returns:
        StreamingResponse: Arquivo CSV como stream
    """
    if not await validate_dataset():
        raise HTTPException(
            status_code=404,
            detail="Dataset não encontrado. Execute 'python export.py --mode train' primeiro."
        )
    
    try:
        logger.info("Iniciando download do dataset")
        df = pd.read_csv(DATASET_PATH)
        
        if df.empty:
            raise HTTPException(
                status_code=500,
                detail="Dataset está vazio"
            )
        
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        stream.seek(0)
        
        logger.info("Dataset preparado para download")
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=fraud_detection_dataset.csv",
                "Content-Type": "text/csv"
            }
        )
    
    except Exception as e:
        logger.error(f"Erro ao processar dataset: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar dados: {str(e)}"
        )

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI endpoint"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Erro não tratado: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"}
    )

if __name__ == "__main__":
    if not DATASET_PATH.exists():
        logger.warning(f"Arquivo {DATASET_PATH} não encontrado.")
        logger.info("Execute 'python export.py --mode train' para gerar o dataset primeiro.")
    else:
        logger.info("Iniciando API FastAPI para disponibilização de dados")
        logger.info("Download do dataset em: http://localhost:8000/download")
        uvicorn.run(
            "api:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )