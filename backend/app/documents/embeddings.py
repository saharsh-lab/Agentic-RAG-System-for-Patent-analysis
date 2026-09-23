import math
import hashlib
from typing import List
from openai import AsyncOpenAI
from app.config import settings


class EmbeddingGenerator:
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.EMBEDDING_MODEL
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        # If OpenAI API Key is provided, use OpenAI embeddings
        if self.client and self.api_key.startswith("sk-"):
            try:
                response = await self.client.embeddings.create(
                    input=texts,
                    model=self.model
                )
                return [data.embedding for data in response.data]
            except Exception as e:
                # Log and fallback to deterministic local embedding on API failure
                print(f"[EmbeddingGenerator] OpenAI API call failed: {e}. Using deterministic fallback.")
                return [self._generate_fallback_embedding(text) for text in texts]
        else:
            # Deterministic 1536-dimensional normalized embedding fallback for local/test use
            return [self._generate_fallback_embedding(text) for text in texts]

    async def generate_single_embedding(self, text: str) -> List[float]:
        res = await self.generate_embeddings([text])
        return res[0] if res else self._generate_fallback_embedding(text)

    def _generate_fallback_embedding(self, text: str, dim: int = 1536) -> List[float]:
        """Generates a deterministic 1536-dim unit vector from text hash."""
        vec = []
        text_bytes = text.encode("utf-8")
        for i in range(dim):
            h = hashlib.sha256(text_bytes + str(i).encode()).digest()
            val = (int.from_bytes(h[:4], "big") / 4294967295.0) * 2.0 - 1.0
            vec.append(val)
        
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec


embedding_generator = EmbeddingGenerator()
