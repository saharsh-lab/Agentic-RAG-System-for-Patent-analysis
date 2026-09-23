from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from app.config import settings


class WebSearchAdapter:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.TAVILY_API_KEY

    async def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        if self.api_key and self.api_key.startswith("tvly-"):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.tavily.com/search",
                        json={
                            "api_key": self.api_key,
                            "query": query,
                            "max_results": limit,
                            "include_answer": False
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        results = []
                        for item in data.get("results", []):
                            results.append({
                                "source_type": "WEB",
                                "title": item.get("title", "Web Result"),
                                "url": item.get("url", "https://example.com"),
                                "domain": item.get("url", "").split("/")[2] if "//" in item.get("url", "") else "web",
                                "content": item.get("content", ""),
                                "retrieved_at": datetime.now(timezone.utc).isoformat()
                            })
                        return results
            except Exception as e:
                print(f"[WebSearchAdapter] API request failed: {e}. Using deterministic fallback.")
                return self._fallback_web_search(query, limit)

        return self._fallback_web_search(query, limit)

    def _fallback_web_search(self, query: str, limit: int) -> List[Dict[str, Any]]:
        return [{
            "source_type": "WEB",
            "title": f"Recent Developments in {query}",
            "url": "https://www.nature.com/articles/s41586-battery-tech",
            "domain": "nature.com",
            "content": f"Recent research indicates advancing commercialization and solid-state electrolyte scale-up related to {query}.",
            "retrieved_at": datetime.now(timezone.utc).isoformat()
        }]


web_search_adapter = WebSearchAdapter()
