import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app
from app.patents.epo import epo_adapter


@pytest.mark.asyncio
async def test_epo_adapter_direct_methods():
    # 1. Test search
    res = await epo_adapter.search("solid-state battery")
    assert res.total_results >= 1
    assert len(res.results) > 0
    assert res.results[0].publication_number is not None

    # 2. Test get details
    details = await epo_adapter.get_details("EP3819283")
    assert details is not None
    assert details.publication_number == "EP3819283"
    assert len(details.claims) > 0

    # 3. Test legal status
    legal_status = await epo_adapter.get_legal_status("EP3819283")
    assert legal_status is not None
    assert "ACTIVE" in legal_status or "UNKNOWN" in legal_status


@pytest.mark.asyncio
async def test_patent_api_endpoints():
    transport = ASGITransport(app=fastapi_app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Search
        search_resp = await client.get("/api/v1/patents/search?q=battery")
        assert search_resp.status_code == 200
        search_data = search_resp.json()
        assert search_data["total_results"] >= 1

        # Details
        detail_resp = await client.get("/api/v1/patents/EP3819283")
        assert detail_resp.status_code == 200
        detail_data = detail_resp.json()
        assert detail_data["publication_number"] == "EP3819283"

        # Legal status
        status_resp = await client.get("/api/v1/patents/EP3819283/legal-status")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert status_data["publication_number"] == "EP3819283"
        assert "legal_status" in status_data
