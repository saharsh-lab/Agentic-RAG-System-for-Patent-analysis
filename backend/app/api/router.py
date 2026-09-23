from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.patents import router as patents_router
from app.api.auth import router as auth_router
from app.api.analytics import router as analytics_router
from app.api.evaluation import router as evaluation_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
api_router.include_router(patents_router, prefix="/patents", tags=["Patents"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(evaluation_router, prefix="/evaluation", tags=["Evaluation"])




