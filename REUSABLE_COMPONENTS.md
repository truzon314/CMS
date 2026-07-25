# Truzon CMS — Reusable UI Component List

Deliverable #9 of the "before writing code" sequence. Concrete prop/variant spec for every shared
component named in `COMPONENT_HIERARCHY.md` and shown in `wireframes.html`. Built on shadcn/ui
primitives; this is the layer above those primitives that's specific to this CMS.

## Layout (`components/layout/`)

### `Sidebar`
Permission-filtered nav, collapsible.
| Prop | Type | Notes |
|---|---|---|
| `items` | `NavGroup[]` | groups per `wireframes.html` (Content / Site / Admin), each item hidden if the current user lacks the matching `.view` permission |
| `collapsed` | `boolean` | icon-only rail mode |
| `onToggleCollapse` | `() => void` | |
| `activeHref` | `string` | highlights the current route |

### `Topbar`
| Prop | Type | Notes |
|---|---|---|
| `breadcrumbs` | `{ label, href? }[]` | last item bold, no link |
| `onSearchClick` | `() => void` | opens `GlobalSearchOverlay` |
| `unreadNotificationCount` | `number` | badge dot on the bell if > 0 |
| `user` | `{ name, avatarUrl }` | drives the user menu |

### `PageContainer`
Every module screen's outer wrapper — title + actions row, then content.
| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | |
| `actions` | `ReactNode` | e.g. the "New Post" button |
| `children` | `ReactNode` | |

### `Breadcrumbs`
Standalone if not using `Topbar`'s built-in slot. `items: { label, href? }[]`.

## Data table (`components/data-table/`)

### `DataTable<T>`
Used by Blog, Properties, Users, Forms, Audit Logs, Roles.
| Prop | Type | Notes |
|---|---|---|
| `columns` | `ColumnDef<T>[]` | `{ id, header, cell: (row) => ReactNode, sortable? }` |
| `data` | `T[]` | |
| `isLoading` | `boolean` | renders `LoadingSkeleton variant="table"` |
| `page`, `perPage`, `total` | `number` | drives `Pagination` |
| `onPageChange` | `(page: number) => void` | |
| `sort` | `{ field: string; direction: 'asc'\|'desc' } \| null` | |
| `onSortChange` | `(sort) => void` | |
| `selectable` | `boolean` | adds the checkbox column |
| `selectedIds` | `Set<string>` | |
| `onSelectionChange` | `(ids: Set<string>) => void` | |
| `onRowClick` | `(row: T) => void` | navigates to the row's editor |
| `emptyState` | `ReactNode` | falls back to a default `EmptyState` |

States: loading → skeleton rows; zero rows → `EmptyState`; fetch error → inline error banner with
a "Retry" button (no silent failure).

### `TableToolbar`
| Prop | Type | Notes |
|---|---|---|
| `searchValue`, `onSearchChange` | `string`, `(v) => void` | debounced 300ms before firing the query |
| `filters` | `{ key, label, options, value, onChange }[]` | renders one `Select` per filter |
| `primaryAction` | `{ label, icon?, onClick }` | e.g. "New Post" |
| `selectionCount` | `number` | when > 0, swaps to `BulkActionsBar` in the same slot |

### `BulkActionsBar`
`selectedCount: number`, `actions: { label, icon?, variant?, confirm?: boolean, onClick }[]`,
`onClearSelection: () => void`. `confirm: true` routes the action through `ConfirmDialog` first.

### `Pagination`
`page`, `perPage`, `total`, `onPageChange`, `perPageOptions?: number[]` (default `[20, 50, 100]`).
Two visual densities: compact (‹ 1 2 3 ›) and labeled ("Showing 1–20 of 143") — `DataTable` uses
the labeled variant per the wireframes.

## Feedback & overlays (`components/ui/`)

### `StatusPill`
| Prop | Type |
|---|---|
| `status` | module-specific union: `'draft'\|'published'\|'scheduled'\|'archived'` (content) or `'new'\|'contacted'\|'closed'` (forms) |
| `size` | `'sm' \| 'md'` |

Color mapping is **semantic, not the brand accent** (per design fundamentals — status color and
accent hue are kept separate): draft = neutral, published = success green, scheduled = amber,
archived = slate, new = info blue, contacted = amber, closed = neutral.

### `ConfirmDialog`
Built on `Modal`. `open`, `title`, `description`, `confirmLabel`, `cancelLabel`,
`variant: 'default' | 'destructive'`, `isLoading` (spinner on the confirm button while the
mutation is in flight), `onConfirm`, `onCancel`.

### `Drawer`
Slide-over from the right. Backs `VersionHistoryDrawer`, `MediaDetailsDrawer`,
`SubmissionDetailsDrawer`, `UserEditorDrawer`, `RoleEditorDrawer`.
`open`, `onClose`, `title`, `width: 'sm' | 'md' | 'lg'`, `children`, `footer?`.

### `Modal`
Centered dialog. Backs `BlockPalette`, `MediaPicker`, `ConfirmDialog`.
`open`, `onClose`, `title`, `size: 'sm' | 'md' | 'lg' | 'xl'`, `children`.

### `Toast`
Imperative, not prop-driven: `toast.success(msg)`, `toast.error(msg)`, `toast.warning(msg)`,
`toast.info(msg)`, each optionally `{ description, action: { label, onClick } }`. Bottom-right,
success/info auto-dismiss ~4s, error/warning stay until dismissed.

### `EmptyState`
`icon`, `title`, `description`, `action?: { label, onClick }`. Used for zero-row tables, an empty
Media folder, empty Trash, and no search results.

### `LoadingSkeleton`
`variant: 'table' | 'card' | 'text'`, `rows?: number`. Shimmer placeholder, respects
`prefers-reduced-motion` (static pulse instead of shimmer animation).

### `StatCard`
`label`, `value`, `icon?`, `isLoading`. Dashboard-only; no click action.

### `PermissionMatrix`
`permissions: Permission[]` (grouped by `module` — Pages/Blog/Properties/Media/Users/Settings/
Analytics), `selectedIds: Set<string>`, `onChange`, `readOnly?: boolean` (true when editing a
`role.is_system` row — view-only, matches `API.md`'s block on deleting system roles).

## Content-editing panels (shared across Pages / Blog / Properties)

### `SeoPanel`
`value: SeoMeta`, `onChange: (seo: SeoMeta) => void`, `collapsedByDefault?: boolean`. Fields:
`seo_title` (60-char counter hint), `meta_description` (155-char counter hint), `keywords`
(`TagInput`), `canonical_url`, OG image (`MediaPicker` trigger), `twitter_card_type` (select),
`robots` (select — index/follow combinations), and a collapsed "Advanced" sub-section for
`schema_jsonld` (raw JSON editor with validation).

### `VersionHistoryDrawer`
`entityType: 'page' | 'blog_post' | 'settings'`, `entityId`, `open`, `onClose`,
`onRestore: (versionId) => void`. Fetches `GET /{module}/{id}/versions`; each row shows
timestamp, author, optional change note, and a "Restore" button that routes through
`ConfirmDialog` ("this will overwrite your current draft").

### `MediaPicker`
`open`, `onClose`, `accept?: string[]` (MIME filter — e.g. images-only for a featured-image
field), `multiple?: boolean`, `onSelect: (media: Media | Media[]) => void`. Two internal tabs:
**Library** (grid + folder filter + search, reusing `MediaGrid`) and **Upload** (reuses
`FileDropzone`, auto-switches to Library and pre-selects on completion).

### `GalleryManager`
Properties-specific today, but built as a generic pattern any future multi-image field can
reuse. `mediaIds: string[]`, `onChange`, `onAddClick` (opens `MediaPicker` with `multiple: true`).
Drag-reorder thumbnails; per-thumbnail remove button.

## Form fields (`components/forms/`)

Thin wrappers pairing a shadcn primitive with React Hook Form's `register`/`Controller`, all
surfacing the same `error?: string` prop so validation messages render consistently:

`TextField`, `TextareaField`, `SelectField`, `SwitchField`, `TagInput` (chip input — tags, beds
options), `DateTimePicker` (the Schedule modal), `FileDropzone` (drag-and-drop, used inside
`MediaPicker`'s Upload tab and directly on `MediaLibraryPage`).

## Global (not tied to one module)

### `GlobalSearchOverlay`
No props — self-contained, opened via ⌘K or the Topbar search icon. Debounced
`GET /search?q=`, results grouped by module, arrow-key navigable, Enter navigates to the result's
editor, Escape closes without navigating.

### `NotificationBell` / `NotificationDropdown`
`NotificationBell` shows the unread count and opens `NotificationDropdown` — a lightweight list
(not a full `Drawer`) with "mark read" per item and a "mark all read" action.

## Next

Deliverable #10, the last one: **security checklist** — then module-by-module build starts per
`ROADMAP.md`.
