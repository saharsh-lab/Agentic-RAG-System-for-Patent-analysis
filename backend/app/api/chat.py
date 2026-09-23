from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.database.connection import get_db
from app.database.models import QueryModel, AnswerModel, ClaimModel, ConversationModel, DocumentModel, UserModel
from app.retrieval.fusion import hybrid_retriever
from app.rag.generator import rag_generator
from app.agents.graph import agentic_planner
from app.schemas.chat import (
    ChatQueryRequest, ChatQueryResponse, SourceCitation, ClaimVerificationResponse
)
from app.schemas.conversation import (
    ConversationCreate, ConversationSummary, ConversationDetail, MessageItem
)
from app.api.deps import get_current_user_optional

router = APIRouter()


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    current_user: UserModel = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(ConversationModel)
        .where(ConversationModel.user_id == current_user.id)
        .options(selectinload(ConversationModel.document), selectinload(ConversationModel.queries))
        .order_by(ConversationModel.updated_at.desc())
    )
    result = await db.execute(query)
    conversations = result.scalars().all()

    summaries = []
    for c in conversations:
        doc_name = c.document.filename if c.document else None
        summaries.append(
            ConversationSummary(
                id=c.id,
                title=c.title,
                document_id=c.document_id,
                document_name=doc_name,
                query_count=len(c.queries),
                created_at=c.created_at,
                updated_at=c.updated_at
            )
        )
    return summaries


@router.post("/conversations", response_model=ConversationSummary, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current_user: UserModel = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    conv = ConversationModel(
        user_id=current_user.id,
        title=payload.title or "New Conversation",
        document_id=payload.document_id
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    doc_name = None
    if conv.document_id:
        doc_res = await db.execute(select(DocumentModel).where(DocumentModel.id == conv.document_id))
        doc = doc_res.scalar_one_or_none()
        if doc:
            doc_name = doc.filename

    return ConversationSummary(
        id=conv.id,
        title=conv.title,
        document_id=conv.document_id,
        document_name=doc_name,
        query_count=0,
        created_at=conv.created_at,
        updated_at=conv.updated_at
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation_detail(
    conversation_id: UUID,
    current_user: UserModel = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ConversationModel)
        .where(ConversationModel.id == conversation_id, ConversationModel.user_id == current_user.id)
        .options(
            selectinload(ConversationModel.queries)
            .selectinload(QueryModel.answers)
            .selectinload(AnswerModel.claims)
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found.")

    messages = []
    for q in conv.queries:
        if not q.answers:
            continue
        ans = q.answers[0]
        c_vers = [
            ClaimVerificationResponse(
                claim_id=str(c.id),
                claim_text=c.claim_text,
                status=c.status,
                confidence=c.confidence or 0.9,
                explanation=c.explanation,
                supporting_evidence_ids=[]
            )
            for c in ans.claims
        ]
        resp = ChatQueryResponse(
            query_id=q.id,
            answer_id=ans.id,
            question=q.question,
            answer=ans.answer_text,
            query_type=q.query_type or "DOCUMENT_ANALYSIS",
            evidence_sufficiency="SUFFICIENT",
            selected_sources=["DOCUMENT"],
            iteration_count=ans.iteration_count or 1,
            citations=[],
            claim_verifications=c_vers,
            created_at=ans.created_at
        )
        messages.append(
            MessageItem(
                query_id=q.id,
                question=q.question,
                query_type=q.query_type,
                created_at=q.created_at,
                response=resp
            )
        )

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        document_id=conv.document_id,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    current_user: UserModel = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ConversationModel).where(ConversationModel.id == conversation_id, ConversationModel.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found.")

    await db.execute(delete(ConversationModel).where(ConversationModel.id == conversation_id))
    await db.commit()
    return None


@router.post("/query", response_model=ChatQueryResponse, status_code=status.HTTP_200_OK)
async def query_chat(
    payload: ChatQueryRequest,
    current_user: UserModel = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question string cannot be empty.")

    # Ensure conversation thread exists or create new
    conv_id = payload.conversation_id
    if conv_id:
        conv_res = await db.execute(select(ConversationModel).where(ConversationModel.id == conv_id, ConversationModel.user_id == current_user.id))
        conv = conv_res.scalar_one_or_none()
        if not conv:
            conv = ConversationModel(user_id=current_user.id, title=question[:50], document_id=payload.document_id)
            db.add(conv)
            await db.flush()
            conv_id = conv.id
    else:
        conv = ConversationModel(user_id=current_user.id, title=question[:50], document_id=payload.document_id)
        db.add(conv)
        await db.flush()
        conv_id = conv.id

    if payload.use_agent:
        final_state = await agentic_planner.run(
            question=question,
            db=db,
            document_id=payload.document_id
        )

        answer_text = final_state.get("generated_answer", "No answer could be generated.")
        query_type = final_state.get("query_type", "DOCUMENT_ANALYSIS")
        sufficiency = final_state.get("evidence_sufficiency", "SUFFICIENT")
        sources = final_state.get("selected_sources", ["DOCUMENT"])
        iterations = final_state.get("iteration_count", 1)
        claim_vers = final_state.get("claim_verifications", [])

        query_model = QueryModel(conversation_id=conv_id, question=question, query_type=query_type)
        db.add(query_model)
        await db.flush()

        answer_model = AnswerModel(
            query_id=query_model.id,
            answer_text=answer_text,
            iteration_count=iterations
        )
        db.add(answer_model)
        await db.flush()

        for c in claim_vers:
            c_model = ClaimModel(
                answer_id=answer_model.id,
                claim_text=c["claim_text"],
                status=c["status"],
                confidence=c["confidence"],
                explanation=c.get("explanation")
            )
            db.add(c_model)

        await db.commit()
        await db.refresh(query_model)
        await db.refresh(answer_model)

        citations = []
        all_ev = []
        all_ev.extend(final_state.get("document_evidence", []))
        all_ev.extend(final_state.get("patent_evidence", []))
        all_ev.extend(final_state.get("web_evidence", []))

        for ev in all_ev:
            meta = ev.get("metadata", {})
            citations.append(SourceCitation(
                chunk_id=None,
                document_id=payload.document_id,
                filename=ev.get("source_name", "Evidence"),
                page_number=meta.get("page_number"),
                section=meta.get("section"),
                content=ev.get("content", "")[:300],
                similarity_score=ev.get("relevance_score", 1.0)
            ))

        return ChatQueryResponse(
            query_id=query_model.id,
            answer_id=answer_model.id,
            question=question,
            answer=answer_text,
            query_type=query_type,
            evidence_sufficiency=sufficiency,
            selected_sources=sources,
            iteration_count=iterations,
            research_trail=final_state.get("research_trail", []),
            citations=citations,
            claim_verifications=[
                ClaimVerificationResponse(
                    claim_id=c.get("claim_id"),
                    claim_text=c["claim_text"],
                    status=c["status"],
                    confidence=c["confidence"],
                    explanation=c.get("explanation"),
                    supporting_evidence_ids=c.get("supporting_evidence_ids", [])
                )
                for c in claim_vers
            ],
            created_at=answer_model.created_at
        )
    else:
        retrieved_chunks = await hybrid_retriever.retrieve(
            query_text=question,
            db=db,
            top_k=payload.top_k,
            document_id=payload.document_id
        )

        answer_text = await rag_generator.generate_standard_rag_answer(
            question=question,
            retrieved_chunks=retrieved_chunks
        )

        query_model = QueryModel(conversation_id=conv_id, question=question, query_type="BASIC_RAG")
        db.add(query_model)
        await db.flush()

        answer_model = AnswerModel(query_id=query_model.id, answer_text=answer_text, iteration_count=1)
        db.add(answer_model)
        await db.commit()
        await db.refresh(query_model)
        await db.refresh(answer_model)

        citations = [
            SourceCitation(
                chunk_id=c.chunk_id,
                document_id=c.document_id,
                filename=c.filename,
                page_number=c.page_number,
                section=c.section,
                content=c.content,
                similarity_score=c.similarity_score
            )
            for c in retrieved_chunks
        ]

        return ChatQueryResponse(
            query_id=query_model.id,
            answer_id=answer_model.id,
            question=question,
            answer=answer_text,
            query_type="BASIC_RAG",
            evidence_sufficiency="SUFFICIENT",
            selected_sources=["DOCUMENT"],
            iteration_count=1,
            citations=citations,
            claim_verifications=[],
            created_at=answer_model.created_at
        )
