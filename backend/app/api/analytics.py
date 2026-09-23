from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database.connection import get_db
from app.database.models import ClaimModel, AnswerModel, QueryModel, ConversationModel, UserModel
from app.schemas.conversation import HallucinationAnalyticsResponse, FlaggedClaim
from app.api.deps import get_current_user_optional

router = APIRouter()


@router.get("/hallucination", response_model=HallucinationAnalyticsResponse)
async def get_hallucination_analytics(
    current_user: UserModel = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Filter claims for current user's conversations
    query = (
        select(ClaimModel)
        .join(AnswerModel, ClaimModel.answer_id == AnswerModel.id)
        .join(QueryModel, AnswerModel.query_id == QueryModel.id)
        .join(ConversationModel, QueryModel.conversation_id == ConversationModel.id)
        .options(
            selectinload(ClaimModel.answer).selectinload(AnswerModel.query)
        )
    )

    if current_user:
        query = query.where(ConversationModel.user_id == current_user.id)

    result = await db.execute(query)
    claims: List[ClaimModel] = result.scalars().all()

    total_claims = len(claims)
    supported_count = sum(1 for c in claims if c.status == "SUPPORTED")
    partially_supported_count = sum(1 for c in claims if c.status in ("PARTIALLY_SUPPORTED", "PARTIAL"))
    unsupported_count = sum(1 for c in claims if c.status in ("UNSUPPORTED", "UNCERTAIN"))

    support_rate = round((supported_count / total_claims * 100), 1) if total_claims > 0 else 100.0
    hallucination_rate = round((unsupported_count / total_claims * 100), 1) if total_claims > 0 else 0.0
    grounding_score = round(((supported_count + 0.5 * partially_supported_count) / total_claims * 100), 1) if total_claims > 0 else 100.0

    flagged_claims: List[FlaggedClaim] = []
    for c in claims:
        if c.status in ("UNSUPPORTED", "UNCERTAIN", "PARTIALLY_SUPPORTED", "PARTIAL"):
            question_text = c.answer.query.question if (c.answer and c.answer.query) else "N/A"
            answer_text = c.answer.answer_text[:200] if c.answer else "N/A"
            flagged_claims.append(
                FlaggedClaim(
                    claim_id=c.id,
                    claim_text=c.claim_text,
                    status=c.status,
                    confidence=c.confidence,
                    explanation=c.explanation,
                    question=question_text,
                    answer_text=answer_text,
                    created_at=c.created_at
                )
            )

    return HallucinationAnalyticsResponse(
        total_claims=total_claims,
        supported_count=supported_count,
        partially_supported_count=partially_supported_count,
        unsupported_count=unsupported_count,
        support_rate=support_rate,
        hallucination_rate=hallucination_rate,
        grounding_score=grounding_score,
        flagged_claims=flagged_claims
    )
