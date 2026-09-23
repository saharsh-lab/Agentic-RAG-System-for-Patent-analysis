from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.patents.epo import epo_adapter
from app.patents.models import PatentModelSchema, PatentSearchResponse
from app.patents.similarity import patent_similarity_service
from app.patents.comparison import patent_comparison_service

router = APIRouter()


class SimilaritySearchRequest(BaseModel):
    document_id: Optional[str] = None
    query: Optional[str] = None
    limit: Optional[int] = 5


class PatentComparisonRequest(BaseModel):
    base_patent: Dict[str, Any]
    comparison_patents: List[Dict[str, Any]]


@router.get("/search", response_model=PatentSearchResponse)
async def search_patents(
    q: str = Query(..., min_length=2, description="Search query or publication number"),
    limit: int = Query(5, ge=1, le=20)
):
    try:
        return await epo_adapter.search(query=q, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"EPO OPS search operation failed: {str(e)}"
        )


@router.post("/similarity")
async def find_similar_patents(
    req: SimilaritySearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Finds top similar patents across local vector DB and EPO OPS with labeled retrieval scores and reasons."""
    return await patent_similarity_service.search_similar_patents(
        document_id=req.document_id,
        query_text=req.query,
        limit=req.limit or 5,
        db=db
    )


@router.post("/compare")
async def compare_patents(req: PatentComparisonRequest):
    """Compares the base patent against one or more comparison patents across 7 technical attributes."""
    if not req.comparison_patents:
        raise HTTPException(
            status_code=400,
            detail="At least one comparison patent must be provided."
        )
    return await patent_comparison_service.compare_patents(
        base_patent=req.base_patent,
        comparison_patents=req.comparison_patents
    )


@router.get("/{publication_number}", response_model=PatentModelSchema)
async def get_patent_details(publication_number: str):
    patent = await epo_adapter.get_details(publication_number)
    if not patent:
        raise HTTPException(
            status_code=404,
            detail=f"Patent '{publication_number}' not found."
        )
    return patent


@router.get("/{publication_number}/legal-status")
async def get_patent_legal_status(publication_number: str):
    status_str = await epo_adapter.get_legal_status(publication_number)
    return {
        "publication_number": publication_number,
        "legal_status": status_str
    }
