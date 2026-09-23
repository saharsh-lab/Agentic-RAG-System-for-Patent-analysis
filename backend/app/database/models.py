import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, DateTime, ForeignKey, Table, JSON, Date
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database.connection import Base


# Many-to-many link table for Claim <-> Evidence
claim_evidence_table = Table(
    "claim_evidence",
    Base.metadata,
    Column("claim_id", UUID(as_uuid=True), ForeignKey("claims.id", ondelete="CASCADE"), primary_key=True),
    Column("evidence_id", UUID(as_uuid=True), ForeignKey("evidence.id", ondelete="CASCADE"), primary_key=True),
)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversations = relationship("ConversationModel", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("DocumentModel", back_populates="user")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    metadata_json = Column(JSON, nullable=True, default={})
    sections_json = Column(JSON, nullable=True, default={})
    claims_json = Column(JSON, nullable=True, default=[])
    summary_json = Column(JSON, nullable=True, default={})
    upload_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("UserModel", back_populates="documents")
    chunks = relationship("DocumentChunkModel", back_populates="document", cascade="all, delete-orphan")


class ConversationModel(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Conversation")
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("UserModel", back_populates="conversations")
    document = relationship("DocumentModel")
    queries = relationship("QueryModel", back_populates="conversation", cascade="all, delete-orphan")


class DocumentChunkModel(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    section = Column(String(100), nullable=True)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(Vector(1536), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("DocumentModel", back_populates="chunks")


class PatentModel(Base):
    __tablename__ = "patents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_number = Column(String(100), unique=True, nullable=False)
    application_number = Column(String(100), nullable=True)
    title = Column(Text, nullable=True)
    abstract = Column(Text, nullable=True)
    claims = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    inventors = Column(JSON, nullable=True)
    applicants = Column(JSON, nullable=True)
    filing_date = Column(Date, nullable=True)
    publication_date = Column(Date, nullable=True)
    jurisdictions = Column(JSON, nullable=True)
    cpc_codes = Column(JSON, nullable=True)
    ipc_codes = Column(JSON, nullable=True)
    legal_status = Column(String(100), nullable=True)
    source = Column(String(50), default="EPO")
    source_url = Column(Text, nullable=True)
    retrieved_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class EvidenceModel(Base):
    __tablename__ = "evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(String(20), nullable=False)  # DOCUMENT, PATENT, WEB
    source_id = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=False, default={})
    source_url = Column(Text, nullable=True)
    relevance_score = Column(Float, nullable=True)
    retrieved_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    claims = relationship("ClaimModel", secondary=claim_evidence_table, back_populates="evidence_list")


class QueryModel(Base):
    __tablename__ = "queries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    question = Column(Text, nullable=False)
    query_type = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("ConversationModel", back_populates="queries")
    answers = relationship("AnswerModel", back_populates="query", cascade="all, delete-orphan")


class AnswerModel(Base):
    __tablename__ = "answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_id = Column(UUID(as_uuid=True), ForeignKey("queries.id", ondelete="CASCADE"), nullable=False)
    answer_text = Column(Text, nullable=False)
    iteration_count = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    query = relationship("QueryModel", back_populates="answers")
    claims = relationship("ClaimModel", back_populates="answer", cascade="all, delete-orphan")


class ClaimModel(Base):
    __tablename__ = "claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    answer_id = Column(UUID(as_uuid=True), ForeignKey("answers.id", ondelete="CASCADE"), nullable=False)
    claim_text = Column(Text, nullable=False)
    status = Column(String(30), nullable=False)  # SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED, UNCERTAIN
    confidence = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    answer = relationship("AnswerModel", back_populates="claims")
    evidence_list = relationship("EvidenceModel", secondary=claim_evidence_table, back_populates="claims")


class BenchmarkResultModel(Base):
    __tablename__ = "benchmark_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_count = Column(Integer, nullable=False, default=10)
    baseline_metrics = Column(JSON, nullable=False)
    proposed_metrics = Column(JSON, nullable=False)
    question_details = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

