# 05 — Technical Architecture

[← Index](README.md) · **Next:** [06 AI ingestion API](06-ai-ingestion-api.md)

---

## 1. Architecture overview

```text
┌──────────────────────────────────────────────────────────────────┐
│  Site LAN                                                         │
│  IP cameras (RTSP) ──▶ Python inference (SEPARATE REPO, per camera) │
│                        │                                          │
└────────────────────────┼──────────────────────────────────────────┘
                         │ HTTPS  POST /api/ingest/camera
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Laravel 11 (single project — siteguard/)                         │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │ Inertia web UI │  │ IngestCamera    │  │ Horizon jobs     │ │
│  │ + AI chat      │  │ Controller      │  │ rules, AI, notify│ │
│  └────────────────┘  └─────────────────┘  └──────────────────┘ │
│           │                  │                    │               │
│           └──────────────────┴────────────────────┘               │
│                              ▼                                    │
│                    MySQL 8 · Redis · S3                          │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | In this repo? |
|-------|------------|---------------|
| **Dashboard** | Laravel + Inertia + Vue 3 (or React) | Yes |
| **Persistence** | **MySQL 8+**, Eloquent | Yes |
| **Queues** | Redis + Horizon | Yes |
| **Media** | S3 / local disk `storage/app/snapshots` | Yes |
| **AI assistant** | **`laravel/ai`** (Laravel AI SDK) | Yes |
| **Vision inference** | Python, OpenCV, YOLO, etc. | **No** — separate deployment |

---

## 2. Laravel application structure

```text
siteguard/
  app/
    Ai/
      Agents/
        SiteSafetyAgent.php      # implements Agent, HasTools, HasStructuredOutput
      Tools/
        QueryAlerts.php
        QueryCameraHealth.php
        DraftInvestigation.php
        …
    Http/Controllers/
      Dashboard/
      Api/Ingest/
        IngestCameraController.php
    Models/
    Policies/
    Services/
      RuleEvaluationService.php
      Ingest/IngestCameraService.php
      Ai/SiteSafetyChatService.php   # wraps agent prompt + site scope
    Jobs/
      EvaluateRulesJob.php
  config/
    ai.php                         # laravel/ai — providers, default models
  routes/
    web.php
    api.php
  database/migrations/
  database/seeders/
```

---

## 3. Authentication surfaces

| Consumer | Mechanism | Package |
|----------|-----------|---------|
| **Dashboard users** | Session + Fortify/Breeze login | `laravel/fortify` or Breeze |
| **Inertia** | `auth` middleware, CSRF | Built-in |
| **Python ingest** | Bearer token per `camera_id` | `IngestApiToken` model |
| **Integration API** | Sanctum token | `integrations.manage` |
| **Authorization** | Dynamic roles + fixed `super_admin` | `spatie/laravel-permission` |
| **AI providers** | API keys in `.env` → `config/ai.php` | **`laravel/ai`** |

Detail: [10 — Users & RBAC](10-users-roles-permissions.md) · [11 — AI Assistant](11-ai-assistant.md)

---

## 4. Request flows

### 4.1 Dashboard (human)

```text
Browser → web.php → auth → permission middleware → Controller
  → Policy (site access) → Eloquent → Inertia::render()
```

### 4.2 Ingest (Python) — single POST per camera

```text
Python → POST /api/ingest/camera
  → IngestCameraController → MySQL writes → EvaluateRulesJob → alerts
```

Detail: [06 — AI ingestion API](06-ai-ingestion-api.md)

### 4.3 AI assistant (Laravel AI SDK)

```text
Browser → POST /sites/{site}/ai/sessions/{id}/messages
  → SiteSafetyChatService
  → SiteSafetyAgent::make(user, site)->prompt($text)
       └── laravel/ai runs tool loop (QueryAlerts, …)
  → Structured output: reply + proposed_actions + chart_spec
  → Persist ai_messages + ai_audit_logs (MySQL)
  → Inertia renders reply; user confirms proposed_actions
```

Detail: [11 — AI Assistant](11-ai-assistant.md)

---

## 5. Real-time dashboard

| Option | Notes |
|--------|-------|
| **Laravel Reverb** + Echo | `alert.created` on `site.{id}` |
| **Polling fallback** | 30 s on alert index |

---

## 6. Data store

| Store | Contents |
|-------|----------|
| **MySQL 8+** | sites, locations, modules, cameras, zones, rules, events, alerts, users, roles, `ai_*` |
| **Redis** | cache, queues, rate limits |
| **S3 / disk** | Decoded snapshots from `payload.snapshot` |

**`.env`:** `DB_CONNECTION=mysql`

No `organization_id` — global `settings` key-value.

---

## 7. Python integration contract

| # | Contract |
|---|----------|
| 1 | **POST only** — `/api/ingest/camera` |
| 2 | **One token per camera** |
| 3 | **Minimal payload** — `event_id`, `captured_at`, `snapshot`, `detections[]` |

[06 — AI ingestion API](06-ai-ingestion-api.md) · [03 §7](03-sites-modules-cameras.md#7-python-ingest-link-laravel--python-contract)

---

## 8. Deployment (single project)

| Environment | Setup |
|-------------|--------|
| **Production** | Nginx → PHP-FPM → Laravel; **MySQL 8**; Redis; MinIO |
| **Site network** | Python workers on camera LAN; HTTPS to Laravel |
| **Not in spec** | Multi-tenant SaaS |

---

## 9. Observability

- Laravel Telescope (non-prod)  
- Horizon for queue depth  
- Logs: `site_id`, `camera_id`, `payload.event_id`  
- Sentry for Laravel  

---

## 10. Key packages (composer)

| Package | Purpose |
|---------|---------|
| `spatie/laravel-permission` | Dynamic roles + `super_admin` |
| `laravel/horizon` | Queues |
| `inertiajs/inertia-laravel` | Dashboard SPA |
| `laravel/fortify` | Auth |
| **`laravel/ai`** | **Official Laravel AI SDK** — agents, tools, providers |
| `spatie/laravel-activitylog` | Config audit |

```bash
composer require laravel/ai
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
php artisan migrate   # SDK tables if using bundled conversation storage
```

---

## 11. AI assistant summary

| Rule | Detail |
|------|--------|
| Package | **`laravel/ai`** only — not `openai-php/laravel` directly |
| Agent | `SiteSafetyAgent` — site-scoped instructions + tools |
| Writes | `proposed_actions` via structured output → user confirm |
| Secrets | Provider keys in `config/ai.php` / `.env` |

Full spec: [11 — AI Assistant](11-ai-assistant.md)

---

[← Index](README.md) · **Next:** [06 — AI ingestion API](06-ai-ingestion-api.md)
