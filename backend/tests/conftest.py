import pytest
import pytest_asyncio
from app.database.connection import engine, Base
from app.database import models  # Registers models


@pytest_asyncio.fixture(scope="function", autouse=True)
async def db_setup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
