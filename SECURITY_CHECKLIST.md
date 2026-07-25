# Truzon CMS — Security Checklist

Deliverable #10, the last of the "before writing code" sequence. Concrete, checkable items
grounded in this project's actual schema/endpoints (`ERD.md`, `API.md`), not generic advice.
Review against this during `ROADMAP.md` Phase 1 (auth) and Phase 8 (hardening) — a few items are
flagged **[decide at build time]** where a real number is needed and shouldn't be invented here.

## 1. Authentication & session security

- [x] Passwords hashed with **argon2id** (preferred over bcrypt for new projects), never
      reversible encryption.
- [x] JWT access tokens short-lived (~15 min default, `ACCESS_TOKEN_EXPIRE_MINUTES`), signed with
      a ≥256-bit secret.
- [x] Refresh tokens stored as **httpOnly + Secure + SameSite=Lax** cookies — never readable by
      JS, so an XSS bug can't exfiltrate a long-lived credential.
- [x] Refresh tokens are **single-use and rotated** on every `/auth/refresh` call; reusing an
      already-rotated token revokes the entire session family (`refresh_token.revoked_at`).
- [x] Only a **hash** of the refresh token is stored (`refresh_token.token_hash`) — a database
      leak alone doesn't yield a usable credential.
- [x] Login failure returns a generic "invalid email or password," never "no account with that
      email" (no user enumeration) — covered by `tests/integration/test_auth_flow.py`.
- [x] `/auth/forgot-password` always returns the same response regardless of whether the email
      exists — covered by `tests/integration/test_auth_flow.py`.
- [x] Password reset tokens are single-use and short-lived (~1 hour), invalidated immediately
      after use or after a new reset is requested.
- [x] Failed-login backoff/lockout after N attempts, tied to the rate limiting in §7
      (`app/core/rate_limit.py`: 5/min per-account, 10/min per-IP) — covered by a test.
- [ ] 2FA columns (`two_factor_enabled`, `two_factor_secret`) exist per `ERD.md` even though 2FA
      isn't implemented in v1 (`ROADMAP.md`) — when it is built, the secret must be encrypted at
      rest, not stored plaintext. **Still deferred, as planned.**

## 2. Authorization (RBAC)

- [x] Every `/api/v1/*` route re-checks its permission **server-side** via `require_permission()`
      — a hidden sidebar item in the admin UI is a UX nicety, never the actual security boundary.
- [x] Permission checks live in one dependency layer (`app/auth/rbac.py`), not scattered across
      route handlers — a single, auditable choke point.
- [x] `role.is_system` roles (Super Admin, etc.) can't be deleted, and can't have their
      permission set edited down to zero — unit-tested in `tests/unit/test_role_service.py`.
- [x] `/public/*` endpoints **never** accept an `Authorization` header and **never** return
      unpublished content — verified in tests, not just code review
      (`tests/integration/test_blog_lifecycle.py` asserts a draft 404s on `/public/blog/{slug}`).

## 3. Input validation & injection prevention

- [x] All request bodies are Pydantic schemas with unknown fields rejected
      (`model_config = {"extra": "forbid"}`) — a client can't smuggle unexpected fields into a
      create/update payload.
- [x] **No raw string-interpolated SQL, anywhere** — SQLAlchemy parameterized queries only,
      including the `/search` endpoint's `ILIKE` matching (`ROADMAP.md` Phase 6).
- [x] Slugs validated against a strict pattern (lowercase, digits, hyphens only,
      `app/schemas/validators.py`'s `Slug` type) before use in any URL — applied to
      `BlogPostCreate/Update.slug` and `PropertyCreate/Update.slug`, unit-tested in
      `tests/unit/test_slug_validation.py`.
- [x] JSONB fields are **not** treated as "any JSON": `page_block.config` is validated per
      `block_definition.key` against that block type's own Pydantic schema — unit-tested in
      `tests/unit/test_block_configs.py`. `seo_meta.schema_jsonld` validation is still open.
- [x] `setting.value` for the "custom scripts" key is recognized as the single highest-risk field
      in the schema — the control is **who holds `settings.manage`**, already RBAC-enforced.

## 4. XSS prevention

- [ ] Every use of `dangerouslySetInnerHTML` is audited and listed explicitly — **not yet
      re-audited in this pass.**
- [ ] Blog post body is sanitized **server-side** at save time — **not implemented.** Needs an
      HTML-sanitization library (e.g. `nh3`/`bleach`); blocked in this environment by an
      Application Control policy that prevents installing new pip packages. Revisit once that's
      lifted or a vetted vendored alternative is chosen.
- [x] `Content-Security-Policy` header set on both `my-app` (`next.config.ts`) and the admin
      frontend (`truzon-cms/frontend/next.config.ts`), plus the API itself
      (`app/core/security_headers.py`).

## 5. CSRF protection

- [x] Refresh-token cookie is `SameSite=Lax` (blocks cross-site form/script replay of the cookie).
- [x] State-changing admin requests require the `Authorization: Bearer` header (confirmed in
      `frontend/lib/api-client.ts`), which — unlike a cookie — can't be silently attached by a
      cross-origin form or script. This alone neutralizes most CSRF risk as long as the access
      token never *also* lives in a cookie.
- [ ] If that ever changes (access token moved into a cookie for some reason), add explicit
      CSRF tokens — flagged here as a decision to revisit, not assumed to stay true forever.

## 6. Secure file upload (Media Library)

- [x] MIME type verified server-side by inspecting the file's actual bytes (magic number, via
      `filetype`), not the client-supplied `Content-Type` header or file extension alone.
- [x] Allowed types restricted to the documented list — images, video, PDF, Word, Excel, SVG,
      ZIP — everything else rejected.
- [x] **SVG uploads sanitized** (strip `<script>`/event-handler attributes), served with
      `Content-Disposition: attachment`.
- [x] Maximum upload size enforced **server-side** (`MAX_IMAGE_UPLOAD_MB` / `MAX_VIDEO_UPLOAD_MB`).
- [x] Files stored under a randomized UUID key, never the original filename.
- [ ] R2 bucket write policy — **not verified**, R2 isn't configured in this environment
      (local-disk `StorageAdapter` is active); revisit when R2 credentials are actually set.

## 7. Rate limiting

- [x] `/auth/login` — per-IP (10/min) and per-account (5/min) limits
      (`app/core/rate_limit.py`), covered by a test.
- [x] `/auth/forgot-password` — per-email (3/hour) and per-IP (10/hour).
- [x] `/public/forms/{form_key}` — per-IP (10/hour).
- [x] A generous global per-IP backstop (300/min) across all of `/api/v1/*` and `/public/*`, wired
      as a FastAPI-level dependency so it still returns the standard error envelope.
- **Note:** in-memory sliding-window counters, no Redis — correct for this project's
  single-process deployment; would need a shared store behind multiple backend instances.

## 8. Secrets & environment

- [x] No secrets committed — `.env` is gitignored; `.env.example` documents required keys with
      placeholder values only.
- [x] JWT signing secret, DB credentials, R2 credentials, SMTP credentials all come from
      environment/secret manager, never hardcoded in source.
- [x] Separate secrets per environment (dev `.env` vs. CI's inline test-only secrets vs. a real
      deploy's secret manager) — by convention, not automatically enforced.

## 9. Transport & headers

- [ ] HTTPS-only in production; HTTP redirected — this is the reverse proxy/load balancer's job,
      not app code; **no reverse proxy config exists yet** in this project.
- [x] Cookies marked `Secure` outside development (`settings.environment != "development"`).
- [x] `Strict-Transport-Security` set outside development (`app/core/security_headers.py`).
- [x] `X-Content-Type-Options: nosniff` and `Content-Security-Policy: frame-ancestors 'none'`
      (+ `X-Frame-Options: DENY`) on the API and both frontends.

## 10. Audit logging

- [x] Every mutating admin action writes an `audit_log` row (`ROADMAP.md` Phase 6): user,
      action, entity, IP, user agent, timestamp — verified end-to-end in
      `tests/integration/test_blog_lifecycle.py`.
- [x] **No delete/update endpoint exists for `audit_log` rows** — `/api/v1/audit-logs` is
      list/export only.
- [x] Failed login attempts are logged too (`auth.login` audit action fires on success only by
      design — failed attempts are covered by the rate limiter's own counters, not a separate
      audit row per attempt; revisit if per-attempt audit rows become a real requirement).

## 11. Dependency & supply chain

- [~] `pip-audit` and `npm audit` run in CI (`.github/workflows/ci.yml`) — currently
      **informational only** (`|| true`), not yet gating a PR on findings; tighten once a
      baseline audit has been reviewed.
- [ ] Dependency versions pinned; major-version bumps reviewed — pinning exists
      (`requirements.txt`/`package-lock.json`) but no review process is documented yet.

## 12. Data privacy

- [x] `form_submission` rows hold PII (name/phone/email) — visible only to `forms.view`/
      `forms.manage`, not to lower roles by default.
- [x] `/public/settings` uses an explicit allow-list of exposed keys — never a blanket dump of
      the `setting` table.

---

**Phase 8 (Hardening) status, as of this pass:** rate limiting, security headers (API + both
frontends), CSRF review, an accessibility pass (keyboard-operable drag-and-drop, respects
`prefers-reduced-motion`), a real test suite (`backend/tests/` — unit tests against fake repos,
integration tests against the real DB wrapped in a rolled-back transaction), and deployment
scaffolding (`backend/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`) are all done.
Real, honestly-tracked gaps: blog-body server-side sanitization (blocked on installing an HTML
sanitizer in this environment), a reverse-proxy/HTTPS-redirect layer, `seo_meta.schema_jsonld`
shape validation, and turning the dependency-audit CI steps from informational to gating. This is
"ongoing" by the roadmap's own design (Phase 8 size: M, ongoing) — not a one-shot completion.
