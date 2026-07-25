# Truzon CMS

A modular content management system for the Truzon Homes site: a FastAPI + PostgreSQL backend,
and a Next.js admin dashboard. The public site (`../WebPage`) reads all of its content — pages,
blog, properties, navigation, settings, and lead-capture forms — from this CMS's public API.

**Status**: all 9 phases of `ROADMAP.md` are done and verified, plus a first hardening pass
(`SECURITY_CHECKLIST.md`). A companion `SEO_ROADMAP.md` plans a further, not-yet-started SEO
Management module as a separate, additive phase set.

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design, clean-architecture layers, folder structure
- [ERD.md](./ERD.md) — database schema
- [API.md](./API.md) — REST API reference (public + admin)
- [COMPONENT_HIERARCHY.md](./COMPONENT_HIERARCHY.md) — admin frontend component tree
- [NAVIGATION_FLOW.md](./NAVIGATION_FLOW.md) — route map + user-journey flows
- [wireframes.html](./wireframes.html) — low-fidelity screen wireframes
- [ROADMAP.md](./ROADMAP.md) — phase-by-phase build plan (all 9 phases complete)
- [REUSABLE_COMPONENTS.md](./REUSABLE_COMPONENTS.md) — shared component prop/variant spec
- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) — concrete, project-specific security checklist
- [SEO_ROADMAP.md](./SEO_ROADMAP.md) — planned SEO Management module (not started)

## What's here

- **Auth** — JWT access + rotating refresh tokens (httpOnly/Secure/SameSite cookie), RBAC via a
  single `require_permission()` choke point, forgot/reset password, email verification.
- **Pages & Block Builder** — 5 fixed pages (Home/About/Projects/Blog/Contact), an 18-block-type
  drag-and-drop page builder, SEO metadata, version history with restore.
- **Media Library** — folders, upload with real MIME-sniffing and SVG sanitization, usage
  tracking (delete-with-usage-warning), local disk or Cloudflare R2 storage.
- **Blog & Properties** — full CRUD, publish/schedule/duplicate, categories/tags, image galleries.
- **Menus, Forms, Settings** — nested drag-reorder menus, lead-capture form submissions, a
  key-value Settings store (SMTP, contact info, analytics IDs, social links) with its own version
  history.
- **Ops layer** — append-only audit log (every mutating action, IP, user agent), in-app
  notifications, global `⌘K` search, a Trash view for soft-deleted content, a real-data dashboard.
- **Public API** (`/public/*`) — unauthenticated, published-only, no admin surface exposed — the
  only thing the public site is allowed to call.
- **Hardening** — rate limiting (login/forgot-password/public forms + a global backstop), security
  headers, a real pytest suite (unit + integration), CI, and a Dockerfile.

## Layout

```
backend/            FastAPI, SQLAlchemy (async), Alembic, PostgreSQL
  app/
    api/v1/           Authenticated admin routes (Bearer token, permission-gated)
    api/public/       Unauthenticated public routes
    domain/           Repository Protocol interfaces (no DB import here)
    repositories/     SQLAlchemy implementations of those interfaces
    services/         Business logic — depends on domain interfaces, not concrete repos
    core/             DI container, config, rate limiting, security headers, audit context
  tests/
    unit/             Pure business-rule tests, fake in-memory repos, no DB
    integration/       Real HTTP requests against the real DB, wrapped in a rolled-back transaction
  Dockerfile

frontend/            Next.js (App Router) admin dashboard — TypeScript, Tailwind, shadcn/ui,
                      TanStack Query, Zustand

.github/workflows/ci.yml   Lint + test (backend), typecheck + lint + build (frontend)
docker-compose.yml         Postgres + backend for a one-command local stack
```

## Running locally

### Database

Native PostgreSQL install or `docker compose up -d postgres` — same schema either way. Create a
dedicated app role (never run the app as the postgres superuser):

```sql
CREATE ROLE truzon_cms_app LOGIN PASSWORD '...';
CREATE DATABASE truzon_cms OWNER truzon_cms_app;
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # or `source .venv/bin/activate` on macOS/Linux
pip install -r requirements-dev.txt
copy .env.example .env          # then fill in DATABASE_URL / JWT_SECRET_KEY
alembic upgrade head
python -m app.core.seed         # roles, permissions, a Super Admin, the 5 fixed pages/menus
uvicorn app.main:app --reload --port 8000
```

`GET http://localhost:8000/health` should return
`{"success":true,"data":{"status":"ok","environment":"development"}}`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:3001** (3000 is the public site). Log in with the Super Admin printed
by the seed script.

### Tests

```bash
cd backend
pytest tests -v
```

Integration tests run against the real dev database but every test is wrapped in a transaction
that's always rolled back — nothing persists.

### Docker

```bash
docker compose up --build
```

Brings up Postgres + the backend together; runs Alembic migrations automatically on start.

## Related

- **Truzon Homes public site** — the Next.js marketing site this CMS serves content to.
