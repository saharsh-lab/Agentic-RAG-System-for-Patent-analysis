from abc import ABC, abstractmethod
from typing import List, Optional
from app.patents.models import PatentModelSchema, PatentSearchResponse


class BasePatentAdapter(ABC):
    @abstractmethod
    async def search(self, query: str, limit: int = 5) -> PatentSearchResponse:
        """Search for patents by query string or CQL expression."""
        pass

    @abstractmethod
    async def get_details(self, publication_number: str) -> Optional[PatentModelSchema]:
        """Fetch full details and abstract for a given publication number."""
        pass

    @abstractmethod
    async def get_claims(self, publication_number: str) -> List[str]:
        """Fetch claims list for a patent."""
        pass

    @abstractmethod
    async def get_legal_status(self, publication_number: str) -> Optional[str]:
        """Fetch current legal status (e.g. Granted, Pending, Lapsed)."""
        pass
