from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database.connection import get_db
from app.database.models import DocumentModel, DocumentChunkModel
from app.documents.parser import DocumentParser
from app.documents.chunker import PatentDocumentChunker
from app.documents.embeddings import embedding_generator
from app.documents.summary import patent_summary_generator
from app.documents.claims_analyzer import claim_analyzer
from app.documents.report import patent_report_generator
from app.schemas.document import (
    DocumentResponse, DocumentDetailResponse, DocumentChunkResponse,
    ClaimAnalysisRequest, ClaimAnalysisResponse
)

router = APIRouter()
chunker = PatentDocumentChunker()

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty.")

    ext = file.filename.lower().split(".")[-1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Supported formats: PDF, DOCX, TXT."
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of 25MB (Current size: {file_size / (1024 * 1024):.2f}MB)."
        )

    try:
        # 1. Parse document: Extract text, page numbers, 8 patent sections, metadata, claims
        parsed_doc = DocumentParser.parse(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse document content: {str(e)}"
        )

    # 2. Chunk document with patent-aware chunker
    chunks_data = chunker.chunk_document(parsed_doc)

    if not chunks_data:
        raise HTTPException(
            status_code=400,
            detail="Document contained no extractable text content."
        )

    # 3. Generate embeddings for chunks
    chunk_texts = [c.content for c in chunks_data]
    embeddings = await embedding_generator.generate_embeddings(chunk_texts)

    # 4. Generate structured 8-point patent summary
    try:
        summary_dict = await patent_summary_generator.generate_summary(
            raw_text=parsed_doc.raw_text,
            metadata=parsed_doc.metadata,
            sections=parsed_doc.sections,
            claims=parsed_doc.claims
        )
    except Exception:
        summary_dict = {}

    # 5. Save Document model with rich metadata, sections, claims, summary
    doc_model = DocumentModel(
        filename=file.filename,
        file_type=ext,
        file_size=file_size,
        metadata_json=parsed_doc.metadata,
        sections_json={sec: text[:1000] for sec, text in parsed_doc.sections.items()},
        claims_json=parsed_doc.claims,
        summary_json=summary_dict
    )
    db.add(doc_model)
    await db.flush()

    # 6. Save Document Chunks with Embeddings
    for chunk_data, emb in zip(chunks_data, embeddings):
        chunk_model = DocumentChunkModel(
            document_id=doc_model.id,
            content=chunk_data.content,
            page_number=chunk_data.page_number,
            section=chunk_data.section,
            chunk_index=chunk_data.chunk_index,
            embedding=emb
        )
        db.add(chunk_model)

    await db.commit()
    await db.refresh(doc_model)

    return DocumentResponse(
        id=doc_model.id,
        filename=doc_model.filename,
        file_type=doc_model.file_type,
        file_size=doc_model.file_size,
        upload_timestamp=doc_model.upload_timestamp,
        chunk_count=len(chunks_data),
        metadata=doc_model.metadata_json,
        summary=doc_model.summary_json,
        claims_count=len(doc_model.claims_json or [])
    )


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    query = (
        select(
            DocumentModel,
            func.count(DocumentChunkModel.id).label("chunk_count")
        )
        .outerjoin(DocumentChunkModel, DocumentModel.id == DocumentChunkModel.document_id)
        .group_by(DocumentModel.id)
        .order_by(DocumentModel.upload_timestamp.desc())
    )

    result = await db.execute(query)
    rows = result.all()

    response_list = []
    for doc, chunk_count in rows:
        response_list.append(DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            file_type=doc.file_type,
            file_size=doc.file_size,
            upload_timestamp=doc.upload_timestamp,
            chunk_count=chunk_count,
            metadata=doc.metadata_json,
            summary=doc.summary_json,
            claims_count=len(doc.claims_json or [])
        ))

    return response_list


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(DocumentModel)
        .options(selectinload(DocumentModel.chunks))
        .where(DocumentModel.id == document_id)
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    sorted_chunks = sorted(doc.chunks, key=lambda c: c.chunk_index)

    return DocumentDetailResponse(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        upload_timestamp=doc.upload_timestamp,
        chunk_count=len(sorted_chunks),
        metadata=doc.metadata_json,
        summary=doc.summary_json,
        claims_count=len(doc.claims_json or []),
        claims=doc.claims_json or [],
        sections=doc.sections_json or {},
        chunks=[
            DocumentChunkResponse(
                id=c.id,
                document_id=c.document_id,
                content=c.content,
                page_number=c.page_number,
                section=c.section,
                chunk_index=c.chunk_index,
                created_at=c.created_at
            )
            for c in sorted_chunks
        ]
    )


@router.get("/{document_id}/summary")
async def get_document_summary(document_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(DocumentModel).where(DocumentModel.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if not doc.summary_json:
        # On-demand generate if missing
        stmt_chunks = select(DocumentChunkModel).where(DocumentChunkModel.document_id == document_id).order_by(DocumentChunkModel.chunk_index)
        c_res = await db.execute(stmt_chunks)
        chunks = c_res.scalars().all()
        combined_text = "\n\n".join([c.content for c in chunks[:10]])
        summary = await patent_summary_generator.generate_summary(
            raw_text=combined_text,
            metadata=doc.metadata_json or {},
            sections=doc.sections_json or {},
            claims=doc.claims_json or []
        )
        doc.summary_json = summary
        await db.commit()

    return {
        "document_id": str(doc.id),
        "filename": doc.filename,
        "metadata": doc.metadata_json or {},
        "summary": doc.summary_json or {}
    }


@router.get("/{document_id}/claims")
async def get_document_claims(document_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(DocumentModel).where(DocumentModel.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    claims = doc.claims_json or []
    independent_count = len([c for c in claims if c.get("is_independent", True)])
    dependent_count = len(claims) - independent_count

    return {
        "document_id": str(doc.id),
        "filename": doc.filename,
        "total_claims": len(claims),
        "independent_claims_count": independent_count,
        "dependent_claims_count": dependent_count,
        "claims": claims
    }


@router.post("/{document_id}/claims/analyze", response_model=ClaimAnalysisResponse)
async def analyze_claim(
    document_id: UUID,
    req: ClaimAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DocumentModel).where(DocumentModel.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    analysis = await claim_analyzer.analyze_claim(
        claim_number=req.claim_number,
        claim_text=req.claim_text,
        claim_type=req.claim_type or "INDEPENDENT",
        document_id=str(document_id),
        action=req.action or "explain_simple",
        db=db
    )

    return ClaimAnalysisResponse(**analysis)


@router.get("/{document_id}/report")
async def get_patent_report(document_id: UUID, db: AsyncSession = Depends(get_db)):
    """Generates the comprehensive 11-section Patent Intelligence Report."""
    try:
        report = await patent_report_generator.generate_report(document_id=document_id, db=db)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(DocumentModel).where(DocumentModel.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    await db.delete(doc)
    await db.commit()
    return None
