# 05 — Technical Architecture

[← Index](README.md) · **Next:** [06 AI ingestion API](06-ai-ingestion-api.md)

---

## 1. Architecture overview

**IR4 deployment:** One Laravel stack **per SCC site** on isolated LAN — [18](18-saudi-aramco-compliance.md). Field data uses **two uplinks**: 4G VPN (vision, RFID, CO₂, Modbus) and **client site WiFi** (gas only).

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  SCC LAN (no outbound internet)                                          │
│  Laravel 11 · MySQL · Redis · local disk media · 55" live view          │
│  Gate RFID bridge ──▶ POST /api/ingest/rfid (localhost)                  │
└───────────────▲───────────────────────────────▲───────────────────────────┘
                │ 4G VPN (AES-256)              │ Site WiFi (TLS)
                │                               │
   ┌────────────┴────────────┐         ┌────────┴────────┐
   │ Jetson edge (×3/site)   │         │ Pi Zero gas GW  │
   │ RTSP + vision POST      │         │ POST /ingest/gas│
   │ RFID + Modbus POST      │         └─────────────────┘
   └────────────┬────────────┘
                │
   Pole cams + RFID ── WiFi bridge ──▶ Jetson
```

Full edge spec: [12 — IoT ingestion & edge](12-iot-ingestion-and-edge.md).

| Layer | Technology | In this repo? |
|-------|------------|---------------|
| **Dashboard** | Laravel + Inertia + Vue 3 (or React) | Yes |
| **Persistence** | **MySQL 8+**, Eloquent | Yes |
| **Queues** | Redis + Horizon | Yes |
| **Media** | Local disk `storage/app/` (IR4: no cloud S3) | Yes |
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
        IngestRfidController.php
        IngestSensorController.php
        IngestGasController.php
        IngestEdgeHeartbeatController.php
        IngestMediaController.php
    Models/
    Policies/
    Services/
      RuleEvaluationService.php
      RfidRuleEvaluationService.php
      SensorThresholdService.php
      VisionRfidCorrelationService.php
      SiteHeadcountService.php
      Ingest/IngestCameraService.php
      Ingest/IngestRfidService.php
      Ingest/IngestSensorService.php
      Ingest/IngestGasService.php
      Reports/UdpmWeeklyReportService.php
      Ai/SiteSafetyChatService.php   # optional — disabled when air-gapped
    Jobs/
      EvaluateRulesJob.php
      EvaluateRfidRulesJob.php
      GenerateUdpmWeeklyReportJob.php
      StationaryTagWatchJob.php
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
| **IoT ingest** | Bearer token per device (polymorphic) | `IngestApiToken` — camera, RFID reader, sensor, gas gateway, edge |
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

### 4.2 Ingest (vision + IoT)

```text
Jetson/Python → POST /api/ingest/camera
  → IngestCameraController → EvaluateRulesJob → alerts

Edge → POST /api/ingest/rfid | /sensor | /gas | /edge/heartbeat
  → Matching controller → domain jobs → alerts / headcount / UDPM aggregates

Pi Zero → POST /api/ingest/gas (site WiFi only)
```

Detail: [06 — Camera ingest](06-ai-ingestion-api.md) · [12 — IoT ingest](12-iot-ingestion-and-edge.md)

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
| **MySQL 8+** | sites, cameras, RFID, sensors, gas, equipment, HSE, LSR, UDPM, users, `ai_*` |
| **Redis** | cache, queues, rate limits, Reverb |
| **Local disk** | Snapshots, clips, equipment PDFs, UDPM PDFs |

**`.env`:** `DB_CONNECTION=mysql`

No `organization_id` — global `settings` key-value.

---

## 7. Integration contracts

| Plane | Endpoint | Token |
|-------|----------|-------|
| Vision | `POST /api/ingest/camera` | Per camera |
| RFID | `POST /api/ingest/rfid` | Per reader |
| Sensor | `POST /api/ingest/sensor` | Per sensor device |
| Gas | `POST /api/ingest/gas` | Per gas gateway |
| Edge health | `POST /api/ingest/edge/heartbeat` | Per edge device |

[06 — Camera ingest](06-ai-ingestion-api.md) · [12 — IoT & edge](12-iot-ingestion-and-edge.md)

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
