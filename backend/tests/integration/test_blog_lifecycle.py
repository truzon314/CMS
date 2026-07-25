"""Integration test for one full content-lifecycle flow (ROADMAP.md Phase 8)
— create, publish, confirm it's live on /public/blog, soft-delete, confirm
it disappears from /public/blog, restore from Trash, and confirm every step
along the way wrote a real audit_log row (Phase 6 regression coverage)."""

import uuid

import pytest


def _unique_slug() -> str:
    return f"test-post-{uuid.uuid4().hex[:8]}"


@pytest.mark.asyncio
async def test_blog_post_full_lifecycle(client, admin_headers):
    slug = _unique_slug()

    create_res = await client.post(
        "/api/v1/blog/posts",
        headers=admin_headers,
        json={
            "title": "A Test Post",
            "slug": slug,
            "excerpt": "An excerpt.",
            "body": "Body text.",
            "category_ids": [],
            "tag_ids": [],
            "is_featured": False,
        },
    )
    assert create_res.status_code == 200, create_res.text
    post_id = create_res.json()["data"]["id"]

    # Draft posts are never visible publicly.
    public_res = await client.get(f"/public/blog/{slug}")
    assert public_res.status_code == 404

    publish_res = await client.post(f"/api/v1/blog/posts/{post_id}/publish", headers=admin_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["data"]["status"] == "published"

    public_res = await client.get(f"/public/blog/{slug}")
    assert public_res.status_code == 200
    assert public_res.json()["data"]["title"] == "A Test Post"

    delete_res = await client.delete(f"/api/v1/blog/posts/{post_id}", headers=admin_headers)
    assert delete_res.status_code == 200

    public_res = await client.get(f"/public/blog/{slug}")
    assert public_res.status_code == 404

    trash_res = await client.get("/api/v1/trash?entity_type=blog_post", headers=admin_headers)
    assert trash_res.status_code == 200
    trashed_ids = [item["id"] for item in trash_res.json()["data"]]
    assert post_id in trashed_ids

    restore_res = await client.post(f"/api/v1/trash/blog_post/{post_id}/restore", headers=admin_headers)
    assert restore_res.status_code == 200

    public_res = await client.get(f"/public/blog/{slug}")
    assert public_res.status_code == 200

    audit_res = await client.get("/api/v1/audit-logs?entity_type=blog_post&per_page=50", headers=admin_headers)
    assert audit_res.status_code == 200
    actions = [row["action"] for row in audit_res.json()["data"] if row["entity_id"] == post_id]
    assert "blog.Created" in actions
    assert "blog.Published" in actions
    assert "blog.delete" in actions
    assert "blog.restore" in actions


@pytest.mark.asyncio
async def test_viewer_role_cannot_reach_a_manage_only_endpoint(client, admin_headers):
    roles_res = await client.get("/api/v1/roles", headers=admin_headers)
    viewer_role = next(r for r in roles_res.json()["data"] if r["name"] == "Viewer")

    email = f"viewer-{uuid.uuid4().hex[:8]}@example.com"
    create_res = await client.post(
        "/api/v1/users",
        headers=admin_headers,
        json={"email": email, "full_name": "Test Viewer", "role_id": viewer_role["id"], "password": "TestPass123!"},
    )
    assert create_res.status_code == 200, create_res.text

    login_res = await client.post("/api/v1/auth/login", json={"email": email, "password": "TestPass123!"})
    assert login_res.status_code == 200
    viewer_headers = {"Authorization": f"Bearer {login_res.json()['data']['access_token']}"}

    # Viewer has users.view-less/blog.view-only — creating a blog post needs blog.create.
    res = await client.post(
        "/api/v1/blog/posts",
        headers=viewer_headers,
        json={
            "title": "Should not be allowed",
            "slug": f"blocked-{uuid.uuid4().hex[:8]}",
            "excerpt": None,
            "body": None,
            "category_ids": [],
            "tag_ids": [],
            "is_featured": False,
        },
    )
    assert res.status_code == 403
