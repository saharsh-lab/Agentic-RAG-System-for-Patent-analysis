# Comprehensive Project Reference: Agentic RAG for Multi-Source Patent Intelligence

This document contains a complete breakdown of where all source code, database tables, user data, conversation threads, vector embeddings, environment variables, logs, and artifacts are stored on disk.

---

## 1. Project Directory & File Structure

| Component | Absolute Path | Description |
| :--- | :--- | :--- |
| **Primary Project Root** | [`/Users/Saharsh/Documents/Major Project/patent-intelligence-rag`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag) | Main repository location |
| **IDE Scratch Directory** | [`/Users/Saharsh/.gemini/antigravity-ide/scratch/patent-intelligence-rag`](file:///Users/Saharsh/.gemini/antigravity-ide/scratch/patent-intelligence-rag) | Active runtime scratch workspace |
| **Backend API Source** | [`/Users/Saharsh/Documents/Major Project/patent-intelligence-rag/backend/app`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app) | FastAPI routers, agents, retrieval, verification, and RAG pipelines |
| **Frontend Web App Source** | [`/Users/Saharsh/Documents/Major Project/patent-intelligence-rag/frontend`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/frontend) | Next.js 14 App Router, Tailwind CSS B2B application shell |
| **Python Virtual Env** | [`/Users/Saharsh/Documents/Major Project/patent-intelligence-rag/backend/venv`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/venv) | Isolated Python 3.12 environment with dependencies |
| **Environment Config** | [`/Users/Saharsh/Documents/Major Project/patent-intelligence-rag/.env`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/.env) | Secret keys, database credentials, and service settings |

---

## 2. Database & Data Storage Details (`patent_rag_db`)

All persistent application data (documents, vector embeddings, user accounts, conversation threads, query history, and claim-level verification logs) is stored in **PostgreSQL 16** with `pgvector` HNSW vector indexes.

* **Database Engine**: PostgreSQL 16 (`/opt/homebrew/var/postgresql@16`)
* **Host / Port**: `localhost:5432`
* **Database Name**: `patent_rag_db`
* **Vector Column**: `document_chunks.embedding` (`VECTOR(1536)`)

### PostgreSQL Table Schema & Current Live Records

| Table Name | Description | Stored Information | Live Record Count |
| :--- | :--- | :--- | :--- |
| **`users`** | Account System | User IDs, emails, hashed passwords (`bcrypt`), full names, created timestamps | **2 Users** |
| **`conversations`** | Saved Chat Threads | Thread IDs, user links, thread title, document links, created/updated timestamps | **5 Threads** |
| **`documents`** | Uploaded Files | Filenames, file formats, file sizes, chunk counts, upload timestamps, user links | **30 Documents** |
| **`document_chunks`** | Vector Embeddings | Page numbers, section headers, text content, **`VECTOR(1536)` HNSW vectors** | **53 Chunks** |
| **`queries`** | Question Logs | User query strings, intent classifications (`DOCUMENT_ANALYSIS`, `PATENT_METADATA`, etc.) | **56 Queries** |
| **`answers`** | Generated Answers | Synthesized answer text, iteration counts, created timestamps | **56 Answers** |
| **`claims`** | Factual Claim Audits | Atomic statements, verification status (`SUPPORTED`, `PARTIAL`, `UNSUPPORTED`), confidence, explanations | **159 Claims** |
| **`patents`** | Live Patent Cache | Publication numbers, titles, abstracts, IPC/CPC codes, inventors, legal status | Cached dynamically |
| **`evidence`** | Evidence Provenance | Source types (`DOCUMENT`, `PATENT`, `WEB`), relevance scores, metadata JSON | Cached dynamically |

---

## 3. Environment Variables & API Key Configuration

The configuration file is located at [`.env`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/.env):

```env
# PostgreSQL Database Configuration (Port 5432 with pgvector)
POSTGRES_USER=Saharsh
POSTGRES_PASSWORD=
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=patent_rag_db
DATABASE_URL=postgresql+asyncpg://localhost:5432/patent_rag_db

# OpenAI API Credentials
OPENAI_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini

# EPO Open Patent Services (OPS) API Credentials (Live Authorized)
EPO_OPS_KEY=GUZZM3i1ShAaJsaeKAeEMHzDAWTv07padXDcJYa8U79gM2Sb
EPO_OPS_SECRET=Lgz7gDr6Xm7b7U0Be9AmhkB7VAkGz5KvFwi3pu9EPIOAZ5G1VeHgHtwaTcIi6rvH

# Web Research API Credentials (Tavily / DDG Fallback)
TAVILY_API_KEY=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

# Backend Service Limits
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
MAX_RESEARCH_ITERATIONS=3
```

---

## 4. Key Subsystem Implementations

### A. Document Parsing & Front-Page Chunk Guarantee
- File: [`parser.py`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app/documents/parser.py)
- Uses PyMuPDF (`fitz`) to extract text while preserving exact page numbers and section headers (`Abstract`, `Claims`, `Detailed Description`, `Field of Invention`).
- File: [`fusion.py`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app/retrieval/fusion.py)
- Guarantees Chunk 0 (Page 1) is always included in document context so patent metadata questions (*"When was this patent published?"*, *"Who are the assignees?"*) answer accurately.

### B. Live Patent Retrieval (EPO OPS REST API)
- File: [`epo.py`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app/patents/epo.py)
- Authenticates via OAuth client credentials grant (`https://ops.epo.org/3.2/auth/accesstoken`).
- Queries official European Patent Office REST endpoints for biblio, claims, legal status, and CQL patent search.

### C. Agentic RAG State Machine & Intent Analyzer
- File: [`analyzer.py`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app/agents/analyzer.py)
- Classifies queries into 5 intent categories: `DOCUMENT_ANALYSIS`, `PATENT_METADATA`, `LIVE_PATENT_SEARCH`, `EXTERNAL_RESEARCH`, `MULTI_SOURCE_COMPARISON`.
- File: [`sufficiency.py`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app/agents/sufficiency.py)
- Checks whether local document context is sufficient before escalating to live external patent/web research (max 3 iterations).

### D. Atomic Claim Extraction & Verification
- File: [`extractor.py`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app/verification/extractor.py) & [`verifier.py`](file:///Users/Saharsh/Documents/Major%20Project/patent-intelligence-rag/backend/app/verification/verifier.py)
- Decomposes generated answers into atomic factual claims and audits each claim against retrieved evidence, tagging status (`✓ Supported`, `⚠ Partially Supported`, `✗ Unsupported`).

---

## 5. Execution Commands & API Control

### Start Backend Server (FastAPI)
```bash
cd "/Users/Saharsh/Documents/Major Project/patent-intelligence-rag"
PYTHONPATH=backend backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- **Backend API URL**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **Health Endpoint**: `http://localhost:8000/api/v1/health`

### Start Frontend Application (Next.js 14)
```bash
cd "/Users/Saharsh/Documents/Major Project/patent-intelligence-rag/frontend"
npm run dev
```
- **Frontend App URL**: `http://localhost:3000`

### Access PostgreSQL Terminal Directly
```bash
psql -h localhost -p 5432 -U Saharsh -d patent_rag_db
```
