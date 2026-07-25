# Truzon CMS — Architecture

Status: **skeleton only — no business logic yet.** This is deliverable #1 and #3 of the agreed
"before writing code" sequence (system architecture, folder structure). Remaining deliverables
(ER diagram, API docs, component hierarchy, nav flow, admin wireframes, roadmap, reusable
component list, security checklist) come next, in order, before any module gets built.

## Scope decisions (agreed)

- **Pages module is fixed to 5 types**: `home`, `about`, `projects`, `blog`, `contact`. Not an
  open-ended arbitrary-page builder — each type has a known, fixed slug and is composed of an
  ordered list of Blocks.
- **This project lives in its own directory**, sibling to `my-app` (the existing public Next.js
  site), because it's a different stack (FastAPI/Python backend) and a different audience (admin
  dashboard vs public marketing site).

## Two apps, one API

```
┌──────────────────────┐     ┌────────────────────────┐
│  Public site           │     │  Admin dashboard          │
│  (../my-app, Next.js)    │     │  (truzon-cms/frontend)      │
│  reads only, no auth      │     │  full CRUD, JWT auth'd        │
└──────────┬────────────┘     └──────────┬─────────────────┘
           │  GET /public/*                │  /api/v1/* (Authorization: Bearer <JWT>)
           └───────────────┬─────────────────┘
                           ▼
              ┌──────────────────────────────┐
              │   FastAPI backend (truzon-cms/backend) │
              └──────────────────────────────┘
                           ▼
                    PostgreSQL + Cloudflare R2
```

`my-app` currently sources content from `lib/constants/*.ts`. Once this CMS exists, those files
get replaced by fetch calls to `/public/*` endpoints (at build time via ISR/ `revalidate`, so the
public site stays fast and cacheable and never needs auth). The admin dashboard is the only
client of the authenticated `/api/v1/*` surface.

## Clean architecture layers (backend)

```
Presentation   (app/api/v1, app/api/public)
     ↓  Pydantic schemas in/out, no business logic, just validate + delegate
Application    (app/services)
     ↓  use-case orchestration, cross-entity business rules
Domain         (app/domain/entities, app/domain/repositories, app/domain/services)
     ↑  framework-free entities + abstract repository interfaces — no SQLAlchemy, no FastAPI
Infrastructure (app/repositories, app/database, app/storage, app/auth)
     implements the domain's repository interfaces (SQLAlchemy, R2 client, JWT/hashing)
     ↓
PostgreSQL / Cloudflare R2
```

**Dependency inversion, concretely**: `app/domain/repositories/page_repository.py` declares an
abstract `PageRepository` protocol (e.g. `get_by_slug`, `list`, `create`, `update`, `delete`).
`app/repositories/page_repository.py` implements it against SQLAlchemy. `app/services/page_service.py`
is constructed with a `PageRepository` (the interface, not the concrete class) — wiring which
concrete implementation gets injected happens once, in `app/core/container.py`, via FastAPI's
`Depends()`. Swapping Postgres for something else, or R2 for local disk in tests, is a container
change — service and route code never changes.

**Presentation never touches the ORM.** Routers call a service method and return its result
through a Pydantic response schema. All request validation is Pydantic; all business rules
("can't publish without a slug", "slug must be unique per page type") live in the service/domain
layer, not the route handler.

## Auth flow

1. `POST /api/v1/auth/login` — verify credentials (hashed password), issue a short-lived JWT
   access token + a long-lived refresh token (stored as an httpOnly, secure, SameSite cookie).
2. Every protected route depends on a `require_permission("...")` FastAPI dependency, which
   decodes the JWT, loads the user's role, and checks the role→permission mapping **from the
   database** (Roles/Permissions module) — never a hardcoded list.
3. `POST /api/v1/auth/refresh` rotates both tokens using the refresh cookie.
4. Forgot/reset password and email verification are separate token-based flows (short-lived,
   single-use tokens, not the session JWT).
5. Two-factor auth: architecture leaves a `user.two_factor_secret` / `two_factor_enabled` slot
   and a verification step in the login service, but isn't implemented yet.

## Storage flow (Media Library)

Upload → presentation layer validates MIME type + max size → `MediaService` (application layer)
coordinates → `StorageAdapter` (infrastructure interface, implemented by `r2_storage.py` for
prod and `local_storage.py` for dev/tests) uploads the object and returns a URL/key → persisted
in the `media` table with alt text, dimensions, and a `media_usage` join table tracking which
Pages/Blog posts/Properties reference it (so "usage tracking" and safe-delete checks are real
queries, not guesses).

## Modules

| Module | Notes |
|---|---|
| Dashboard | aggregate counts + recent activity, reads from other modules |
| Auth | login/logout/refresh/forgot/reset/verify-email, JWT + secure cookies |
| Users | admin-managed user accounts |
| Roles | Super Admin / Admin / Editor / Author / Viewer — seed data, not hardcoded |
| Permissions | configurable role→permission mapping (Create/Edit/Delete/Publish/Manage Users/Manage Media/Manage Settings/View Analytics/…) |
| **Pages** | **fixed 5 types**: home, about, projects, blog, contact — block-based content per page |
| Blog | posts (title, slug, category, tags, author, featured image, body, SEO, draft/schedule, reading time) |
| Properties | project/listing cards (name, location, type, price, specs, tags, status, budget bracket, images) — added beyond the base spec for this site's actual content |
| Categories & Tags | shared taxonomy, used by Blog and Properties |
| Media Library | folders, upload, compression, alt text, usage tracking |
| Menus | header nav + footer link columns |
| Forms | submissions from the site's callback/enquiry/contact forms |
| SEO | title/description/keywords/canonical/OG/Twitter/robots/JSON-LD — attached per Page/Blog post/Property, not a standalone CRUD |
| Settings | site name, logo, favicon, social links, SMTP, analytics IDs, contact info, theme, custom scripts |
| Notifications | in-app + email, success/error/warning/info |
| Audit Logs | user, action, timestamp, IP, device, affected resource — filterable, exportable |
| Version History | Pages, Blog posts, Settings — restorable |
| Search | global, across Pages/Blog/Users/Media/Settings/Menus/Forms |
| Trash | soft-delete + restore, applies across modules |
| Analytics | basic; deeper reporting deferred |

## Folder structure — backend (`truzon-cms/backend`)

```
backend/
  app/
    api/
      v1/            # authenticated admin CRUD routers (pages.py, blog.py, properties.py, media.py,
                      #   menus.py, forms.py, settings.py, users.py, roles.py, auth.py, dashboard.py,
                      #   audit_logs.py, search.py, ...)
      public/        # unauthenticated read-only routers the public site calls
    core/             # config.py, container.py (DI wiring), security.py, exceptions.py, logging.py
    domain/
      entities/        # framework-free dataclasses
      repositories/      # abstract repository interfaces
      services/           # pure business rules, no I/O
    schemas/              # Pydantic request/response DTOs
    services/              # application layer — use-case orchestration
    repositories/            # SQLAlchemy implementations of domain interfaces
    models/                   # SQLAlchemy ORM models
    database/                  # engine/session, Alembic migrations
    storage/                     # StorageAdapter + r2/local implementations
    auth/                         # JWT, RBAC helpers
    utils/                         # pagination, slugify, validators, response envelope
    main.py                        # app factory, router + middleware registration
  tests/
    unit/
    integration/
```

## Folder structure — admin frontend (`truzon-cms/frontend`)

```
frontend/
  app/
    (auth)/            # login, forgot-password, reset-password
    (dashboard)/         # sidebar+topbar shell layout, then one folder per module:
                          #   dashboard/, pages/[pageType]/, blog/{posts,categories,tags}/,
                          #   properties/[id]/, media/, menus/, forms/, seo/, settings/, users/,
                          #   roles/, audit-logs/, versions/
  components/
    ui/                 # shadcn/ui primitives
    layout/               # Sidebar, Topbar, Breadcrumbs
    blocks/                # one editor component per page-builder block type
    data-table/              # reusable table: sorting/filtering/pagination
    forms/                     # React Hook Form field wrappers
  modules/                      # feature-oriented composition per module (screens + local logic)
  hooks/                          # useAuth, usePermissions, useDebounce, ...
  lib/                             # api-client (fetch + auth refresh), query-client, utils
  services/                          # one file per API resource
  store/                               # Zustand — session/user, UI state
  types/                                # mirrors backend Pydantic schemas
  proxy.ts                               # route protection (Next.js 16 renamed middleware.ts -> proxy.ts)
```

## Next steps (in order, per the agreed process)

1. Database ER diagram
2. API documentation (endpoint list, request/response shapes)
3. Component hierarchy (admin frontend)
4. Navigation flow (admin frontend)
5. Wireframes for the admin dashboard
6. Development roadmap
7. Reusable UI component list
8. Security checklist

Then, only after those are reviewed: build module by module, starting with Auth + Users/Roles/
Permissions (everything else depends on them), then Pages, then Media, then Blog/Properties.
