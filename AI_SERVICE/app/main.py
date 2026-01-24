from fastapi import FastAPI
from app.precheck.router import router as precheck_router

app = FastAPI(title="Invoice OCR Precheck Service")

app.include_router(precheck_router)