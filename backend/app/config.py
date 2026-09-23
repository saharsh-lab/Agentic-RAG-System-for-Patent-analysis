import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Agentic RAG for Multi-Source Patent Intelligence"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database
    POSTGRES_USER: str = "Saharsh"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "patent_rag_db"
    DATABASE_URL: str = "postgresql+asyncpg://localhost:5432/patent_rag_db"

    # OpenAI & Embeddings
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_MODEL: str = "gpt-4o-mini"

    # EPO OPS API
    EPO_OPS_KEY: str = ""
    EPO_OPS_SECRET: str = ""

    # Web Research
    TAVILY_API_KEY: str = ""

    # Agent Limits
    MAX_RESEARCH_ITERATIONS: int = 3

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
