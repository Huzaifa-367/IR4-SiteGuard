# 16 — HSE Incidents & Life Saving Rules (LSR)

[← Index](README.md) · **Linked:** [02 Detection](02-detection-capabilities.md) · [13 RFID](13-rfid-ssms.md) · **Next:** [17 — UDPM weekly report](17-udpm-weekly-report.md)

**Module keys:** `hse_incidents`, `lsr`  
Combines **automated** detection (camera + RFID) with **manual** workflows for permit-dependent LSR.

---

## 1. HSE incident module

### 1.1 Automated detection triggers

| Trigger | Source | Alert / incident draft |
|---------|--------|------------------------|
| Fall / worker down | Camera `fall_detected` class | `HSE-001` critical |
| Stationary RFID tag | `RFID-003` | `HSE-002` high |
| **Correlated** fall + stationary | Both within 30 s, same RFID zone | Auto-create `hse_incidents` draft `status = pending_classification` |

### 1.2 Fall detection (vision)

Add to PPE or dedicated module `incident_vision`:

| Class key | Description |
|-----------|-------------|
| `fall_detected` | Person transitioned to ground posture in work zone |
| `person_prone` | Sustained prone &gt; N seconds |

Rules:

| Rule | Condition | Severity |
|------|-----------|----------|
| `HSE-V-001` | `fall_detected` in active work zone | critical |
| `HSE-V-002` | `person_prone` dwell ≥ 10 s | high |

**Human ack required** before closing — same as height module.

### 1.3 Incident record (`hse_incidents`)

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `incident_number` | string | R — auto `INC-2026-00042` |
| `status` | enum | `draft`, `pending_classification`, `classified`, `closed` |
| `severity` | enum | O until classified — `minor`, `major`, `recordable`, `near_miss` |
| `incident_type` | enum | `fall`, `gas`, `ppe`, `vehicle`, `other` |
| `occurred_at` | datetime | R |
| `rfid_zone_id` | FK | O — auto from RFID |
| `camera_id` | FK | O |
| `alert_ids` | json | linked alerts |
| `workers_involved` | json | `[{ worker_record_id, role_in_incident }]` — from RFID zone roster |
| `classification` | json | officer form — see §1.4 |
| `video_evidence_media_ids` | json | clips from edge |
| `classified_by_user_id` | FK | O |
| `classified_at` | datetime | O |

**Privacy:** `workers_involved` populated from RFID only — never from face recognition.

### 1.4 Classification form (D51)

Safety officer completes on SCC dashboard:

| Field | Type | Required |
|-------|------|----------|
| Incident type | select | yes |
| Severity | select | yes |
| Nature of incident | textarea | yes |
| Immediate action taken | textarea | yes |
| Corrective action | textarea | yes |
| Root cause category | select | yes |
| Personnel involved | multi-select workers | yes |
| Actions taken | textarea | yes — UDPM mandatory |

On submit: `status = classified` → included in next UDPM weekly report §ii.

### 1.5 Video evidence

Edge agent on alert:

1. Copy ±30 s clip from rolling buffer to SCC via VPN media upload.  
2. Link `media_objects` to `hse_incidents`.  

Laravel route: `POST /api/ingest/media` (edge token) — multipart clip + `incident_draft_id` or `alert_id`.

---

## 2. Life Saving Rules (LSR)

### 2.1 Automated LSR categories

| LSR category | Detection | Rule codes |
|--------------|-----------|------------|
| Missing PPE (helmet, vest, harness, mask) | Camera AI | `PPE-*`, `LSR-PPE-001` |
| Red zone / restricted intrusion | RFID geofence | `RFID-001` → `LSR-RZ-001` |
| Unauthorized personnel in zone | RFID allow-list | `RFID-001` variant → `LSR-AZ-001` |
| Working at height without harness | Camera + RFID `height_work` zone | `HGT-001` + zone → `LSR-HGT-001` |
| Worker down / incapacitation | Fall + stationary RFID | `HSE-001`/`RFID-003` → `LSR-WD-001` |
| Zone occupancy exceeded | RFID count | `RFID-002` → `LSR-OC-001` |

### 2.2 Manual LSR categories (permit system not integrated)

| LSR category | Workflow |
|--------------|----------|
| Working without a permit | Manual log form |
| Hot work without fire watch | Manual log form |
| SIMOPS violations | Manual log form |

Cannot auto-detect without Digital Work Permit API — log via **D52 LSR manual entry**.

### 2.3 `lsr_violation_logs`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `lsr_category` | string | R — seeded catalog |
| `detection_mode` | enum | `automated`, `manual` |
| `occurred_at` | datetime | R |
| `alert_id` | FK | O — if automated |
| `worker_record_ids` | json | O — RFID only |
| `rfid_zone_id` | FK | O |
| `camera_id` | FK | O |
| `description` | text | R |
| `actions_taken` | text | R — **UDPM required** |
| `logged_by_user_id` | FK | R for manual; null if automated |
| `snapshot_media_id` | FK | O — anonymous for PPE |

### 2.4 LSR category seed

```php
[
  'LSR-PPE-001' => 'Missing required PPE',
  'LSR-RZ-001'  => 'Red zone / restricted area intrusion',
  'LSR-AZ-001'  => 'Unauthorized personnel in zone',
  'LSR-HGT-001' => 'Work at height without harness',
  'LSR-WD-001'  => 'Worker down / incapacitation',
  'LSR-OC-001'  => 'Zone occupancy limit exceeded',
  'LSR-PRM-001' => 'Working without a permit',
  'LSR-HW-001'  => 'Hot work without fire watch',
  'LSR-SIM-001' => 'SIMOPS violation',
]
```

### 2.5 Automated → LSR pipeline

```text
Alert created (PPE/RFID/Height/HSE)
  → If rule flagged lsr_category in rules.definition
  → Create lsr_violation_logs row (detection_mode = automated)
  → actions_taken empty until officer adds via alert detail UI
```

Officer must fill **actions taken** within SLA (configurable, default 24 h) before weekly report export.

---

## 3. Vision ↔ RFID correlation

`VisionRfidCorrelationService`:

```text
INPUT: alert_id (vision), time window ±30s
  1. Resolve camera → site_location / map proximity to rfid_zones
  2. Query rfid_tag_last_seen in matching zones
  3. Attach workers_involved to hse_incidents draft (NOT to anonymous PPE alert)
  4. For LSR-HGT-001: require no_harness alert AND tag in height_work zone
```

**Never** copy worker name into PPE violation alert title or snapshot overlay.

---

## 4. Dashboard

| ID | Screen |
|----|--------|
| D51 | HSE incident list + classification form |
| D52 | LSR log (auto + manual tabs) |
| D53 | LSR actions pending (missing actions_taken) |

Alert detail **D02** additions:

- "Create HSE incident" button  
- "Log LSR action" inline form  
- Show linked `lsr_violation_logs`

---

## 5. Permissions

| Permission | Allows |
|------------|--------|
| `hse_incidents.view` | List/detail |
| `hse_incidents.classify` | Complete classification form |
| `lsr.view` | View LSR log |
| `lsr.log_manual` | D52 manual entry |
| `lsr.actions_update` | Add actions_taken to automated entries |

---

## 6. Detection module catalog update

Seed `detection_modules`:

| key | name |
|-----|------|
| `incident_vision` | Fall & incapacitation (camera) |

Or extend `ppe` module with fall classes — **prefer separate module** for rule clarity.

---

[← Index](README.md) · **Next:** [17 — UDPM weekly report](17-udpm-weekly-report.md)
