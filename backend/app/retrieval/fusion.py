from typing import List, Optional, Dict
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import DocumentChunkModel, DocumentModel
from app.retrieval.semantic import semantic_retriever, RetrievedChunk
from app.retrieval.keyword import keyword_retriever
from app.retrieval.reranker import bge_reranker


class HybridRetriever:
    async def retrieve(
        self,
        query_text: str,
        db: AsyncSession,
        top_k: int = 5,
        document_id: Optional[UUID] = None,
        candidate_k: int = 15
    ) -> List[RetrievedChunk]:
        # 1. Fetch top semantic candidates
        semantic_chunks = await semantic_retriever.retrieve(
            query_text=query_text,
            db=db,
            top_k=candidate_k,
            document_id=document_id
        )

        # 2. Fetch top keyword candidates
        keyword_chunks = await keyword_retriever.retrieve(
            query_text=query_text,
            db=db,
            top_k=candidate_k,
            document_id=document_id
        )

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[UUID, float] = {}
        chunk_map: Dict[UUID, RetrievedChunk] = {}
        k_rrf = 60.0

        # Process semantic ranks
        for rank, chunk in enumerate(semantic_chunks, start=1):
            rrf_scores[chunk.chunk_id] = rrf_scores.get(chunk.chunk_id, 0.0) + (1.0 / (k_rrf + rank))
            chunk_map[chunk.chunk_id] = chunk

        # Process keyword ranks
        for rank, kw_chunk in enumerate(keyword_chunks, start=1):
            chunk_id = kw_chunk.chunk_id
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (k_rrf + rank))
            if chunk_id not in chunk_map:
                chunk_map[chunk_id] = RetrievedChunk(
                    chunk_id=kw_chunk.chunk_id,
                    document_id=kw_chunk.document_id,
                    filename=kw_chunk.filename,
                    content=kw_chunk.content,
                    page_number=kw_chunk.page_number,
                    section=kw_chunk.section,
                    chunk_index=kw_chunk.chunk_index,
                    similarity_score=kw_chunk.keyword_score
                )

        # If document_id is provided, also fetch page 1 (chunk_index 0) to ensure patent front-page metadata (dates, inventors, application numbers) is always available
        if document_id:
            stmt = (
                select(DocumentChunkModel, DocumentModel.filename)
                .join(DocumentModel, DocumentChunkModel.document_id == DocumentModel.id)
                .where(DocumentChunkModel.document_id == document_id)
                .where(DocumentChunkModel.chunk_index == 0)
            )
            res = await db.execute(stmt)
            p1_row = res.first()
            if p1_row:
                p1_chunk, p1_fname = p1_row
                if p1_chunk.id not in chunk_map:
                    rrf_scores[p1_chunk.id] = 0.05
                    chunk_map[p1_chunk.id] = RetrievedChunk(
                        chunk_id=p1_chunk.id,
                        document_id=p1_chunk.document_id,
                        filename=p1_fname,
                        content=p1_chunk.content,
                        page_number=p1_chunk.page_number,
                        section=p1_chunk.section,
                        chunk_index=p1_chunk.chunk_index,
                        similarity_score=0.05
                    )

        # Construct fused candidate list with RRF score
        fused_candidates: List[RetrievedChunk] = []
        for chunk_id, rrf_score in rrf_scores.items():
            base_chunk = chunk_map[chunk_id]
            fused_candidates.append(RetrievedChunk(
                chunk_id=base_chunk.chunk_id,
                document_id=base_chunk.document_id,
                filename=base_chunk.filename,
                content=base_chunk.content,
                page_number=base_chunk.page_number,
                section=base_chunk.section,
                chunk_index=base_chunk.chunk_index,
                similarity_score=rrf_score
            ))

        # 4. Rerank fused candidates using BGE Reranker
        reranked_chunks = bge_reranker.rerank(
            query=query_text,
            candidates=fused_candidates,
            top_k=top_k
        )

        return reranked_chunks


hybrid_retriever = HybridRetriever()
