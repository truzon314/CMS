# Truzon CMS — API Documentation

Deliverable #4 of the "before writing code" sequence. Covers every module from `ARCHITECTURE.md`
against the schema in `ERD.md`. No code yet — this is the contract the frontend (component
hierarchy, next deliverable) and backend implementation will both build against.

## Conventions

**Two API surfaces**, per `ARCHITECTURE.md`:

- **`/api/v1/*`** — authenticated admin CRUD. `Authorization: Bearer <access_token>`. Every route
  requires a specific permission key (from `permission.key` in the ERD), checked against the
  caller's role.
- **`/public/*`** — unauthenticated, read-only (except form submission). No cookies, no auth
  header, aggressively cacheable. This is the only surface `my-app` calls.

**Response envelope** — every endpoint, success or failure, returns this shape:

```json
{
  "success": true,
  "data": { },
  "meta": null,
  "error": null
}
```

List endpoints populate `meta`:

```json
{
  "success": true,
  "data": [ ],
  "meta": { "page": 1, "per_page": 20, "total": 143, "total_pages": 8 },
  "error": null
}
```

Failures (`success: false`, `data: null`, non-2xx status):

```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": { "code": "VALIDATION_ERROR", "message": "Slug already in use.", "details": { "slug": ["already exists"] } }
}
```

Error codes used consistently: `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `UNAUTHORIZED` (401),
`FORBIDDEN` (403 — authenticated but lacks the permission), `CONFLICT` (409 — e.g. duplicate
slug), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

**List query params** (every `GET` collection endpoint, except where noted):

| Param | Meaning | Example |
|---|---|---|
| `page` | 1-indexed page number, default 1 | `?page=2` |
| `per_page` | default 20, max 100 | `?per_page=50` |
| `sort` | field name; prefix `-` for descending | `?sort=-created_at` |
| `search` | free-text match on the entity's searchable fields | `?search=azure` |
| `status` | module-specific status filter | `?status=draft` |

**Permissions** are checked per-route against `permission.key`, e.g. `pages.edit`, `pages.publish`,
`media.manage`, `users.manage`, `settings.manage`, `blog.delete`, `properties.publish`. Not
exhaustively listed per route below — the pattern is `{module}.{action}` for
`{view, create, edit, delete, publish, manage}`.

---

## Public API (`/public/*`) — what `my-app` consumes

| Method | Path | Notes |
|---|---|---|
| GET | `/public/pages/{page_type}` | `page_type` ∈ `home,about,projects,blog,contact`. Returns published content only. 404 if unpublished/missing. |
| GET | `/public/blog` | List published posts. Query: `page`, `per_page`, `category`, `tag`, `search`. |
| GET | `/public/blog/{slug}` | Single published post. |
| GET | `/public/properties` | List published properties. Query: `page`, `per_page`, `city`, `type`, `budget`, `beds`, `min_area`, `signature` (bool, for Home's Signature Collections default view). |
| GET | `/public/properties/{slug}` | Single published property. |
| GET | `/public/menus/{key}` | `key` ∈ `header, footer_company, footer_properties, footer_resources, footer_legal`. Returns nested item tree. |
| GET | `/public/settings` | Public-safe subset only — site name, logo, favicon, social links, contact info. **Never** returns SMTP credentials or other secrets, regardless of what's stored in `setting`. |
| GET | `/public/categories` | Query: `applies_to=blog\|property`. For building filter UIs. |
| POST | `/public/forms/{form_key}` | `form_key` ∈ `hero_quick_enquiry, contact_callback`. Rate-limited (see Security checklist, deliverable #10). Body validated per form_key's field set. |

### `GET /public/pages/{page_type}` response shape

```json
{
  "success": true,
  "data": {
    "page_type": "home",
    "slug": "/",
    "title": "Home",
    "seo": {
      "seo_title": "Truzon Homes | Architectural Excellence Defined",
      "meta_description": "...",
      "canonical_url": "https://www.truzonhomes.com/",
      "og_image_url": "https://media.truzonhomes.com/...",
      "schema_jsonld": { }
    },
    "blocks": [
      { "id": "uuid", "type": "hero_banner", "position": 0, "config": { "headline": "Building Dreams.", "slides": [ ] } },
      { "id": "uuid", "type": "faq", "position": 7, "config": { "items": [ { "q": "...", "a": "..." } ] } }
    ]
  },
  "meta": null,
  "error": null
}
```

### `GET /public/properties` response shape

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "name": "The Azure Heights", "slug": "azure-heights",
      "city": "Hyderabad", "location_text": "Banjara Hills, Hyderabad",
      "type": "Apartments", "price_display": "₹4.5 Cr+", "budget_bracket": "2to5",
      "spec_a": "4 BHK", "spec_b": "3500 Sq.Ft", "beds_options": ["4"],
      "tag_text": "EXCLUSIVE", "status_text": "Ready to Move",
      "featured_image_url": "https://media.truzonhomes.com/..."
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 7, "total_pages": 1 },
  "error": null
}
```

---

## Admin API (`/api/v1/*`)

### Auth

| Method | Path | Permission |
|---|---|---|
| POST | `/api/v1/auth/login` | none (public, rate-limited) |
| POST | `/api/v1/auth/logout` | authenticated |
| POST | `/api/v1/auth/refresh` | valid refresh cookie |
| POST | `/api/v1/auth/forgot-password` | none (public, rate-limited) |
| POST | `/api/v1/auth/reset-password` | valid reset token |
| POST | `/api/v1/auth/verify-email` | valid verification token |
| GET | `/api/v1/auth/me` | authenticated |

`POST /auth/login` request: `{ "email": "...", "password": "..." }`. Response sets the refresh
token as an httpOnly secure cookie and returns `{ "access_token": "...", "expires_in": 900, "user": { ... } }`
in `data`.

### Users, Roles, Permissions

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/users` | `users.view` |
| POST | `/api/v1/users` | `users.manage` |
| GET | `/api/v1/users/{id}` | `users.view` |
| PUT | `/api/v1/users/{id}` | `users.manage` |
| DELETE | `/api/v1/users/{id}` | `users.manage` — soft delete |
| POST | `/api/v1/users/{id}/restore` | `users.manage` |
| GET | `/api/v1/roles` | `users.manage` |
| POST | `/api/v1/roles` | `users.manage` |
| PUT | `/api/v1/roles/{id}` | `users.manage` |
| DELETE | `/api/v1/roles/{id}` | `users.manage` — blocked if `role.is_system` |
| PUT | `/api/v1/roles/{id}/permissions` | `users.manage` — body: `{ "permission_ids": ["uuid", ...] }` (full replace) |
| GET | `/api/v1/permissions` | `users.manage` — read-only catalog |

### Pages (fixed 5 types)

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/pages` | `pages.view` — all 5, with status |
| GET | `/api/v1/pages/{page_type}` | `pages.view` — full draft content |
| PUT | `/api/v1/pages/{page_type}` | `pages.edit` — title, seo |
| POST | `/api/v1/pages/{page_type}/publish` | `pages.publish` |
| POST | `/api/v1/pages/{page_type}/unpublish` | `pages.publish` |
| POST | `/api/v1/pages/{page_type}/schedule` | `pages.publish` — body: `{ "scheduled_at": "ISO8601" }` |
| GET | `/api/v1/pages/{page_type}/preview` | `pages.view` — draft render, bypasses published-only filter |
| GET | `/api/v1/pages/{page_type}/blocks` | `pages.view` |
| POST | `/api/v1/pages/{page_type}/blocks` | `pages.edit` — body: `{ "block_definition_id": "uuid", "position": 3, "config": { } }` |
| PUT | `/api/v1/pages/{page_type}/blocks/{block_id}` | `pages.edit` |
| DELETE | `/api/v1/pages/{page_type}/blocks/{block_id}` | `pages.edit` |
| PUT | `/api/v1/pages/{page_type}/blocks/reorder` | `pages.edit` — body: `{ "order": ["block_id_1", "block_id_2", ...] }` |
| GET | `/api/v1/pages/{page_type}/versions` | `pages.view` |
| POST | `/api/v1/pages/{page_type}/versions/{version_id}/restore` | `pages.edit` |
| GET | `/api/v1/block-definitions` | `pages.view` — catalog for the builder's block palette |

### Blog

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/blog/posts` | `blog.view` — filters: `status`, `category`, `tag`, `author_id` |
| POST | `/api/v1/blog/posts` | `blog.create` |
| GET | `/api/v1/blog/posts/{id}` | `blog.view` |
| PUT | `/api/v1/blog/posts/{id}` | `blog.edit` |
| DELETE | `/api/v1/blog/posts/{id}` | `blog.delete` — soft delete |
| POST | `/api/v1/blog/posts/{id}/restore` | `blog.delete` |
| POST | `/api/v1/blog/posts/{id}/duplicate` | `blog.create` |
| POST | `/api/v1/blog/posts/{id}/publish` \| `/unpublish` | `blog.publish` |
| POST | `/api/v1/blog/posts/{id}/schedule` | `blog.publish` |
| GET | `/api/v1/blog/posts/{id}/versions` | `blog.view` |
| POST | `/api/v1/blog/posts/{id}/versions/{version_id}/restore` | `blog.edit` |

### Properties

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/properties` | `properties.view` — filters: `status`, `city`, `type`, `budget_bracket` |
| POST | `/api/v1/properties` | `properties.create` |
| GET | `/api/v1/properties/{id}` | `properties.view` |
| PUT | `/api/v1/properties/{id}` | `properties.edit` |
| DELETE | `/api/v1/properties/{id}` | `properties.delete` — soft delete |
| POST | `/api/v1/properties/{id}/restore` | `properties.delete` |
| POST | `/api/v1/properties/{id}/duplicate` | `properties.create` |
| PUT | `/api/v1/properties/{id}/gallery` | `properties.edit` — body: `{ "media_ids": ["uuid", ...] }` (ordered) |
| POST | `/api/v1/properties/{id}/publish` \| `/unpublish` | `properties.publish` |

### Categories & Tags

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/api/v1/categories` | `blog.edit` or `properties.edit` |
| PUT/DELETE | `/api/v1/categories/{id}` | same |
| GET/POST | `/api/v1/tags` | `blog.edit` |
| PUT/DELETE | `/api/v1/tags/{id}` | `blog.edit` |

### Media Library

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/media` | `media.view` — filters: `folder_id`, `mime_type`, `search` |
| POST | `/api/v1/media` | `media.manage` — multipart, accepts multiple files (bulk upload) |
| GET | `/api/v1/media/{id}` | `media.view` |
| PUT | `/api/v1/media/{id}` | `media.manage` — alt text, filename, `folder_id` |
| DELETE | `/api/v1/media/{id}` | `media.manage` — blocked with `409 CONFLICT` if `media_usage` rows exist, unless `?force=true` |
| GET | `/api/v1/media/{id}/usage` | `media.view` — returns the `media_usage` rows (what references it) |
| GET/POST | `/api/v1/media/folders` | `media.manage` |
| PUT/DELETE | `/api/v1/media/folders/{id}` | `media.manage` |

### Menus

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/menus` | `settings.manage` |
| GET | `/api/v1/menus/{key}` | `settings.manage` |
| PUT | `/api/v1/menus/{key}/items` | `settings.manage` — full tree replace: `{ "items": [ { "label", "url"?, "page_id"?, "children": [ ] } ] }` |

### Forms

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/forms/submissions` | `forms.view` — filters: `form_key`, `status` |
| GET | `/api/v1/forms/submissions/{id}` | `forms.view` |
| PUT | `/api/v1/forms/submissions/{id}` | `forms.manage` — update `status`, `assigned_to` |
| DELETE | `/api/v1/forms/submissions/{id}` | `forms.manage` |
| GET | `/api/v1/forms/submissions/export` | `forms.view` — CSV stream |

### Settings

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/settings` | `settings.manage` |
| PUT | `/api/v1/settings` | `settings.manage` — body: `{ "site_name": "...", "smtp_host": "...", ... }` (partial update of known keys) |
| GET | `/api/v1/settings/versions` | `settings.manage` |
| POST | `/api/v1/settings/versions/{version_id}/restore` | `settings.manage` |

SEO has no standalone CRUD — it's embedded in the `PUT` payload for Pages/Blog/Properties (a
nested `seo` object), matching `ERD.md`'s one-to-one `seo_id` design.

### Notifications, Audit Logs, Search, Dashboard, Trash

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/notifications` | authenticated — current user's own |
| PUT | `/api/v1/notifications/{id}/read` | authenticated |
| PUT | `/api/v1/notifications/read-all` | authenticated |
| DELETE | `/api/v1/notifications/{id}` | authenticated |
| GET | `/api/v1/audit-logs` | `analytics.view` — filters: `user_id`, `action`, `entity_type`, `date_from`, `date_to` |
| GET | `/api/v1/audit-logs/export` | `analytics.view` — CSV stream |
| GET | `/api/v1/search?q=` | authenticated — grouped results: `{ "pages": [...], "blog_posts": [...], "properties": [...], "media": [...], "users": [...] }` |
| GET | `/api/v1/dashboard/stats` | authenticated |
| GET | `/api/v1/dashboard/recent-activity` | authenticated |
| GET | `/api/v1/trash` | `{module}.delete` — grouped by `entity_type` |
| POST | `/api/v1/trash/{entity_type}/{id}/restore` | `{module}.delete` |
| DELETE | `/api/v1/trash/{entity_type}/{id}` | `{module}.delete` — permanent |

`GET /dashboard/stats` response: `{ "total_users", "published_pages", "draft_pages", "total_blog_posts",
"storage_used_bytes", "pending_reviews", "recent_logins": [...], "latest_uploads": [...] }`.

---

## Next

Deliverable #5: **component hierarchy** for the admin frontend, built directly against this API
surface (one module screen ≈ one or two endpoints above).
