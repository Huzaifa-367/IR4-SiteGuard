# 13 — RFID / SSMS Personnel Tracking

[← Index](README.md) · **Linked:** [12 IoT ingest](12-iot-ingestion-and-edge.md) · [16 HSE & LSR](16-hse-incidents-lsr.md) · **Next:** [14 — Gas, CO₂ & environmental](14-gas-co2-environmental.md)

**Module key:** `rfid_ssms`  
**UDPM:** SSMS headcount, positioning, evacuation, personal identification, portable device register.

---

## 1. Purpose

Passive UHF RFID (ISO 18000-6C EPC Gen 2) provides:

- **Gate-authoritative** on-site headcount (entry/exit)
- **Zone-level** last-known position (nearest reader — not GPS)
- **Identified** worker records (authorized SCC operators only)
- **Evacuation** accountability report
- **Portable device approval** register (SA Restriction of Portable Devices GI)
- **RFID geofencing** for LSR red zones, unauthorized zones, occupancy limits — [16](16-hse-incidents-lsr.md)

**Privacy split:** Vision PPE alerts remain **anonymous** (no face/link to RFID). RFID identity is used only in RFID/SSMS, HSE incident, and evacuation contexts — never auto-linked to camera snapshots.

---

## 2. Hardware layout (IR4 default per site)

| Reader position | Qty | Connectivity | Role |
|-----------------|-----|--------------|------|
| Gate (SCC main) | 1 | SCC LAN | Definitive entry/exit |
| Vehicle-mounted | 3 | → Jetson → 4G VPN | Mobile zone coverage |
| Pole-mounted | 4 | WiFi bridge → vehicle Jetson | Work-front coverage |

**Tags:** Passive UHF in badge or hard hat; EPC programmed at commissioning; linked to `worker_records`.

---

## 3. Data model

### 3.1 `rfid_zones`

Physical zones for RFID — **separate from camera `zones`** (polygons on frames).

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `name` | string | R — e.g. "Active work front A" |
| `code` | string | R — unique per site |
| `zone_type` | enum | `general`, `restricted`, `height_work`, `muster`, `gate` |
| `max_occupancy` | int | O — LSR occupancy rule |
| `authorized_worker_ids` | json | O — allow-list for restricted zones |
| `map_pin_lat/lng` | decimal | O — SCC map display |
| `is_active` | bool | R | |

### 3.2 `rfid_readers`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `rfid_zone_id` | FK | R — zone this reader represents |
| `name` | string | R |
| `code` | string | R — `gate-main`, `vehicle-01`, `pole-03` |
| `mount_type` | enum | `gate`, `vehicle`, `pole` |
| `edge_device_id` | FK | O — null for gate-on-LAN |
| `ip_address` | string | O — gate reader |
| `last_ingest_at` | datetime | RO |
| `health_status` | enum | `online`, `offline` |
| `settings` | json | read power, antenna config |

### 3.3 `worker_records`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `tag_epc` | string | R — unique per site |
| `employee_number` | string | O |
| `full_name` | string | R |
| `contractor` | string | R |
| `role` | string | R |
| `nationality` | string | O |
| `is_active` | bool | R |
| `portable_device_approved` | bool | R — GI compliance |
| `portable_devices` | json | O — `[{ "type": "phone", "serial": "…", "approved_at": "…" }]` |
| `authorized_zone_ids` | json | O — override per worker |

**Permission:** `workers.view` (masked list), `workers.manage` (full CRUD). SA representative: `workers.view` without export.

### 3.4 `rfid_read_events` (append-only)

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `rfid_reader_id` | FK | R |
| `rfid_zone_id` | FK | R — denormalized |
| `tag_epc` | string | R |
| `worker_record_id` | FK | O — resolved from epc |
| `rssi` | int | O |
| `read_at` | datetime | R |
| `batch_id` | uuid | R |

### 3.5 `rfid_tag_last_seen`

Current state per tag (upserted on ingest).

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `tag_epc` | string | R |
| `worker_record_id` | FK | O |
| `rfid_zone_id` | FK | R — last zone |
| `rfid_reader_id` | FK | R |
| `last_seen_at` | datetime | R |
| `is_on_site` | bool | R — gate logic |
| `stationary_since` | datetime | O — same zone, no movement |

**Unique:** `(site_id, tag_epc)`.

### 3.6 `gate_entry_exit_log`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `tag_epc` | string | R |
| `worker_record_id` | FK | O |
| `direction` | enum | `entry`, `exit` |
| `occurred_at` | datetime | R |
| `gate_reader_id` | FK | R |

### 3.7 `site_headcount_snapshots`

Periodic materialized headcount for reporting.

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `recorded_at` | datetime | R |
| `on_site_count` | int | R — gate-based |
| `by_zone` | json | `{ "zone_code": count }` |
| `source` | enum | `gate`, `zone_aggregate` |

---

## 4. Headcount logic

### 4.1 Authoritative on-site count (gate)

```text
on_site(epc) = last gate event direction
  entry  → true
  exit   → false
```

Recompute on every gate `POST /api/ingest/rfid` with `direction`.

### 4.2 Zone occupancy (distributed readers)

```text
zone_count(zone) = count distinct epc where last_seen.rfid_zone_id = zone
                   AND is_on_site = true
                   AND last_seen_at > now() - stale_threshold (default 15 min)
```

Display on 55" **live headcount** widget — [04 §18](04-web-dashboard-ux.md).

### 4.3 Stale tag handling

If `is_on_site` but no read for `stale_threshold` (default 30 min): flag `possibly_off_site` in UI — do not auto-exit without gate event.

---

## 5. RFID rules (alerts)

| Rule code | Condition | Severity | Source |
|-----------|-----------|----------|--------|
| `RFID-001` | Tag in `restricted` zone not in `authorized_worker_ids` | critical | LSR |
| `RFID-002` | Zone occupancy &gt; `max_occupancy` | high | LSR |
| `RFID-003` | `stationary_since` &gt; N min, `is_on_site` | high | HSE incapacitation |
| `RFID-004` | Unknown EPC (not in `worker_records`) on site | medium | Security |
| `RFID-005` | Worker on site without `portable_device_approved` when device scan logged | medium | GI |

Rules evaluated in `EvaluateRfidRulesJob` — alerts use `detection_module_id` for module `rfid_ssms` (seed catalog).

### 5.1 Stationary tag watch

Scheduled job every 60 s:

```text
FOR each rfid_tag_last_seen WHERE is_on_site
  IF rfid_zone_id unchanged for > stationary_min (default 20 min)
    SET stationary_since
    FIRE RFID-003 if not already open for this epc
```

Cross-reference with fall detection — [16](16-hse-incidents-lsr.md).

---

## 6. Evacuation report

**Route:** `POST /sites/{site}/evacuation/generate`  
**Permission:** `evacuation.generate`

### 6.1 Output (`evacuation_reports` table)

| Section | Data |
|---------|------|
| Generated at | timestamp + operator user_id |
| Total on site (gate) | count + list |
| Per worker | name, contractor, last zone, last seen, muster status |
| Unaccounted | on-site gate true but muster not checked |
| Accounted | operator checkbox per worker at muster |

### 6.2 Muster workflow (D45)

1. Operator clicks **Generate evacuation report**.  
2. Platform freezes snapshot from `rfid_tag_last_seen` + `gate_entry_exit_log`.  
3. 55" / AIO shows list; operator marks **Accounted** / **Unaccounted**.  
4. PDF export for UDPM / drill records.

---

## 7. Dashboard surfaces

| ID | Screen | Content |
|----|--------|---------|
| D40 | Field devices | RFID readers, edge, gas gateways |
| D41 | RFID zone map | Pins, live counts, reader health |
| D42 | Worker registry | Tags, contractors, device approval |
| D43 | Gate log | Entry/exit searchable table |
| D45 | Evacuation | One-click report + muster UI |
| D46 | Portable device register | Per-worker approved devices |

**55" live view:** RFID map + per-zone headcount strip — [04 §18](04-web-dashboard-ux.md).

---

## 8. Permissions (add to catalog)

| Permission | Allows |
|------------|--------|
| `rfid.view` | Dashboards, headcount (no PII export) |
| `workers.view` | See worker names on site |
| `workers.manage` | CRUD worker records, tag assignment |
| `rfid_zones.manage` | Zones, readers, geofence rules |
| `evacuation.generate` | Evacuation report |
| `gate_log.view` | Entry/exit audit |
| `portable_devices.manage` | Device approval register |

---

## 9. Integration with vision

| Scenario | Behavior |
|----------|----------|
| Height harness alert | Camera `no_harness` + worker in `height_work` RFID zone → escalate LSR alert — [16](16-hse-incidents-lsr.md) |
| HSE incident | On fall alert, attach RFID zone + on-site workers in zone (identified) as **supporting evidence** only |
| PPE violation | **Never** attach worker identity from RFID |

`VisionRfidCorrelationService` runs server-side after both event types exist within time window (default 30 s).

---

## 10. UDPM mapping

| UDPM item | RFID data |
|-----------|-----------|
| Site manpower (v) | `site_headcount_snapshots`, daily peak/avg |
| Evacuation | `evacuation_reports` |
| Personal identification | `worker_records` + gate log |
| LSR red zone / unauthorized / occupancy | RFID rules → `lsr_violation_logs` |

Detail: [17 — UDPM weekly report](17-udpm-weekly-report.md).

---

[← Index](README.md) · **Next:** [14 — Gas, CO₂ & environmental](14-gas-co2-environmental.md)
