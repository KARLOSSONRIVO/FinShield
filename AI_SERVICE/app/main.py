from fastapi import FastAPI
from app.precheck.router import router as precheck_router
from app.ocr.router import router as ocr_router
from app.template.router import router as template_router

app = FastAPI(title="Invoice OCR Precheck Service")

app.include_router(precheck_router)
app.include_router(ocr_router)
app.include_router(template_router)
