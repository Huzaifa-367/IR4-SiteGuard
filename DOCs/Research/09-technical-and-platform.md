# 09 — Technical Architecture & Platform

[← Index](README.md) · [08 Modules](08-product-modules.md) · **Next:** [10 Risks & Vision](10-roadmap-risks-vision.md)

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Environments & deployment](#2-environments--deployment)
3. [Mobile (Flutter)](#3-mobile-flutter)
4. [Backend (Laravel)](#4-backend-laravel)
5. [Authentication & authorization](#5-authentication--authorization)
6. [Data store](#6-data-store)
7. [API conventions](#7-api-conventions)
8. [Offline-first & sync](#8-offline-first--sync)
9. [AI pipeline (Laravel-only tool-calling)](#9-ai-pipeline-laravel-only-tool-calling)
10. [Accounts & payments (technical)](#10-accounts--payments-technical)
11. [Super Admin (platform surface)](#11-super-admin-platform-surface)
12. [Security](#12-security)
13. [Observability](#13-observability)
14. [CI/CD & releases](#14-cicd--releases)
15. [Third-party integrations](#15-third-party-integrations)
16. [Platform strategy](#16-platform-strategy)

---

## 1. Architecture overview

```text
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Flutter      │  │ Owner web    │  │ Super Admin  │  │ Partners     │
│ Hive+sync    │  │ Inertia      │  │ Inertia /admin│  │ WhatsApp…    │
│ light models │  │ (optional)   │  │ platform guard│  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └─────────────────┴─────────────────┴─────────────────┘
                         ▼
              ┌─────────────────────┐
              │ Laravel API v1      │
              │ /businesses … JWT   │
              │ /platform … session │  ← Super Admin only
              │ AI tool-calling *   │
              └──────────┬──────────┘
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 PostgreSQL            Redis              S3 attachments
       │                   │
       └─────────┬─────────┘
                 ▼
        Go workers (OCR, STT) — called from Laravel queues
                 ▼
        External LLM API (OpenAI-compatible) — Laravel only
```

### 1.1 Service boundaries

| Service | Owns | Does not own |
|---------|------|----------------|
| **Flutter** | **Local source of truth for UI reads** (Hive), sync engine, outbox, light models | Business rules, tool-calling, cross-tenant queries; never block screens on network |
| **Laravel API** | Auth, tenancy, validation, policies, AI tool loop, webhooks | Long-running OCR/STT (delegates to Go) |
| **Go workers** | CPU-heavy STT/OCR on raw media | HTTP to clients, JWT validation |
| **Super Admin web** | Platform ops UI | Any route in consumer Flutter app |
| **PostgreSQL** | Source of truth for all tenant + platform tables | Client-side conflict resolution without server ack |

### 1.2 Request path (tenant)

```text
Client
  → TLS termination (CDN / load balancer)
  → Laravel `api` middleware group
  → `auth:jwt` (or support impersonation token — see [12 §9](12-super-admin-platform.md#9-support-impersonation))
  → `tenant` (resolve business_id from route + JWT; reject mismatch)
  → `business.active` (403 if suspended)
  → `feature:*` optional gates (e.g. `ai_assistant`)
  → Controller → Service → Eloquent (always `where business_id`)
  → JSON response
```

Full schema and endpoint catalog: [11 — Data model & APIs](11-data-model-and-apis.md).

---

## 2. Environments & deployment

| Environment | API host | Admin host | Purpose |
|-------------|----------|------------|---------|
| **local** | `api.lixar.test` | `admin.lixar.test` | Dev; Mailhog, MinIO |
| **staging** | `api.staging.lixar.pk` | `admin.staging.lixar.pk` | QA, seeded tenants |
| **production** | `api.lixar.pk` | `admin.lixar.pk` | Live shops |

### 2.1 Runtime topology (production)

```text
                    ┌─────────────┐
                    │ Cloudflare  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │ API pods  │    │ Worker    │    │ Admin web │
   │ (Horizon) │    │ pods      │    │ (Inertia) │
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
              ┌───────────────────────┐
              │ RDS PostgreSQL (HA)   │
              │ ElastiCache Redis     │
              │ S3 bucket (private)   │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Go worker pool (K8s)  │
              │ STT / OCR queues      │
              └───────────────────────┘
```

### 2.2 Configuration secrets (Laravel `.env`)

| Secret | Used by |
|--------|---------|
| `APP_KEY` | Encryption, signed URLs |
| `JWT_SECRET` / key pair | Shop user tokens |
| `PLATFORM_SESSION_SECRET` | Platform cookie signing |
| `OPENAI_API_KEY` (or compatible) | `AiAssistantService` only |
| `S3_*` | Attachments, exports |
| `WHATSAPP_BSP_*` | Optional BSP send |
| `RAAST_*` | QR / payment reference generation |

Never embed these in Flutter builds. Mobile uses only **public** config: API base URL, Sentry DSN, min version check endpoint.

### 2.3 Health & readiness

| Endpoint | Checks |
|----------|--------|
| `GET /health` | Process up |
| `GET /health/ready` | DB ping, Redis ping, queue reachable |

Super Admin and mobile poll **ready** before showing “connected” after outage.

---

## 3. Mobile (Flutter)

| Concern | Choice |
|---------|--------|
| State | Riverpod (`@riverpod` codegen where used) |
| Navigation | GoRouter — deep links `lixar://business/{id}/…` |
| Offline | **Offline-first:** all tenant screens read/write Hive; **SyncCoordinator** keeps data current when online |
| HTTP | Dio — interceptors: auth, idempotency, retry with backoff |
| AI (assistant) | **Online** — Laravel tool-calling only |
| Light models | **On-device** — STT, OCR, slot-fill (see [§3.1](#31-mobile-light-models)) |
| Secrets | `flutter_secure_storage` — refresh token, selected `business_id` |
| i18n | `easy_localization` — `ur-PK`, `en-PK` |
| Motion | `flutter_animate` |

**Structure:**

```text
lib/
  main.dart
  app.dart                    # MaterialApp.router, theme, locale
  src/
    core/
      network/                # Dio, interceptors
      storage/                # Hive boxes, secure storage
      sync/                   # SyncCoordinator, pull/push, bootstrap, connectivity
    features/<feature>/
      presentation/           # Screens, widgets
      controllers/            # Riverpod notifiers
      models/                 # Freezed DTOs
    routing/
      app_router.dart
```

### 3.1 Mobile light models

Small models run **on the phone** for speed, privacy, and spotty connectivity — they **do not** replace the server assistant and **never** perform tool-calling.

| Use case | On-device (examples) | When online, prefer server |
|----------|----------------------|----------------------------|
| **Voice → khata draft** | Whisper-tiny / sherpa-onnx Urdu-Roman STT + rule/slot parser | User taps “better accuracy” → upload audio to Laravel |
| **Bill / label OCR** | ML Kit / Paddle Lite → line hints | Company bill upload → Laravel + Go worker |
| **Party search** | Local fuzzy match on cached `Party` names | — |
| **Mic UX** | VAD, noise gate | — |
| **Intent chips** | Classify “reminder / stock / balance” before opening chat | Full answer still from Laravel |

**Packaging:** Minimal default pack in APK; **Download Urdu voice pack** (~15–40 MB quantized) on Wi‑Fi. Models under `getApplicationDocumentsDirectory()/models/{version}/`.

**Boundaries:**

```text
✓ Mobile light model  → draft text, slots, local search (user always confirms before save)
✗ Mobile              → query_ledger, query_stock, tool_router, LLM API keys, auto-writes
✓ Laravel assistant   → tool-calling + full LLM (internet required)
```

**Offline:** Light STT/OCR can run **offline** to pre-fill a confirm sheet; saved rows still go through Hive outbox. **AI chat assistant** stays online-only (UI shows “Internet required for AI”).

**Implementation:** `tflite_flutter` or `onnxruntime` in a **compute isolate**; warm-up on first mic tap; cap inference to 30s audio chunks.

### 3.2 Hive boxes (per `business_id`)

All tenant UI **reads from these boxes** — not from live HTTP. Boxes are namespaced by `business_id`; on business switch, Riverpod scopes to the active box set.

| Box | Key pattern | Contents (synced from server + local writes) |
|-----|-------------|-----------------------------------------------|
| `parties` | `party:{id}` | Party profile + balance summary |
| `ledger_entries` | `ledger:{id}` | Khata rows (gave/got) |
| `payments` | `payment:{id}` | Settlements linked to `account_id` |
| `accounts` | `account:{id}` | Cash/bank accounts + cached balance |
| `account_transactions` | `acct_tx:{id}` | In/out lines |
| `stock` | `sku:{id}` / `batch:{id}` | SKU, qty, expiry (vertical) |
| `products` | `product:{id}` | Catalog slice for active vertical |
| `branches` | `branch:{id}` | Branch list |
| `invoices` | `invoice:{id}` | Billing drafts & posted (vertical) |
| `outbox` | `outbox:{client_uuid}` | Pending pushes not yet acked |
| `sync_meta` | `cursor:{entity}`, `last_pull_at`, `bootstrap_done` | Per-entity cursors |
| `settings` | `business:{id}` | Locale, branch, feature flags cache |
| `attachments_index` | `att:{id}` | Metadata; binary in `attachments_files/` |

**Rule:** If it appears on a khata, stock, accounts, or billing screen, it must live in Hive after first sync and remain readable **with zero network**.

Boxes are **cleared on logout** (including attachment files) except optional downloaded voice model packs.

### 3.3 Outbox row shape (client)

```json
{
  "client_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "entity": "ledger_entry",
  "method": "POST",
  "path": "/api/v1/businesses/{bid}/branches/{brid}/ledger-entries",
  "body": { },
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "client_created_at": "2026-05-17T14:05:00+05:00",
  "attempt_count": 0,
  "last_error": null
}
```

`SyncCoordinator` pushes the outbox with exponential backoff (1s → 2s → 4s … max 5 min) and **always** schedules a pull after successful push or on app resume (see [§8](#8-offline-first--sync)).

### 3.4 Performance budget

| Metric | Target |
|--------|--------|
| Base APK | &lt;40 MB (without voice pack) |
| Cold start P95 | &lt;2 s on mid-range Android (API 24+) |
| List scroll | 60 fps on 500-party cache |
| Sync batch | &lt;3 s for 50-row batch on 4G |

---

## 4. Backend (Laravel)

### 4.1 Layering

```text
routes/api.php
  → Http\Controllers\Api\V1\*
      → Services\*Service (business logic)
          → Repositories / Eloquent models
          → Events → Listeners / Jobs
```

| Layer | Responsibility |
|-------|----------------|
| **Controllers** | HTTP validation (FormRequest), authorize, delegate |
| **Services** | Transactions, domain rules, idempotency |
| **Policies** | `view`, `create`, `update` per model + `business_id` |
| **Jobs** | Async: reminders, exports, AI STT/OCR, usage snapshots |
| **Events** | `LedgerEntryCreated` → stock side-effects, audit |

### 4.2 Route groups

| Group | Prefix | Middleware |
|-------|--------|------------|
| Tenant API | `/api/v1/businesses/{bid}/…` | `auth:jwt`, `tenant`, `business.active` |
| Platform API | `/api/v1/platform/…` | `auth:platform`, `platform.active` |
| Auth | `/api/v1/auth/…` | throttle, OTP |
| Webhooks | `/webhooks/…` | signature middleware |
| Health | `/health` | none |

### 4.3 Core services (non-exhaustive)

| Service | Role |
|---------|------|
| `AiAssistantService` | LLM turns, tool registry, tool loop, `ai_audit_log` |
| `SyncBatchService` | Validates outbox batch, conflicts, acks |
| `LedgerService` | Gave/got, balances, idempotent create |
| `AccountService` | Balances, transfers, links payments to `account_id` |
| `ReminderService` | Schedules, WhatsApp template render |
| `PlatformBusinessService` | Suspend, flags, trial — platform guard only |

**Tenancy:** One business = one `vertical` (immutable after create); see [06](06-personas-and-workspace.md). Middleware rejects JWT `business_id` ≠ route `{bid}`.

**AI tenancy:** Every AI route requires `{bid}`; tools receive `BusinessContext` and cannot switch tenant.

### 4.4 Queue names (Horizon)

| Queue | Workers | Examples |
|-------|---------|----------|
| `default` | 2+ | Email, light jobs |
| `sync` | 4+ | Post-process sync side-effects |
| `ai` | 2+ | LLM calls, tool steps |
| `media` | 2+ | Dispatch to Go STT/OCR |
| `reminders` | 2+ | WhatsApp / SMS send windows |
| `platform` | 1+ | Usage snapshots, purge jobs |

### 4.5 Inertia surfaces

| App | Path | Guard |
|-----|------|-------|
| Owner web (optional) | `/app/…` | Shop JWT session or Sanctum |
| Super Admin | `/admin/…` | `platform` session — [12](12-super-admin-platform.md) |

Consumer **Flutter never** loads `/admin` routes.

---

## 5. Authentication & authorization

### 5.1 Shop user JWT (access token)

Issued after OTP / password login. Short-lived (e.g. **15 min**). Claims:

```json
{
  "sub": "user_uuid",
  "allowed_business_ids": ["uuid1", "uuid2"],
  "business_id": "uuid1",
  "vertical": "agri_inputs",
  "membership_role": "partner",
  "branch_id": "uuid_or_null",
  "tv": 3,
  "exp": 1715952900
}
```

| Claim | Use |
|-------|-----|
| `business_id` | Active workspace (switch via `POST /auth/switch-business`) |
| `membership_role` | Partner vs staff capabilities ([06 §5](06-personas-and-workspace.md)) |
| `tv` | Token version — bump on force logout / disable |
| `vertical` | UI module set; server validates against `businesses.vertical` |

**Refresh token:** HttpOnly cookie (web) or secure storage (mobile); rotation on use; revoke all on `token_version` bump.

### 5.2 Platform operator session

Separate guard — **no** shop JWT.

| Mechanism | Use |
|-----------|-----|
| Session cookie | Super Admin Inertia SPA |
| `platform_api_tokens` | CI, scripts — scoped bearer |
| TOTP | Required for `super_admin` and `support` in production |

See [12 §3](12-super-admin-platform.md#3-authentication--sessions).

### 5.3 Authorization matrix (tenant)

| Action | partner | staff `admin` | staff `cashier` |
|--------|:-------:|:-------------:|:---------------:|
| Invite partner | ✓ | ✗ | ✗ |
| Remove creator | ✗ | ✗ | ✗ |
| POST ledger | ✓* | ✓* | ✓* |
| Manage accounts | ✓ | ✓ | ✗ |
| AI assistant | ✓ | ✓ | optional flag |

\*Per-branch and category policies may further restrict.

Policies live in `app/Policies/`; always call `$this->authorize()` in controllers.

### 5.4 Suspended business

`business.active` middleware returns:

```json
{
  "message": "This business is suspended. Contact support.",
  "code": "BUSINESS_SUSPENDED",
  "fields": {}
}
```

HTTP **403**. Outbox on mobile retains rows but sync stops until unsuspended.

---

## 6. Data store

### 6.1 PostgreSQL conventions

- Every tenant table: `business_id UUID NOT NULL` + FK → `businesses`.
- Standard columns: `id UUID PK`, `created_at`, `updated_at`, optional `deleted_at` (soft delete where noted in [11](11-data-model-and-apis.md)).
- Money: `decimal(18,2)` PKR — project standard ([11 §1.1](11-data-model-and-apis.md#1-conventions)).
- Indexes: `(business_id, created_at DESC)`, `(business_id, party_id)` for ledger.

### 6.2 Redis

| Use | Key pattern | TTL |
|-----|-------------|-----|
| Cache | `biz:{bid}:parties:index` | 5 min |
| Rate limit | `otp:phone:{hash}` | 1 h |
| Queue | Horizon meta | — |
| Idempotency | `idem:{key}` | 24 h |

### 6.3 S3-compatible storage

| Prefix | Content |
|--------|---------|
| `attachments/{bid}/{uuid}` | Bills, profile images |
| `exports/{bid}/{uuid}` | PDF statements (signed URL, 15 min) |
| `ai/{bid}/{session_id}/` | Audio uploads for STT |

Objects are **private**; clients use presigned GET from Laravel.

### 6.4 ClickHouse (optional)

Append-only `events` stream: `business_id`, `event_name`, `properties`, `occurred_at` — for funnel and AI usage analytics without loading OLTP.

---

## 7. API conventions

| Rule | Detail |
|------|--------|
| Version | `/api/v1/` — breaking changes → v2, never silent |
| Idempotency | `Idempotency-Key` header on POST payments, ledger, transfers |
| Pagination | Cursor `?after={uuid}&limit=50` (max 100) |
| Sort | `?sort=-created_at` whitelist only |
| Include | `?include=party,account` sparse fieldsets |
| Errors | `{ "message", "code", "fields": { "amount": ["required"] } }` |
| Time | ISO-8601 with offset; server `updated_at` wins on conflict |
| Locale | `Accept-Language: ur-PK` for error messages |

### 7.1 Standard headers (tenant)

| Header | Required | Notes |
|--------|----------|-------|
| `Authorization` | Yes* | `Bearer {jwt}` |
| `Idempotency-Key` | POST mutators | Client UUID |
| `X-Client-Version` | Recommended | `1.2.3+45` |
| `X-Device-Id` | Recommended | Stable install id |
| `X-Branch-Id` | If multi-branch | Overrides default branch |

\*Except public auth OTP routes.

### 7.2 Example: ledger entry

```http
POST /api/v1/businesses/{bid}/branches/{brid}/ledger-entries
Authorization: Bearer eyJ...
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Accept-Language: ur-PK

{
  "party_id": "uuid",
  "kind": "gave",
  "amount": 12000,
  "category": "sales",
  "note": "2L Karate spray udhaar",
  "client_created_at": "2026-05-17T14:05:00+05:00"
}
```

**201:** `{ "data": { "id", "updated_at", "balance_after" } }`

### 7.3 Example: payment with account

```http
POST /api/v1/businesses/{bid}/payments
Idempotency-Key: ...

{
  "party_id": "uuid",
  "account_id": "uuid",
  "direction": "in",
  "amount": 50000,
  "method": "cash",
  "note": "Partial udhaar"
}
```

`account_id` required — see [§10](#10-accounts--payments-technical) and [11 §6](11-data-model-and-apis.md).

### 7.4 Rate limits (default)

| Route class | Limit |
|-------------|-------|
| OTP send | 5 / phone / hour |
| Login | 20 / IP / hour |
| Sync batch | 60 / user / minute |
| AI message | 30 / business / hour (plan may raise) |
| Platform login | 10 / email / 15 min |

Return **429** with `Retry-After` header.

---

## 8. Offline-first & sync

### 8.1 Principles (non-negotiable)

| Principle | Detail |
|-----------|--------|
| **Read local always** | Lists, detail screens, search, balances, stock qty → **Hive only**. No “loading from server” gate on open. |
| **Write local first** | Mutations append to entity box + `outbox` immediately; user sees success in UI. |
| **Device keeps data synced** | When online, `SyncCoordinator` **pulls** server deltas and **pushes** outbox on a schedule — not only when user taps sync. |
| **Offline = last synced snapshot** | Stale data is OK with a “Last updated …” label; **empty** because network failed is not OK after first bootstrap. |
| **Online-only exceptions** | First OTP login, AI assistant chat, uncached attachment binary, some live rates — see [§8.6](#86-online-only-vs-offline-capable) |

```text
┌─────────────────────────────────────────────────────────┐
│  UI layer (Riverpod) — always subscribes to Hive streams │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Hive (per business_id) — parties, ledger, stock, …       │
└───────────────┬───────────────────────┬─────────────────┘
                │ write                 │ read
                ▼                       │
┌───────────────────────────┐           │
│  outbox (pending pushes)   │           │
└───────────────┬───────────┘           │
                │                       │
┌───────────────▼───────────────────────▼─────────────────┐
│  SyncCoordinator (background + foreground)             │
│    push batch → pull deltas per entity → update cursors  │
└───────────────────────────┬─────────────────────────────┘
                            │ when network available
                            ▼
                     Laravel /sync/*
```

### 8.2 Synced entity catalog

Each row is **pulled** to Hive and **pushable** via outbox where noted.

| Entity | Pull endpoint / cursor | Offline read | Offline write (outbox) |
|--------|------------------------|:------------:|:----------------------:|
| `parties` | `GET …/sync/parties?after=` | ✓ | ✓ create/update |
| `ledger_entries` | `GET …/sync/ledger-entries?after=` | ✓ | ✓ |
| `payments` | `GET …/sync/payments?after=` | ✓ | ✓ |
| `accounts` | `GET …/sync/accounts?after=` | ✓ | ✓ |
| `account_transactions` | `GET …/sync/account-transactions?after=` | ✓ | ✓ |
| `account_transfers` | `GET …/sync/account-transfers?after=` | ✓ | ✓ |
| `stock_items` / batches | `GET …/sync/stock?after=` | ✓ | ✓ (vertical) |
| `products` / catalog | `GET …/sync/products?after=` | ✓ | read-mostly |
| `branches` | `GET …/sync/branches` (full rare) | ✓ | partner online |
| `invoices` | `GET …/sync/invoices?after=` | ✓ | ✓ |
| Vertical extras | e.g. `lots`, `repair_tickets` — same pattern | ✓ | ✓ per module |

Server returns `updated_at` + tombstones (`deleted_at`) so client can remove local rows.

### 8.3 SyncCoordinator behavior

| Trigger | Action |
|---------|--------|
| **App launch** (logged in) | Push outbox → pull all entities for **active** `business_id` |
| **Foreground** | Incremental pull (cursors) + push outbox |
| **Connectivity restored** | Immediate push + pull |
| **Periodic** (WorkManager, ~15 min on Wi‑Fi / unmetered) | Pull active business; push outbox |
| **After local write** | Enqueue push; optimistic UI already updated |
| **Business switch** | UI swaps Hive namespace; trigger pull if `last_pull_at` stale |
| **Multi-business** | Background pull for other `allowed_business_ids` on Wi‑Fi only |
| **Pull-to-refresh** | User-initiated full incremental pull |

**Bootstrap** (first login or new device):

```text
1. GET /businesses + select active business
2. GET /sync/bootstrap?business_id=  (or chained entity pulls)
3. Write all pages to Hive; set sync_meta.bootstrap_done = true
4. Only then remove blocking splash — user can work offline immediately after
```

**Status UI:** `Synced` · `Updating…` · `Offline — last sync 2h ago` · `Pending (n) uploads` — never block khata entry on sync.

### 8.4 Push flow (outbox)

```text
User saves locally → Hive entity + outbox row (same transaction)
  → SyncCoordinator (when online): POST /sync/batch
  → Server validates → acks | conflicts
  → Client merges server ids/updated_at into Hive, removes outbox row
  → Pull deltas for affected entities (catch other devices’ writes)
```

### 8.5 Batch request

```http
POST /api/v1/businesses/{bid}/sync/batch
Content-Type: application/json

{
  "device_id": "install-uuid",
  "client_clock_skew_ms": -1200,
  "items": [
    {
      "client_uuid": "uuid",
      "entity": "ledger_entry",
      "op": "create",
      "payload": { },
      "client_created_at": "2026-05-17T14:05:00+05:00"
    }
  ]
}
```

Max items: `system_settings.sync_max_batch_size` (default 100).

### 8.6 Online-only vs offline-capable

| Capability | Offline |
|------------|:-------:|
| View/search parties, ledger, balances | ✓ |
| Add gave/got, payments, expenses, transfers | ✓ (queued) |
| Stock in/out, billing draft | ✓ (vertical) |
| Reports from cached aggregates | ✓ (precomputed or SQL-on-Hive) |
| Voice/OCR quick entry (light models) | ✓ |
| **AI assistant chat** | ✗ |
| First login / OTP | ✗ |
| Download attachment not yet cached | ✗ (show placeholder) |
| Live mandi rates / IMEI live check | ✗ |

### 8.7 Conflict policy

| Situation | Server behavior | Client behavior |
|-----------|-----------------|-----------------|
| Duplicate `Idempotency-Key` | Return original row (200/201) | Drop duplicate outbox |
| Same `client_uuid`, different body | `conflict` + `server_row` | Show merge UI; user picks |
| Server deleted party, client adds ledger | `conflict` `party_not_found` | Remove or recreate party |
| Amount &gt; policy limit | `validation_error` | Fix locally, retry |

Server **never** silently overwrites user-visible amounts without conflict flag.

### 8.8 Pull (delta sync)

```http
GET /api/v1/businesses/{bid}/sync/cursor
→ { "entities": { "parties": "uuid", "ledger_entries": "uuid", … }, "server_time": "…" }

GET /api/v1/businesses/{bid}/sync/parties?after={cursor}&limit=200
GET /api/v1/businesses/{bid}/sync/ledger-entries?after={cursor}&limit=200
… (one endpoint per entity family — see [11 §14.14](11-data-model-and-apis.md#1414-sync))
```

Response: `{ "data": [ … ], "meta": { "after", "has_more" } }`. Coordinator pages until `has_more = false`, upserts into Hive, stores cursor.

Pull runs on **every** successful push, on foreground, and on periodic job — not “Wi‑Fi only” for the active business (Wi‑Fi only for **non-active** businesses).

### 8.9 Feature flag: `offline_writes`

`business_feature_flags.offline_writes` (default **true**). When **false** (support emergency):

- **Reads** still from Hive — shop keeps working with last synced data offline.  
- **Writes** blocked offline with message *“Abhi sirf online entry ho sakti hai”* — no outbox enqueue.  
- Does **not** delete local data or disable pull.

Legacy key `offline_sync` in older notes maps to this behavior — prefer `offline_writes` in new code.

---

## 9. AI pipeline (Laravel-only tool-calling)

### 9.1 Non-negotiable rules

| Rule | Detail |
|------|--------|
| **Tool-calling on server** | Flutter and web **never** register or execute LLM tools |
| **Assistant internet required** | Chat / command bar needs network |
| **Writes need confirm** | Server returns `proposed_actions[]`; app confirm → REST POST |
| **No client secrets** | LLM keys in Laravel env only |
| **Audit** | `ai_audit_log`: prompt hash, tools called, business_id |

### 9.2 Session model

| Table | Purpose |
|-------|---------|
| `ai_sessions` | Per user + business thread |
| `ai_messages` | `role`: user \| assistant \| tool; `content` JSON |
| `ai_audit_log` | Compliance, debugging |

```http
POST /api/v1/businesses/{bid}/ai/sessions
{ "title": "optional" }

POST /api/v1/businesses/{bid}/ai/sessions/{sid}/messages
{ "text": "Ali ka balance?" }
# or multipart audio → queue STT → then same flow
```

### 9.3 Request flow

```text
App — optional local path first
  Mic → light STT + slot parser → confirm sheet (offline OK)
  Or user opens AI chat (online) → POST message / audio

Laravel AiAssistantService
  1. Auth + business_id + feature flag ai_assistant
  2. Rate limit + token budget check (plan)
  3. STT/OCR jobs (queue → Go) if attachment
  4. Build messages[] from ai_messages history (trim to N tokens)
  5. LLM turn with server-defined tools (strict JSON schema)
  6. tool_router executes each tool → Eloquent/services
  7. Loop until model returns final text or max_steps (e.g. 5)
  8. Persist assistant message + audit
  9. Return { reply, proposed_actions?, chart_spec?, citations[] }
```

### 9.4 Tool registry

| Tool | Type | Notes |
|------|------|-------|
| `query_ledger` | read | Parties, balances, aging |
| `query_stock` | read | SKU, batch, low stock |
| `query_accounts` | read | Balances, recent in/out |
| `report_summary` | read | Whitelisted report keys only |
| `draft_reminder` | propose | WhatsApp text — no send until confirm |
| `draft_ledger_entry` | propose | Parsed gave/got — POST after confirm |

**Never auto-execute:** payments, deletes, partner changes, stock adjustments, account transfers.

### 9.5 Response example

```json
{
  "data": {
    "message_id": "uuid",
    "reply": "Ali ka net udhaar 12,400 hai.",
    "proposed_actions": [
      {
        "type": "draft_reminder",
        "payload": { "party_id": "uuid", "message_ur": "..." }
      }
    ],
    "citations": [
      { "type": "ledger_aggregate", "party_id": "uuid", "as_of": "2026-05-17" }
    ]
  }
}
```

### 9.6 Kill switches

| Switch | Effect |
|--------|--------|
| `system_settings.ai_enabled_globally` | All AI routes 503 |
| `business_feature_flags.ai_assistant` | Per-tenant 403 |
| Plan limit exceeded | 429 `AI_QUOTA_EXCEEDED` |

### 9.7 Implementation split

| Layer | Responsibility |
|-------|----------------|
| **Flutter** | Light models; chat UI; confirm sheets; disable chat offline |
| **Web** | Upload audio/image to Laravel — no on-device models |
| **Laravel** | Sessions, messages, tool loop, prompts, rate limits |
| **Go workers** | Heavy OCR / STT on raw media |
| **LLM provider** | Chat completions from Laravel only |
| **Insights dashboard** | SQL rules + cron — separate from chat tools |

---

## 10. Accounts & payments (technical)

Every cash movement is tied to an **`account_id`** (Cash drawer, MCB, HBL, etc.).

| Entity | Role |
|--------|------|
| `accounts` | Chart of cash/bank accounts per business |
| `account_transactions` | Single in/out line |
| `account_transfers` | From-account → to-account |

```text
Payment POST  → account_transactions (in/out)
Expense POST  → account_transactions (out)
Transfer POST → account_transfers + two account_transactions
```

Ledger (udhaar) remains on `ledger_entries`; **payments** settle udhaar and hit accounts. See [11 §6.1–6.4](11-data-model-and-apis.md) and [08 Module 5](08-product-modules.md).

**Invariant:** `SUM(account_transactions)` per account matches `accounts.balance` (updated in same DB transaction).

---

## 11. Super Admin (platform surface)

| Item | Detail |
|------|--------|
| Module | [08 Module 17](08-product-modules.md#module-17--super-admin-platform) |
| Spec | [12 — Super Admin](12-super-admin-platform.md) |
| Schema | [11 §3.4](11-data-model-and-apis.md#34-platform-super-admin-no-business_id) |
| API | [11 §14.18](11-data-model-and-apis.md#1418-platform-super-admin) |

**Technical separation:**

- `platform_users` ≠ shop `users`
- Routes under `/api/v1/platform/*` use `auth:platform`
- Tenant middleware **rejects** platform session on `/businesses/{bid}` unless valid **support impersonation** JWT ([12 §9](12-super-admin-platform.md#9-support-impersonation))
- Flutter APK contains **no** platform URLs or credentials

---

## 12. Security

| Topic | Approach |
|-------|----------|
| **Transport** | TLS 1.2+ everywhere |
| **At rest** | RDS encryption; S3 SSE |
| **PII** | Phone hashed for lookup optional; encrypt `totp_secret` |
| **SQL** | Eloquent only in tools; no raw user strings in AI tools |
| **CSRF** | Platform Inertia — CSRF token; API JWT — stateless |
| **CORS** | Allowlist `app.lixar.pk`, `admin.lixar.pk` |
| **Attachments** | Virus scan job optional; MIME allowlist |
| **Impersonation** | Short TTL, banner, dual audit log |
| **Dependency** | `composer audit`, Dependabot, Flutter `pub outdated` in CI |

### 12.1 Threat notes

- Stolen shop JWT: limited to `allowed_business_ids`; short TTL + refresh rotation.
- Stolen platform session: high impact — enforce 2FA, IP allowlist for super_admin, session list + revoke in PA10.
- Prompt injection: tools are fixed allowlist; model cannot add tools; outputs are not executed as code.

---

## 13. Observability

### 13.1 Logging

Structured JSON per request:

```json
{
  "request_id": "uuid",
  "user_id": "uuid",
  "business_id": "uuid",
  "route": "POST .../ledger-entries",
  "duration_ms": 45,
  "status": 201
}
```

Platform routes add `platform_user_id`; support routes add `support_session_id`.

### 13.2 Error tracking

- **Sentry** — Flutter + Laravel; release health by `X-Client-Version`
- Breadcrumbs: sync batch size, AI session id (no PII in breadcrumbs)

### 13.3 Metrics (Prometheus)

| Metric | Labels |
|--------|--------|
| `http_requests_total` | method, route, status |
| `sync_batch_items_total` | business_id hash |
| `ai_tool_calls_total` | tool_name |
| `queue_jobs_failed_total` | queue |
| `platform_support_sessions_active` | — |

### 13.4 Alerts (examples)

| Alert | Condition |
|-------|-----------|
| API 5xx rate | &gt;1% for 5 min |
| Sync conflict spike | 3× baseline |
| AI provider errors | &gt;20% for 10 min |
| Queue depth | `ai` &gt; 1000 for 15 min |

---

## 14. CI/CD & releases

| Stage | Actions |
|-------|---------|
| **PR** | PHPUnit, PHPStan, Flutter `analyze` + unit tests |
| **Merge main** | Build API Docker image, deploy staging |
| **Tag `v*`** | Promote to production; upload Flutter AAB to Play internal |
| **Min version** | Super Admin sets `min_app_version_android` — API returns 426 if client too old |

**Database:** Migrations via `php artisan migrate --force` in deploy job; never auto-migrate from mobile.

**Feature flags:** Prefer `business_feature_flags` + `system_settings` over emergency APK for kill switches.

---

## 15. Third-party integrations

| Integration | Direction | Handler |
|-------------|-----------|---------|
| LLM (OpenAI-compatible) | Outbound | Laravel `AiAssistantService` |
| WhatsApp BSP | Outbound | `ReminderService` + webhook inbound |
| Raast / bank QR | Outbound generate | `PaymentService` |
| SMS OTP | Outbound | Auth controller + provider adapter |
| Play In-App Updates | Client | Flutter optional prompt from min version API |
| Sentry | Outbound | SDKs |
| Stripe (if used) | Webhook inbound | `/webhooks/stripe` — platform billing only |

All webhooks: verify signature, idempotent handler keyed by provider event id.

---

## 16. Platform strategy

| Surface | Role | Primary stack |
|---------|------|----------------|
| **Android phone** | Primary field app | Flutter |
| **Tablet** | Landscape POS, agri counter | Flutter adaptive |
| **Web (owner)** | Accountant, multi-branch owner | Inertia + Vue/React |
| **Web (platform)** | Lixar Super Admin | Inertia `/admin` only |

**Locale & market:** Pakistan-first — PKR, Urdu Roman UI copy, Punjab/Sindh unit presets in seeds ([12 §12](12-super-admin-platform.md#12-content-seeds--broadcasts)).

---

[← Index](README.md) · **Next:** [10 — Risks & Vision](10-roadmap-risks-vision.md)
