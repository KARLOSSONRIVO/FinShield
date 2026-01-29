from fastapi import APIRouter, UploadFile, File, HTTPException
from app.template.service import convert_template, create_embeddings
from app.template.schemas import ConvertResponse, EmbedRequest, EmbedResponse

router = APIRouter(prefix="/template", tags=["Template"])


@router.post("/convert", response_model=ConvertResponse)
async def convert_to_csv(file: UploadFile = File(...)):
    """
    Convert invoice template (PDF/DOCX) to CSV format
    
    Extracts tables from the uploaded document and converts to CSV.
    """
    try:
        result = await convert_template(file)
        
        return ConvertResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.post("/embed", response_model=EmbedResponse)
async def generate_embeddings(request: EmbedRequest):
    """
    Generate embeddings from CSV data and store in MongoDB
    
    Uses Sentence Transformers to create vector embeddings for future AI features.
    """
    try:
        result = await create_embeddings(request.orgId, request.csvData)
        return EmbedResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
