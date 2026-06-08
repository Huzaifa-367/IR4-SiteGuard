# 04 — Web Dashboard UX

[← Index](README.md) · **Next:** [05 Technical architecture](05-technical-architecture.md)

**Platform:** Laravel + Inertia (Vue 3 or React). Desktop-first (1440px+); usable on tablet in site office. **No mobile app.**

**Goal:** An **informational command center** — supervisors see safety posture, trends, and evidence at a glance, then drill down to act. Not a bare alert list.

---

## 1. Design principles

| Principle | Implementation |
|-----------|----------------|
| **Informational first** | Every landing view answers: *How safe is my site right now?* before *What clicked last?* |
| **Alert-action second** | Critical queue visible without burying KPIs |
| **Evidence in one click** | Snapshot + clip + bbox on same panel |
| **Module-aware** | PPE / vehicle / height each have color + icon language |
| **Scannable density** | Cards, sparklines, heatmaps — avoid empty whitespace and wall-of-text tables |
| **Audit-ready** | Every human action on alerts logged with user + timestamp |
| **Control-room ready** | Dark theme default; high contrast severity colors |

### Visual language

| Module | Color accent | Icon |
|--------|--------------|------|
| PPE | Amber `#F59E0B` | Hard hat |
| Vehicle proximity | Blue `#3B82F6` | Truck / warning triangle |
| Working at height | Purple `#8B5CF6` | Ladder |
| System (camera offline) | Slate `#64748B` | Camera |

Severity (cross-module): `critical` red · `high` orange · `medium` yellow · `low` slate

---

## 2. Information architecture

```text
/  Global home (multi-site KPIs + critical strip)
/sites/{site}  Site overview (safety score + module cards + map)
/sites/{site}/modules/{module}  Module hub (cameras + module KPIs)
/sites/{site}/modules/{module}/cameras/{camera}  Camera + zones
/sites/{site}/alerts  Alert inbox
/alerts/{id}  Alert detail
/sites/{site}/investigations
/reports
/settings  (global + users + tokens + notifications)
/sites/{site}/ai  AI chat
```

---

## 3. Global home dashboard

**Route:** `/` or `/dashboard`  
**Permission:** `alerts.view` + union of assigned sites

### 3.1 Layout (wireframe)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ SiteGuard   [All sites ▼]   🔍 Cmd+K   🔔 3   User ▼                      │
├──────────────────────────────────────────────────────────────────────────┤
│ SAFETY POSTURE — All sites · Last 24h · Updated 14:32                    │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│ Open alerts  │ Critical     │ Cameras      │ Avg ack time │ FP rate      │
│     47       │     8 ▲2     │  42/45 online│   18 min     │   14%      │
│  ▁▂▃▅ spark  │  vs yday     │  93% up      │  target 15m  │  target <20% │
├──────────────┴──────────────┴──────────────┴──────────────┴──────────────┤
│ CRITICAL NOW (live)                                    [View all alerts]│
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ ● PPE · No helmet · North Tower · Gate-3 · 2 min ago    [Open]     │  │
│ │ ● HEIGHT · No harness · West Yard · Scaffold-2 · 5 min ago [Open]  │  │
│ └────────────────────────────────────────────────────────────────────┘  │
├───────────────────────────────┬──────────────────────────────────────────┤
│ ALERTS BY MODULE (7d)         │ SITE HEALTH SCORES                       │
│ [stacked bar: PPE|Veh|Height]   │ North Tower    78 ▓▓▓▓▓▓▓▓░░  ↓4       │
│                               │ West Yard      91 ▓▓▓▓▓▓▓▓▓░  ↑2       │
│                               │ Highway Phase2 65 ▓▓▓▓▓▓░░░░  ↓11      │
├───────────────────────────────┼──────────────────────────────────────────┤
│ ALERT HEATMAP (hour × day)    │ CAMERAS NEEDING ATTENTION                │
│ [grid 7×24, intensity]        │ • Highway P2 — Yard-cam-4 offline 2h     │
│                               │ • North Tower — Gate-2 degraded FPS      │
├───────────────────────────────┴──────────────────────────────────────────┤
│ TREND — Events vs acknowledged (14d)          [Insights ▼] [Export]      │
│ [dual line chart]                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 KPI definitions (global home)

| KPI | Calculation | Good direction |
|-----|-------------|----------------|
| **Open alerts** | `status = open` across visible sites | Lower |
| **Critical open** | `severity = critical` AND `open` | Lower |
| **Cameras online** | `health_status = online` / total active | Higher |
| **Avg acknowledge time** | Mean(`acknowledged_at - opened_at`) rolling 7d | Lower |
| **False positive rate** | `dismiss` with `false_positive` / total dismissed 7d | Lower |
| **Events/24h** | Count `detection_events` | Informational (context) |

Each KPI card: **big number**, **delta vs prior period**, **sparkline** (14 points).

---

## 4. Site overview dashboard

**Route:** `/sites/{site}`  
**Screen ID:** D20

### 4.1 Safety health score (0–100)

Informational composite — not a regulatory certification.

| Factor | Weight | Source |
|--------|--------|--------|
| Open critical alerts (normalized) | 30% | `alerts` |
| Camera availability | 25% | `cameras.health_status` |
| Acknowledge SLA (&lt; 30 min critical) | 20% | `alert_actions` |
| False positive rate | 15% | dismiss reasons |
| Trend (7d alert volume vs prior 7d) | 10% | `detection_events` |

Display: circular gauge + **one sentence insight** — e.g. *“Score dropped mainly from 3 offline cameras and 2 unacknowledged critical height alerts.”*

### 4.2 Module cards (three columns)

Each enabled module shows:

```text
┌─────────────────────────────┐
│ 🦺 PPE            [Enabled] │
│ Open: 12  Critical: 3       │
│ Events 24h: 1,240           │
│ FP rate: 11%                │
│ Cameras: 8/8 online         │
│ [Open module] [Alerts]      │
└─────────────────────────────┘
```

Disabled modules: greyed card with “Enable module” CTA (`modules.configure`).

### 4.3 Site map panel

- Floor plan upload or satellite pin  
- Camera pins colored by health (green/amber/red)  
- Optional heat overlay: alert count per camera last 7d  
- Click pin → camera detail  

### 4.4 Activity feed (informational)

Chronological **site events** (not only alerts):

| Type | Example line |
|------|----------------|
| `alert.opened` | Critical PPE — Gate-3 |
| `alert.acknowledged` | User Sara — VEH-002 |
| `camera.offline` | Yard-cam-4 |
| `camera.ingest` | Gate-3 — health OK |
| `investigation.created` | #2026-014 |

Filter chips: All · Alerts · Cameras · System

### 4.5 Camera ingest panel (on D23)

On **camera detail**: show `camera_id`, **ingest token** (masked + rotate), last ingest time, online/offline from `last_ingest_at`, link to [06](06-ai-ingestion-api.md).

---

## 5. Module hub dashboard

**Route:** `/sites/{site}/modules/{module}`  
**Screen ID:** D21

### 5.1 Module header strip

- Module name + description  
- Toggle enable (permission `modules.configure`)  
- Settings drawer: thresholds JSON presented as **sliders** (not raw JSON)  
- Cameras online count (from `last_ingest_at`)  

### 5.2 Module KPI row

| PPE example | Vehicle example | Height example |
|-------------|-----------------|----------------|
| Compliance proxy % | Near-miss count 7d | Open critical height |
| Top violation: no helmet | Min distance today | Zones with most events |
| Peak hour chart | Repeat locations | Harness violations trend |

### 5.3 Camera table (informational columns)

| Column | Content |
|--------|---------|
| Name | + thumbnail if last snapshot exists |
| Location / angle | Text |
| Status | Online dot |
| Events 24h | Count |
| Open alerts | Count |
| FP rate 7d | % |
| Last detection | Relative time |
| Actions | Configure zones · View alerts |

Sort by: open alerts desc (default), events, name.

---

## 6. Alert inbox (D01)

**Route:** `/sites/{site}/alerts` or global `/alerts`

### 6.1 Filters (persistent sidebar or top bar)

- Site (if global)  
- Module: PPE | Vehicle | Height  
- Severity: multi-select  
- Status: open / acknowledged / all  
- Camera  
- Assigned: me / unassigned / anyone  
- Date range  
- Search: title, rule code, track id  

### 6.2 Saved views

- “My open critical”  
- “Today PPE”  
- “Unassigned”  

### 6.3 List + detail split (desktop)

Left: scrollable alert cards (see §7). Right: live detail preview without full navigation.

---

## 7. Alert card & detail (D02)

### 7.1 Card

```text
┌────────────────────────────────────────────────────────────┐
│ [CRITICAL]  PPE — No helmet          North Tower           │
│ Gate-3 · Steel erection zone · 14:32:05 (2m ago)           │
│ ┌──────────────┐  Conf: 0.91 · Rule PPE-001 · ×3 occurrences│
│ │  [snapshot]  │  From ingest · model from site/camera settings │
│ │  + bbox      │                                           │
│ └──────────────┘                                           │
│ Assigned: —  [Acknowledge] [False +] [Investigate] [Open]  │
└────────────────────────────────────────────────────────────┘
```

### 7.2 Detail page sections

| Section | Content |
|---------|---------|
| **Hero media** | Large snapshot; clip player; frame scrubber if multi-frame |
| **Detection timeline** | All events for same `track_id` |
| **Rule explanation** | Plain English: what rule fired, dwell, zone name |
| **Metadata** | Camera, module, location, model (from settings), `last_ingest_at` |
| **Action history** | `alert_actions` audit list |
| **Related** | Link “3 similar alerts this week” |
| **Actions** | Acknowledge, assign, dismiss, add to investigation |

---

## 8. Camera & zone screens

| ID | Screen | Information shown |
|----|--------|-----------------|
| D22 | Camera list | Table under module hub |
| D23 | Camera detail | Live status, 24h event chart, zone list, recent alerts |
| D04 | Zone editor | Reference image, polygon list, rule badges per zone |
| D05 | Camera health (global) | All sites table for IT — offline &gt; 1h |
| D09 | Rule builder | Rule templates + DSL advanced tab |

---

## 9. Investigations & reports

### D07 Investigation

- Linked alerts sidebar with severity badges  
- Combined timeline  
- Notes + export pack  
- Status banner open/closed  

### D08 Reports

| Report | Contents |
|--------|----------|
| Weekly compliance | Score trend, module table, top cameras, SLA |
| Alert register | Full CSV of alerts in range |
| Camera uptime | % online per camera |
| FP analysis | By rule, by camera, by module |

Preview PDF in browser before download.

---

## 10. Settings & administration

| ID | Screen |
|----|--------|
| U01–U03 | Users — create/edit, assign **dynamic role** + sites |
| U05 | **Roles & permissions** — create role, permission checklist; `super_admin` read-only lock |
| D31 | Notification channels + test |
| D32 | Global settings — retention, `ai_enabled`, integrations/webhooks |
| D35 | Integrations — API keys, webhook URLs, test event |

---

## 10a. Site setup & locations (dynamic topology)

### D33 — Site setup wizard

**Route:** `/sites/{site}/setup` · **Permission:** `sites.update`

| Step | UI |
|------|-----|
| 1 Site info | Name, code, timezone, map pin |
| 2 Locations | Add tree or flat list — **D34** embedded |
| 3 Modules | Toggle PPE / Vehicle / Height; per-module settings sliders |
| 4 Cameras | Table: pick **module** + **location** + RTSP + name; bulk CSV import |
| 5 Commissioning | Copy camera_id + token + RTSP · test POST with snapshot + one detection |

Progress saved per step; can exit and resume.

### D34 — Site locations

**Route:** `/sites/{site}/locations`

- Tree view (parent/child) or flat list with search  
- Map: drag pins for `map_pin_lat/lng`  
- Per location: name, code, settings (height band, notes)  
- Camera count badge per location  
- Delete blocked if cameras still assigned (or force reassign modal)  

### Camera form (D22 / D23)

| Field | Control |
|-------|---------|
| Detection module | Dropdown — catalog modules enabled on site |
| Location | Dropdown from `site_locations` |
| Name, code, angle, RTSP | Standard inputs |
| Settings | Advanced JSON or structured fields (ROI, confidence) |
| External ID | Integration sync field |

---

## 11. Informational widgets catalog

Reusable components across dashboards:

| Widget | Data source | Use |
|--------|-------------|-----|
| `KpiCard` | aggregated queries | Big number + delta + sparkline |
| `SeverityDonut` | alerts by severity | Site + module overview |
| `ModuleBar` | alerts by module | Global home |
| `EventSparkline` | detection_events hourly | Camera row |
| `AlertHeatmap` | alerts by hour × weekday | Global + site |
| `SafetyScoreGauge` | composite formula | Site overview |
| `CameraStatusGrid` | cameras | Module hub |
| `TrendDualLine` | events vs acks | Global home |
| `ActivityFeed` | audit + system events | Site overview |
| `TopCamerasTable` | group by camera_id | Reports |
| `FpRateBadge` | dismiss reasons | Camera table |

All widgets respect **site scope** and permissions.

---

## 12. Real-time & freshness

| Mechanism | Behavior |
|-----------|----------|
| WebSocket | Push `alert.created`, `alert.updated`, `camera.health` → update KPIs without full reload |
| Polling fallback | 60s refresh KPI strip if WS unavailable |
| Stale indicator | “Data as of 14:32:05” in header; yellow if &gt; 5 min stale |
| Critical sound | Optional user pref — chime on new critical |

---

## 13. Empty & error states

| State | Message + action |
|-------|------------------|
| No sites assigned | “No sites linked to your account” — contact admin |
| New site, no cameras | Commissioning checklist widget |
| No open alerts | Green banner “No open alerts” + still show KPIs |
| Module disabled | Grey module card — enable CTA |
| Python offline | Red banner on module hub — link to tokens doc |
| Ingest stopped | Events 24h = 0 + last event timestamp amber |

---

## 14. AI assistant surfaces

| ID | Surface |
|----|---------|
| A01 | **Chat drawer** — site context pinned; suggested prompts: “Summarize today”, “Offline cameras”, “Draft investigation for critical” |
| A02 | **Command bar** — global; parses to filters or navigates |
| A03 | **Confirm modal** — proposed action diff |

Suggested prompt chips on site overview:

- “Why did safety score drop?”  
- “List unacknowledged critical alerts”  
- “Which camera has most false positives?”  

Detail: [11 — AI Assistant](11-ai-assistant.md)

---

## 15. Accessibility & locale

- WCAG 2.1 AA — severity not color-only (icons + labels)  
- Keyboard: inbox navigable with j/k; Cmd+K command bar  
- Timestamps: site timezone with tooltip UTC  
- English UI; copy short and operational  

---

## 16. Screen index (complete)

| ID | Name |
|----|------|
| D00 | Global home dashboard |
| D01 | Alert inbox |
| D02 | Alert detail |
| D04 | Zone editor |
| D05 | Camera health (all sites) |
| D07 | Investigation |
| D08 | Reports |
| D09 | Rule builder |
| D20 | Site overview |
| D21 | Module hub |
| D22 | Camera list |
| D23 | Camera detail (ingest token, health, last POST) |
| D31 | Notifications |
| D32 | Global settings |
| D33 | Site setup wizard |
| D34 | Site locations |
| D35 | Integrations |
| D11 | Model / FP analytics |
| U01–U03 | Users admin |
| U05 | Roles & permissions (dynamic) |
| A01–A03 | AI assistant |

---

## 17. Out of product scope (UX)

- Worker self-service portal  
- Native mobile app  
- VR / digital twin viewer  

---

[← Index](README.md) · **Next:** [05 — Technical architecture](05-technical-architecture.md)
