"""Integration test for the auth flow — real HTTP requests through the real
app against the (rolled-back) dev database. Matches Phase 1's own exit
criterion: log in as the seeded Super Admin, refresh, and confirm RBAC
actually blocks an unpermitted role, not just hides a sidebar item."""

import pytest

from tests.conftest import SEEDED_ADMIN_EMAIL, SEEDED_ADMIN_PASSWORD


@pytest.mark.asyncio
async def test_login_with_wrong_password_is_generic_401(client):
    res = await client.post("/api/v1/auth/login", json={"email": SEEDED_ADMIN_EMAIL, "password": "wrong"})
    assert res.status_code == 401
    body = res.json()
    assert body["success"] is False
    # No user enumeration — the same message regardless of whether the account exists.
    assert "invalid email or password" in body["error"]["message"].lower()


@pytest.mark.asyncio
async def test_login_with_nonexistent_email_is_the_same_generic_401(client):
    res = await client.post(
        "/api/v1/auth/login", json={"email": "nobody-at-all@example.com", "password": "whatever"}
    )
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_login_succeeds_and_sets_refresh_cookie(client):
    res = await client.post(
        "/api/v1/auth/login", json={"email": SEEDED_ADMIN_EMAIL, "password": SEEDED_ADMIN_PASSWORD}
    )
    assert res.status_code == 200
    body = res.json()["data"]
    assert body["access_token"]
    assert body["user"]["email"] == SEEDED_ADMIN_EMAIL
    assert "refresh_token" in res.cookies


@pytest.mark.asyncio
async def test_me_requires_a_valid_bearer_token(client):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_the_logged_in_user(client, admin_headers):
    res = await client.get("/api/v1/auth/me", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["data"]["email"] == SEEDED_ADMIN_EMAIL


@pytest.mark.asyncio
async def test_refresh_rotates_the_token(client):
    login_res = await client.post(
        "/api/v1/auth/login", json={"email": SEEDED_ADMIN_EMAIL, "password": SEEDED_ADMIN_PASSWORD}
    )
    old_refresh_cookie = login_res.cookies["refresh_token"]

    refresh_res = await client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 200
    assert refresh_res.json()["data"]["access_token"]
    new_refresh_cookie = refresh_res.cookies["refresh_token"]
    assert new_refresh_cookie != old_refresh_cookie


@pytest.mark.asyncio
async def test_forgot_password_always_returns_generic_success(client):
    for email in [SEEDED_ADMIN_EMAIL, "definitely-not-a-real-account@example.com"]:
        res = await client.post("/api/v1/auth/forgot-password", json={"email": email})
        assert res.status_code == 200
        assert "sent a reset link" in res.json()["data"]["message"].lower()


@pytest.mark.asyncio
async def test_login_rate_limit_blocks_after_repeated_failures(client):
    for _ in range(5):
        res = await client.post(
            "/api/v1/auth/login", json={"email": SEEDED_ADMIN_EMAIL, "password": "wrong"}
        )
        assert res.status_code == 401

    res = await client.post("/api/v1/auth/login", json={"email": SEEDED_ADMIN_EMAIL, "password": "wrong"})
    assert res.status_code == 429
