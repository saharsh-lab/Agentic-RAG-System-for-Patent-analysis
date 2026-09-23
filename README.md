# Agentic RAG for Multi-Source Patent Intelligence

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL + pgvector](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-blue.svg)](https://github.com/pgvector/pgvector)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic%20Planner-orange.svg)](https://github.com/langchain-ai/langgraph)

## Abstract & Research Idea
**Agentic RAG for Multi-Source Patent Intelligence** investigates **document-first adaptive evidence orchestration** combined with **atomic claim-level verification**. Patent analysis demands high legal precision and verifiable evidence tracing across heterogeneous data sources (user-uploaded patent specs, official patent authority APIs, and live web research).

Unlike traditional static RAG pipelines, this system:
1. Prioritizes local document evidence (PDF page-preserved, DOCX, TXT) and evaluates **Evidence Sufficiency** before issuing external queries.
2. Adaptively selects live patent API endpoints (EPO OPS) or live web search based on missing information.
3. Performs hybrid retrieval (PostgreSQL full-text keyword search + pgvector semantic search) fused with BGE reranking.
4. Extracts atomic factual claims from generated RAG answers and verifies each claim against retrieved evidence.
5. Executes a **Bounded Corrective Research Loop** (max 2–3 iterations) to resolve unsupported claims.

---

## High-Level Architecture

```
USER
  │
  ▼
NEXT.JS 14 FRONTEND (React, TypeScript, Tailwind CSS)
  │
  ▼
FASTAPI BACKEND (Python 3.12)
  │
  ▼
QUERY ANALYZER → LANGGRAPH AGENTIC PLANNER
  │
  ├── DOCUMENT RETRIEVAL (PyMuPDF, Page/Section preservation)
  ├── EVIDENCE SUFFICIENCY CHECKER
  │     ├── [SUFFICIENT]   ─► Generate RAG Answer
  │     └── [INSUFFICIENT] ─► SOURCE SELECTOR
  │                              ├── EPO OPS Patent API Adapter
  │                              └── Web Search Adapter
  │
  ├── SOURCE NORMALIZATION & DEDUPLICATION
  ├── HYBRID RETRIEVAL & BGE RERANKING
  ├── RAG ANSWER GENERATION
  ├── ATOMIC CLAIM EXTRACTION
  ├── CLAIM-LEVEL VERIFICATION (Supported / Partially Supported / Unsupported / Uncertain)
  │     ├── [SUPPORTED]   ─► FINAL RESPONSE WITH CITATIONS & EVIDENCE
  │     └── [UNSUPPORTED] ─► BOUNDED CORRECTIVE RESEARCH LOOP (Max 2-3 Iterations)
```

---

## Key Features

- **Document Parsing with Page Preservation**: PyMuPDF extracts PDF text while preserving page numbers and structural sections (Abstract, Background, Summary, Description, Claims).
- **Hybrid Retrieval**: PostgreSQL `tsvector` keyword search + `pgvector` HNSW vector embeddings fused via Reciprocal Rank Fusion (RRF) and BGE reranking.
- **Official EPO OPS Adapter**: Live patent publication lookup, claims extraction, family data, and legal status verification via official EPO REST APIs.
- **Claim-Level Verification**: Answer claims are classified with confidence scores and mapped directly to supporting evidence snippets.
- **Interactive UI**: Sleek dark/light theme showing execution steps, evidence drawers, claim verification badges, and source links.
- **Research Evaluation Benchmark**: Built-in 30-question test harness comparing Baseline 1 (Basic Document RAG), Baseline 2 (Agentic RAG without claim verification), and Proposed System (Verified Agentic RAG).

---

## System Requirements

- **Python**: 3.12+
- **Node.js**: 20+
- **PostgreSQL**: 16+ with `pgvector` extension
- **OpenAI API Key**: required for embeddings and LLM reasoning

---

## Setup & Installation

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-username/patent-intelligence-rag.git
cd patent-intelligence-rag

cp .env.example .env
# Edit .env and supply your OPENAI_API_KEY and EPO_OPS credentials
```

### 2. Database Setup (PostgreSQL + pgvector)
```bash
brew install postgresql@16 pgvector
brew services start postgresql@16

createdb patent_rag_db
psql -d patent_rag_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 3. Backend Setup
```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

---

## Evaluation Benchmark

The system includes an empirical evaluation harness comparing:
1. **Baseline 1 (Basic Document RAG)**: Simple vector search over uploaded document.
2. **Baseline 2 (Unverified Agentic RAG)**: Multi-source search without claim verification.
3. **Proposed System (Verified Agentic RAG)**: Full document-first adaptive RAG with claim verification & bounded corrective loop.

Metrics evaluated:
- Answer Correctness & Hallucination Rate
- Claim Support Rate & Unsupported Claim Rate
- Citation Precision & Evidence Relevance
- External API Call Efficiency & Response Times

---

## Security & Limitations

- **API Keys**: Stored strictly in environment variables (`.env`).
- **Legal Disclaimer**: This system is a decision-support research tool and does not constitute formal patent or legal advice.
- **API Rate Limits**: EPO OPS calls obey official throttling limits.
