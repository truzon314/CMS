"""Integration tests run against the real dev database (no separate test DB
or new dependency needed) but every test is wrapped in an outer transaction
that's always rolled back — the app's services call `session.commit()`
internally throughout, so plain `session.begin()` nesting wouldn't isolate
anything; `join_transaction_mode="create_savepoint"` makes those inner
commits only release/recreate a SAVEPOINT, and the real commit never
happens (SQLAlchemy 2.0's documented pattern for exactly this situation).
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import _limiter
from app.database.session import engine, get_db
from app.main import app


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """The rate limiter (app/core/rate_limit.py) is a process-global
    in-memory singleton — reset it before each test so limits tripped by one
    test (e.g. repeated login attempts) don't bleed into the next."""
    _limiter._hits.clear()
    yield


@pytest_asyncio.fixture
async def db_session():
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


SEEDED_ADMIN_EMAIL = "admin@truzonhomes.com"
SEEDED_ADMIN_PASSWORD = "ChangeMe123!"


@pytest_asyncio.fixture
async def admin_token(client) -> str:
    res = await client.post(
        "/api/v1/auth/login", json={"email": SEEDED_ADMIN_EMAIL, "password": SEEDED_ADMIN_PASSWORD}
    )
    assert res.status_code == 200, res.text
    return res.json()["data"]["access_token"]


@pytest_asyncio.fixture
async def admin_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}
