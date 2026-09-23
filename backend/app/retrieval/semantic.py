from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import DocumentChunkModel, DocumentModel
from app.documents.embeddings import embedding_generator


class RetrievedChunk(BaseModel):
    chunk_id: UUID
    document_id: UUID
    filename: str
    content: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    chunk_index: int
    similarity_score: float


class SemanticRetriever:
    async def retrieve(
        self,
        query_text: str,
        db: AsyncSession,
        top_k: int = 5,
        document_id: Optional[UUID] = None
    ) -> List[RetrievedChunk]:
        # Generate query vector embedding
        query_vector = await embedding_generator.generate_single_embedding(query_text)

        # Build query using pgvector cosine distance
        cosine_dist = DocumentChunkModel.embedding.cosine_distance(query_vector)
        similarity = 1.0 - cosine_dist

        stmt = (
            select(DocumentChunkModel, DocumentModel.filename, similarity.label("score"))
            .join(DocumentModel, DocumentChunkModel.document_id == DocumentModel.id)
        )

        if document_id:
            stmt = stmt.where(DocumentChunkModel.document_id == document_id)

        stmt = stmt.order_by(cosine_dist).limit(top_k)

        result = await db.execute(stmt)
        rows = result.all()

        retrieved: List[RetrievedChunk] = []
        for chunk, filename, score in rows:
            retrieved.append(RetrievedChunk(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                filename=filename,
                content=chunk.content,
                page_number=chunk.page_number,
                section=chunk.section,
                chunk_index=chunk.chunk_index,
                similarity_score=float(score) if score is not None else 0.0
            ))

        return retrieved


semantic_retriever = SemanticRetriever()
