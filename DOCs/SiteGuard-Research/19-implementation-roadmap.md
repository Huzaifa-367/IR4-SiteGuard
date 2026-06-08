# 19 — Implementation Roadmap (Laravel)

[← Index](README.md)

Ordered build plan for implementing IR4 SCC scope in the `siteguard/` Laravel repo. Each phase is shippable and testable.

---

## Phase 0 — Foundation (existing + extend)

| Task | Doc |
|------|-----|
| Sites, locations, vision modules, cameras, zones, rules, alerts | [03](03-sites-modules-cameras.md) · [07](07-data-model-and-apis.md) |
| `POST /api/ingest/camera` | [06](06-ai-ingestion-api.md) |
| RBAC + IR4 role templates | [10](10-users-roles-permissions.md) |
| Migrate `ingest_api_tokens` to polymorphic `tokenable_type` / `tokenable_id` | [07 §3.5](07-data-model-and-apis.md#35-ingest_api_tokens-polymorphic--one-per-ingest-device) |
| Seed extended `detection_modules` catalog | [03 §4.1](03-sites-modules-cameras.md) |
| `sites.settings` flags: `data_residency`, `ppe_anonymous_violations` | [18 §10](18-saudi-aramco-compliance.md) |

**Exit criteria:** PPE ingest → alert → dashboard inbox works; permissions enforced.

---

## Phase 1 — IoT ingest layer

| Task | Doc |
|------|-----|
| Tables: `edge_devices`, `rfid_readers`, `gas_gateways`, `sensor_devices` | [12](12-iot-ingestion-and-edge.md) |
| Controllers: `IngestRfid`, `IngestSensor`, `IngestGas`, `IngestEdgeHeartbeat` | [12 §4–8](12-iot-ingestion-and-edge.md) |
| Issue tokens per device (dashboard D40) | [08 Module 5 pattern](08-product-modules.md) |
| Feature tests: token mismatch, idempotency, rate limits | [06 §5](06-ai-ingestion-api.md) |

**Exit criteria:** Postman/curl fixtures for each ingest route persist rows and return `200`.

---

## Phase 2 — RFID / SSMS

| Task | Doc |
|------|-----|
| Tables: `rfid_zones`, `worker_records`, `rfid_read_events`, `rfid_tag_last_seen`, `gate_entry_exit_log`, `site_headcount_snapshots`, `evacuation_reports` | [13](13-rfid-ssms.md) |
| `SiteHeadcountService`, `RfidZonePositionService`, `EvaluateRfidRulesJob`, `StationaryTagWatchJob` | [13 §4–5](13-rfid-ssms.md) |
| Dashboard: D41–D43, D45–D46 | [04 §19](04-web-dashboard-ux.md) |
| Permissions: §6.7 in [10](10-users-roles-permissions.md) |

**Exit criteria:** Gate entry POST → headcount increments; evacuation PDF lists on-site workers.

---

## Phase 3 — Gas & environmental

| Task | Doc |
|------|-----|
| Tables: `gas_readings`, `sensor_readings`, `sensor_alarms` | [14](14-gas-co2-environmental.md) |
| `SensorThresholdService`, gas alarm → alert | [14 §5](14-gas-co2-environmental.md) |
| Dashboard: D47–D49 | [04 §19](04-web-dashboard-ux.md) |
| Modbus config UI on `sensor_devices` | [14 §3](14-gas-co2-environmental.md) |

**Exit criteria:** Gas POST → D47 panel updates; threshold breach creates critical alert.

---

## Phase 4 — Vision extensions

| Task | Doc |
|------|-----|
| PPE classes: `face_mask`, `no_face_mask`; rule `PPE-005` | [02 §2](02-detection-capabilities.md) |
| `incident_vision` module; classes `fall_detected`, `person_prone` | [02 §5](02-detection-capabilities.md) · [16 §1.2](16-hse-incidents-lsr.md) |
| `VisionRfidCorrelationService` | [16 §3](16-hse-incidents-lsr.md) |
| `assurance_tier` on `detection_events` | [09 §6.3](09-risks-compliance-vision.md) |

**Exit criteria:** Fall alert + RFID zone creates HSE draft without naming worker on PPE card.

---

## Phase 5 — QR equipment

| Task | Doc |
|------|-----|
| Equipment tables + public route `GET /equipment/{qr_slug}` | [15](15-qr-equipment.md) |
| Dashboard D50 + ZPL print job | [15 §4](15-qr-equipment.md) |
| Scan logging | [15 §2.5](15-qr-equipment.md) |

**Exit criteria:** Create asset → print label → phone on WiFi loads E01.

---

## Phase 6 — HSE, LSR, UDPM

| Task | Doc |
|------|-----|
| `hse_incidents`, `lsr_violation_logs`, `vehicle_violation_logs`, `udpm_weekly_reports` | [16](16-hse-incidents-lsr.md) · [17](17-udpm-weekly-report.md) |
| `App\Reports\Udpm\*Query` classes + `GenerateUdpmWeeklyReportJob` | [17 §9](17-udpm-weekly-report.md) |
| Dashboard: D51–D54 | [04 §19](04-web-dashboard-ux.md) |
| `POST /api/ingest/media` for incident clips | [16 §1.5](16-hse-incidents-lsr.md) |

**Exit criteria:** Full week of seed data → UDPM PDF contains sections i–x.

---

## Phase 7 — Compliance & SCC polish

| Task | Doc |
|------|-----|
| `deployment_approvals`, commissioning checklist | [18 §3](18-saudi-aramco-compliance.md) |
| `security_audit_log`, SA read-only role | [18 §4–5](18-saudi-aramco-compliance.md) |
| D55 live view mode | [04 §18](04-web-dashboard-ux.md) |
| Retention jobs per data class | [18 §6](18-saudi-aramco-compliance.md) |
| Disable AI assistant default on new sites | [18 §9](18-saudi-aramco-compliance.md) |

**Exit criteria:** SA representative role cannot export; audit log captures PII views.

---

## Phase 8 — Edge repos (out of Laravel)

| Repo | Deliverable |
|------|-------------|
| `siteguard-python/` | Vision POST per camera |
| `siteguard-edge/` | Jetson: RFID batch, Modbus poll, heartbeat, media upload |
| `siteguard-gas-gateway/` | Pi Zero: Bluetooth poll + alarm immediate POST |

Contract: [12](12-iot-ingestion-and-edge.md).

---

## Suggested migration order (single epic branch)

```text
1. polymorphic_ingest_tokens
2. detection_modules_seed_ir4
3. edge_devices_rfid_readers
4. rfid_ssms_tables
5. gas_sensor_tables
6. equipment_qr_tables
7. hse_lsr_udpm_tables
8. deployment_approvals_security_audit
9. permissions_seed_ir4
```

---

## Test matrix (feature tests)

| Area | Minimum tests |
|------|----------------|
| Each ingest route | auth, idempotency, validation |
| Gate entry/exit | headcount up/down |
| RFID-001 | unauthorized zone alert |
| Gas threshold | alert + sensor_alarm row |
| HSE classify | status transition + UDPM payload |
| UDPM generate | 10 sections populated from fixtures |
| SA role | export routes 403 |

---

[← Index](README.md)
