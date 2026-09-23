from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.database.models import DocumentChunkModel, DocumentModel


class KeywordRetrievedChunk(BaseModel):
    chunk_id: UUID
    document_id: UUID
    filename: str
    content: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    chunk_index: int
    keyword_score: float


class KeywordRetriever:
    async def retrieve(
        self,
        query_text: str,
        db: AsyncSession,
        top_k: int = 10,
        document_id: Optional[UUID] = None
    ) -> List[KeywordRetrievedChunk]:
        # Format query into websearch_to_tsquery or plainto_tsquery for English
        sanitized_query = query_text.replace("'", "''")
        ts_query = func.websearch_to_tsquery('english', query_text)
        
        # Rank using ts_rank
        rank_func = func.ts_rank(
            func.to_tsvector('english', DocumentChunkModel.content),
            ts_query
        )

        stmt = (
            select(DocumentChunkModel, DocumentModel.filename, rank_func.label("rank"))
            .join(DocumentModel, DocumentChunkModel.document_id == DocumentModel.id)
            .where(func.to_tsvector('english', DocumentChunkModel.content).op('@@')(ts_query))
        )

        if document_id:
            stmt = stmt.where(DocumentChunkModel.document_id == document_id)

        stmt = stmt.order_by(rank_func.desc()).limit(top_k)

        result = await db.execute(stmt)
        rows = result.all()

        results: List[KeywordRetrievedChunk] = []
        for chunk, filename, rank in rows:
            results.append(KeywordRetrievedChunk(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                filename=filename,
                content=chunk.content,
                page_number=chunk.page_number,
                section=chunk.section,
                chunk_index=chunk.chunk_index,
                keyword_score=float(rank) if rank is not None else 0.0
            ))

        return results


keyword_retriever = KeywordRetriever()
