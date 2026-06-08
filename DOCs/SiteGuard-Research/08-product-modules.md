# 08 — Product Modules (1–14)

[← Index](README.md) · **Next:** [09 Risks & compliance](09-risks-compliance-vision.md)

Each module: **Purpose · Capabilities · User flows · Entities · Permissions · Dashboard tie-in**

Cross-refs: [03 Sites & cameras](03-sites-modules-cameras.md) · [04 Dashboard UX](04-web-dashboard-ux.md) · [07 Data model](07-data-model-and-apis.md) · [10 RBAC](10-users-roles-permissions.md)

---

## Module 1 — Users, roles & permissions

**Purpose:** Secure access to the safety dashboard with **least privilege** — HSE directors see all assigned sites; site supervisors see only their projects; Python uses separate ingest tokens, never user passwords.

### Capabilities

| Capability | Detail |
|------------|--------|
| Email + password login | Laravel Fortify / Breeze; password reset email |
| **Fixed role** | `super_admin` only — always full access, cannot delete |
| **Dynamic roles** | Create/edit/delete roles; assign any permission from catalog |
| Permission catalog | Seeded on deploy; grouped checkboxes in **U05** |
| Site assignment | `site_user` pivot; or `sites.access_all` on role |
| User lifecycle | Create, deactivate (`is_active`), last login |
| Audit | Role/permission changes, site assignment, login events |

### Flows

- **A:** Admin creates user → assigns role + sites → user receives invite email  
- **B:** Supervisor tries URL for unassigned site → 403 with “Request access from admin”  
- **C:** Deactivated user → session invalidated on next request  

### Entities

`User`, `site_user`, Spatie `roles` / `permissions`

### Dashboard

Screens **U01–U03**, **U05 Roles** — [04 §10](04-web-dashboard-ux.md#10-settings--administration)

**Full spec:** [10 — Users & RBAC](10-users-roles-permissions.md)

---

## Module 2 — Sites

**Purpose:** Represent each **physical project** (construction site, plant, yard) as the top-level container for modules, cameras, alerts, and reports.

### Capabilities

| Capability | Detail |
|------------|--------|
| **Dynamic site CRUD** | Create/update/archive anytime — no code deploy |
| **Setup wizard (D33)** | Site → locations → modules → cameras |
| Map anchor | `map_center_lat/lng` + location pins |
| `settings` JSON | `external_ref`, commissioning status, custom fields |
| Shift calendar | Day/night shifts — suppress alerts outside hours |
| Blackout dates | Planned work, holidays |
| Site switcher | Header dropdown |
| **Integration API** | Upsert site by `external_ref` — [03 §6](03-sites-modules-cameras.md#6-integration--provisioning-api) |

### Flows

- **A:** Admin creates “North Tower” → sets timezone `Asia/Karachi` → enables modules in Module 3  
- **B:** HSE opens site overview → sees health score + open alerts by module  
- **C:** Archive completed project → cameras disabled; data retained per retention policy  

### Entities

`Site`, `SiteLocation`, `Shift`, `site_blackout_dates` (optional)

### Dashboard

**D20 Site overview** — [04 §4](04-web-dashboard-ux.md#4-site-overview-dashboard)

---

## Module 3 — Detection modules (per site)

**Purpose:** Turn **PPE**, **vehicle proximity**, and **working at height** on or off per site with module-specific thresholds — one site may run all three; another only PPE + height.

### Capabilities

| Capability | Detail |
|------------|--------|
| **Per-site enable/disable** | Dynamic — any catalog module on any site |
| Module settings JSON | Sliders in UI → `settings` column |
| Copy settings | From another site (admin) |
| Module status card | Events/24h, open alerts, FP rate, cameras online |
| Commissioning checklist | Locations → cameras → zones → per-camera ingest token → test POST |

### Per-module settings (examples)

| Module | `settings` keys |
|--------|-----------------|
| `ppe` | `no_helmet_min_confidence`, `required_ppe[]`, `grace_sec` |
| `vehicle_proximity` | `critical_distance_m`, `speed_aware`, `exclusion_zones_strict` |
| `working_at_height` | `harness_required_above_m`, `ladder_angle_min/max` |

### Flows

- **A:** Enable PPE on new site → wizard routes to add cameras (Module 4)  
- **B:** Disable vehicle module → ingest POST for vehicle cameras returns 403 `MODULE_DISABLED`  
- **C:** Copy settings from “Site A” to “Site B” (admin action)  

### Entities

`DetectionModule` (seed), `SiteDetectionModule`

### Dashboard

**D21 Module hub** — three cards with enable toggle + KPI strip

---

## Module 4 — Cameras (per site + module)

**Purpose:** Register **every RTSP stream** used for a given detection module — multiple cameras per module for gates, elevations, yards, and blind corners.

### Capabilities

| Capability | Detail |
|------------|--------|
| **Dynamic add/update** | Any time; assign **module** + **site location** per camera |
| Many cameras per module | Multiple streams per module at different locations |
| **Location link** | `site_location_id` — gate, yard, floor (tree supported) |
| `settings` JSON | ROI, confidence override, elevation, integration notes |
| `external_id` | VMS/CMMS sync — idempotent upsert |
| RTSP URL | Encrypted; masked in UI; test connection |
| Reference frame | Upload for zone editor |
| Health | `last_ingest_at` — online if recent POST |
| Duplicate camera | Copy zones optional |
| Bulk CSV import | Site + location + module + RTSP |

### Flows

- **A:** Add “Gate 3 — entrance” to PPE module → upload reference image → draw zones (Module 7)  
- **B:** Camera offline &gt; 2 min → alert `CAMERA_OFFLINE` on site overview + notification  
- **C:** Duplicate camera as template — copy zones to new angle (supervisor tool)  

### Entities

`Camera`, `SiteLocation`

**Detail:** [03 — Sites & cameras](03-sites-modules-cameras.md)

### Dashboard

**D33 Site setup** · **D34 Locations** · **D22** · **D23** · **D04 Zone editor**

---

## Module 5 — Ingest API tokens (per camera)

**Purpose:** One **Bearer token per camera** for the single ingest endpoint — [06](06-ai-ingestion-api.md).

### Capabilities

| Capability | Detail |
|------------|--------|
| Auto-issue on camera create | Optional setting — or manual “Generate token” on **D23** |
| Scope | **One `camera_id` only** |
| Show secret once | Copy to Python `SITEGUARD_INGEST_TOKEN` |
| Rotate / revoke | Old token invalid immediately |
| `last_used_at` | Security audit |

### Flows

- **A:** Create camera → copy camera_id + token + RTSP → Python `POST /api/ingest/camera`  
- **B:** Token leaked → revoke on camera detail → redeploy env  

### Entities

`IngestApiToken` (`camera_id` FK)

### Dashboard

**D23 Camera detail** — token panel (not a global site/module matrix)

---

## Module 6 — Camera health (from ingest)

**Purpose:** **`online` / `offline`** from whether ingest POSTs arrive — no health fields in payload.

### Capabilities

| Capability | Detail |
|------------|--------|
| `last_ingest_at` | Set on each successful POST |
| Stale camera | No POST within threshold → `offline` |
| Evidence | Every POST includes required `payload.snapshot` — [06 §3](06-ai-ingestion-api.md#3-request-body-minimal) |

### Dashboard

**D23** camera detail · **D22** health column · site overview camera grid

---

## Module 7 — Zones & rules

**Purpose:** Define **where** on each camera frame rules apply (polygons) and **what** triggers alerts (rule definitions).

### Capabilities

| Capability | Detail |
|------------|--------|
| Polygon editor | Draw on reference frame; normalized coordinates |
| Zone types | `hard_hat_required`, `vehicle_exclusion`, `work_at_height`, … |
| Rule catalog per site | Codes `PPE-001`, `VEH-002`, `HGT-001` |
| Attach rules to zones | `zone_rules` many-to-many |
| Rule DSL | JSON `definition` — classes, dwell, distance — [02](02-detection-capabilities.md) |
| Templates | “Standard PPE gate”, “Loading bay proximity” one-click apply |
| Simulation mode | Replay last detection bbox on zone overlay (debug) |

### Flows

- **A:** Draw polygon on Gate 3 image → attach `PPE-001` → save → Laravel applies zone on next ingest POST  
- **B:** Lower `no_helmet` threshold only in “Steel erection” zone via zone-level override (optional JSON)  

### Entities

`Zone`, `Rule`, `ZoneRule`

### Dashboard

**D04 Zone editor** · **D09 Rule builder**

---

## Module 8 — PPE pipeline

**Purpose:** End-to-end path from **Python PPE model** → ingest → rules → **helmet/vest/gloves** alerts.

### Capabilities

| Capability | Detail |
|------------|--------|
| Classes | `no_helmet`, `no_vest`, `person`, … — [02 §2](02-detection-capabilities.md#2-ppe-detection) |
| Multi-camera | Each PPE camera POSTs independently with its own token |
| Rules | `PPE-001` … `PPE-004` default set on site create |
| Evidence | Required `payload.snapshot` per POST — [06 §3](06-ai-ingestion-api.md#3-request-body-minimal) |
| FP feedback | Dismiss reason `false_positive` trains module KPI |
| Compliance metric | “PPE compliance %” = 1 − (critical PPE alerts / person-detection windows) — informational |

### Typical alerts

| Alert | Trigger |
|-------|---------|
| No helmet in hard-hat zone | `PPE-001` |
| No vest in machinery yard | `PPE-002` |

### Dashboard widgets

PPE compliance trend · Top cameras by PPE alerts · Last 24h event sparkline

---

## Module 9 — Vehicle proximity pipeline

**Purpose:** Detect **pedestrians too close to moving equipment** — forklifts, trucks, loaders — using distance from Python or calibrated geometry.

### Capabilities

| Capability | Detail |
|------------|--------|
| Classes | `person`, `forklift`, `truck`, `loader`, … |
| `distance_m` | Optional on detection in ingest payload — vehicle module only — [06 §3.3](06-ai-ingestion-api.md#33-optional-only-when-rule-needs-it) |
| Exclusion zones | Pedestrian-only vs vehicle routes |
| Speed-aware rules | When telematics feed present |
| Pair events | Multiple `detections[]` in one POST when person + vehicle in same frame |

### Typical alerts

| Alert | Trigger |
|-------|---------|
| Person within 3 m of moving forklift | `VEH-001` |
| Person in vehicle exclusion polygon | `VEH-002` |

### Dashboard widgets

Proximity heatmap by hour · Repeat locations bar chart · Near-miss count (critical vehicle alerts)

---

## Module 10 — Working at height pipeline

**Purpose:** Monitor **harness, guardrails, ladders, open edges** at elevation — highest severity defaults.

### Capabilities

| Capability | Detail |
|------------|--------|
| Classes | `no_harness`, `harness_visible`, `ladder`, `open_edge`, … |
| Height bands | Zone tag `height_band` when survey data available |
| Stricter workflow | All height alerts require acknowledge (no bulk dismiss) |
| Ladder angle | Server-side or future optional field — not in minimal ingest payload |

### Typical alerts

| Alert | Trigger |
|-------|---------|
| No harness at elevation | `HGT-001` |
| Person beyond guardrail | `HGT-003` |

### Dashboard widgets

Open height alerts by zone · Height module FP rate · Camera elevation tags list

---

## Module 11 — Alerts & inbox

**Purpose:** Central **operational inbox** — triage, acknowledge, assign, and close safety alerts from all modules.

### Capabilities

| Capability | Detail |
|------------|--------|
| Rule engine | `EvaluateRulesJob` after each ingest POST |
| Severity | `low` → `critical` with color + sound optional |
| Status workflow | `open` → `acknowledged` → `resolved` / `dismissed` |
| Assignee | `assigned_user_id` for supervisor queue |
| Bulk actions | Acknowledge selected (permission gated) |
| Real-time | WebSocket `alert.created` |
| Filters | Site, module, severity, camera, date, assigned to me |
| Sound | Optional chime on critical (user pref) |
| Occurrence merge | Same rule + track → increment `occurrence_count` |

### Flows

- **A:** Critical PPE alert → supervisor acknowledges → assigns investigation (Module 12)  
- **B:** False positive → dismiss with reason → feeds FP analytics  
- **C:** Duplicate camera glare → dismiss `duplicate` → rule tuning ticket  

### Entities

`DetectionEvent`, `Alert`, `AlertAction`

### Dashboard

**D01 Alert inbox** · **D02 Alert detail** — [04 §6–7](04-web-dashboard-ux.md#6-alert-inbox-d01)

---

## Module 12 — Investigations & media

**Purpose:** Group related alerts into an **incident record** with notes, snapshots, and export pack for client / regulator.

### Capabilities

| Capability | Detail |
|------------|--------|
| Create investigation | Title, owner, linked `alert_ids[]` |
| Timeline | All detection events + actions across alerts |
| Media viewer | Snapshot with bbox overlay; clip playback |
| Notes | Markdown notes; append-only audit |
| Export pack | ZIP: PDF summary + images + CSV event list |
| Status | `open` / `closed` with closure reason |

### Flows

- **A:** Three related harness alerts → “Investigation #2026-014” → export for weekly HSE meeting  
- **B:** AI proposes investigation → user confirms → Module 14 `draft_investigation`  

### Entities

`Investigation`, `InvestigationAlert`, `MediaObject`

### Dashboard

**D07 Investigation** · media panel on **D02**

---

## Module 13 — Reports & notifications

**Purpose:** **Compliance reporting** and proactive notification to email, Slack, or webhook when thresholds breach.

### Capabilities

| Capability | Detail |
|------------|--------|
| Report types | Weekly compliance, alert summary, FP rate by camera, module comparison |
| Formats | PDF (branded), CSV raw events |
| Scheduled | Cron weekly email to distribution list |
| Notification channels | Email, Slack, generic webhook |
| Min severity | Only `high`+ or only `critical` |
| Per-site or global | Channel may filter `site_ids` |
| Test send | “Send test alert” button |

### Report sections (PDF)

1. Executive summary (open alerts, trends)  
2. Module breakdown table  
3. Top 10 cameras by events  
4. FP rate and acknowledged time SLA  
5. Investigation closures  

### Entities

`NotificationChannel`, `NotificationDelivery`, `scheduled_reports` (optional)

### Dashboard

**D08 Reports** · Settings → Notifications

---

## Module 14 — AI assistant

**Purpose:** **Natural-language** queries and drafted actions on **real** safety data — **[Laravel AI SDK](https://laravel.com/docs/ai-sdk)** (`laravel/ai`) with `SiteSafetyAgent` + tools.

### Capabilities

| Capability | Detail |
|------------|--------|
| **`laravel/ai` agent** | `SiteSafetyAgent` — providers via `config/ai.php` |
| Site-scoped chat | Threads per `user` + `site` (`ai_sessions`) |
| Command bar | `Cmd+K` — single-shot `prompt()` |
| Read tools | `QueryAlerts`, `QueryCameraHealth`, `ReportSummary`, … |
| Propose tools | `DraftInvestigation`, … → structured `proposed_actions` |
| Citations / charts | `HasStructuredOutput` schema |
| Voice | Browser STT or Laravel AI transcription |
| Kill switch | `settings.ai_enabled` + `ai.assistant.use` |

### Never

Client-side tools · Auto-acknowledge · Auto rule change · Worker identification

### Entities

`AiSession`, `AiMessage`, `AiAuditLog`  
**AI:** `SiteSafetyAgent` + `app/Ai/Tools/*` via **`laravel/ai`**  
**Service:** `SiteSafetyChatService` (wraps agent + persistence)

**Detail:** [11 — AI Assistant](11-ai-assistant.md)

### Dashboard

**A01–A03** — [04 §14](04-web-dashboard-ux.md#14-ai-assistant-surfaces)

---

## Module map (dependency)

```text
1 Users ─────────────────────────────────────────┐
2 Sites ──► 3 Modules ──► 4 Cameras ──► 7 Zones  │
                    │              │              │
                    └──► 5 Ingest token (per camera)
                              │
                    6 Camera health (from POST)
                              │
8 PPE ─ 9 Vehicle ─ 10 Height ──► 11 Alerts ◄─────┘
                                      │
                    12 Investigations ◄─┤
                    13 Reports ─────────┤
                    14 AI assistant ────┘
```

---

## Out of product scope

| Item | Notes |
|------|-------|
| Python vision codebase | Separate repository |
| Mobile native app | Responsive web only |
| Multi-tenant SaaS | Single Laravel install |

---

[← Index](README.md) · **Next:** [09 — Risks & compliance](09-risks-compliance-vision.md)
