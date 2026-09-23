# CLAUDE.md - Development Guide

## Project Overview
**Agentic RAG for Multi-Source Patent Intelligence** is a document-first adaptively orchestrated RAG system with claim-level verification and a bounded corrective research loop.

## Architecture Guidelines & Rules
1. **Document-First Adaptive Retrieval**: Always evaluate uploaded document evidence before calling external APIs (EPO OPS / Web Search).
2. **Strict Verification**: Extract atomic claims from RAG answers and verify each claim against retrieved evidence (SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED, UNCERTAIN).
3. **Bounded Iteration**: Corrective research loop must terminate after a maximum of 2-3 iterations.
4. **Official APIs Only**: Never invent EPO OPS API endpoints or scrape external patent repositories. Always rely on official provider specs.
5. **No Hardcoded Keys**: Load credentials exclusively via environment variables (`.env`).

## Common Development Commands

### Backend
```bash
# Activate virtual environment
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend dev server
uvicorn app.main:app --reload --port 8000

# Run backend tests
pytest
```

### Database
```bash
# Start PostgreSQL service
brew services start postgresql@16

# Connect to database
psql -d patent_rag_db
```

### Frontend
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run Next.js dev server
npm run dev

# Build production bundle
npm run build
```

## Directory Structure
- `backend/app/main.py`: FastAPI entrypoint
- `backend/app/api/`: REST endpoints (documents, chat, patents, health)
- `backend/app/agents/`: LangGraph agent graph, planner, analyzer, and sufficiency checker
- `backend/app/documents/`: Parsers (PDF, DOCX, TXT), chunker, embeddings
- `backend/app/retrieval/`: Keyword, semantic, fusion, and reranking
- `backend/app/patents/`: EPO OPS patent adapter and models
- `backend/app/verification/`: Atomic claim extraction and claim verifier
- `frontend/app/`: Next.js pages & layout
- `frontend/components/`: React UI components
