import io
import fitz
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app
from app.database.connection import AsyncSessionLocal
from app.evaluation.benchmark import benchmark_evaluator


def create_sample_pdf_bytes() -> bytes:
    doc = fitz.open()
    page1 = doc.new_page()
    page1.insert_text((50, 50), "ABSTRACT\nThis patent discloses a solid-state electrolyte battery system with phase-change thermal management.")
    page1.insert_text((50, 150), "CLAIMS\n1. A solid-state lithium battery cell comprising a sulfide glass electrolyte.")
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


@pytest.mark.asyncio
async def test_benchmark_evaluator():
    pdf_bytes = create_sample_pdf_bytes()
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("patent_doc.pdf", pdf_bytes, "application/pdf")}
        u_resp = await client.post("/api/v1/documents/upload", files=files)
        doc_id = u_resp.json()["id"]

        async with AsyncSessionLocal() as db:
            results = await benchmark_evaluator.evaluate(db=db, document_id=doc_id)

            assert "baseline_1" in results
            assert "proposed_system" in results
            assert results["proposed_system"]["avg_claim_support_rate"] >= 0.0
            assert results["proposed_system"]["avg_unsupported_claim_rate"] <= 100.0
