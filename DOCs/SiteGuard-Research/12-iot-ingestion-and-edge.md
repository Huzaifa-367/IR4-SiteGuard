# 12 — IoT Ingestion & Edge Architecture

[← Index](README.md) · **Linked:** [06 Camera ingest](06-ai-ingestion-api.md) · [13 RFID](13-rfid-ssms.md) · [14 Gas/CO₂](14-gas-co2-environmental.md) · **Next:** [13 — RFID / SSMS](13-rfid-ssms.md)

**Audience:** Laravel backend, edge integrators (Jetson / Pi Zero), field commissioning.  
**Reference deployment:** IR4 Safety Command Centers — Central & South TCF ([IR4 Technical Proposal](../IR4%20Technical%20Proposal_v2.docx.md)).

---

## 1. Scope

SiteGuard ingests **four data planes** into one Laravel on-premise server per site:

| Plane | Sources | Primary path to SCC |
|-------|---------|---------------------|
| **Vision** | Vehicle + pole cameras → Jetson inference | 4G VPN → SCC |
| **RFID** | 8 UHF readers/site (3 vehicle, 4 pole, 1 gate) | Gate: SCC LAN; vehicle/pole: edge → 4G VPN |
| **Gas** | Honeywell BW 4-gas detector on each vehicle | Bluetooth → Pi Zero → **site WiFi** → SCC |
| **RS485 bus** | CO₂ NDIR + client environmental sensors | Jetson Modbus poll → 4G VPN → SCC |

**Design rule:** Camera ingest stays `POST /api/ingest/camera` ([06](06-ai-ingestion-api.md)). IoT uses **separate ingest routes** with **device-scoped tokens** — same auth pattern as cameras.

---

## 2. Physical topology (per site)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  SCC (main gate) — isolated LAN, no outbound internet                   │
│  PowerEdge R360 · HP AIO · 55" display · gate RFID · VPN router RUTX11   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ AES-256 VPN (4G)
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   Vehicle 1 (primary)      Vehicle 2 (field)      Vehicle 3 (field)
   Jetson J4012              Jetson                  Jetson
   PTZ+bullet cam            + gas + CO₂ + RS485      + pole WiFi relay
   RFID reader               Pi Zero → site WiFi       RFID reader
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                    Pole 1–4: fixed cam + RFID → WiFi bridge → nearest vehicle

Client site WiFi (prerequisite): gas readings only — intentional off-4G path
```

### 2.1 Asset counts (IR4 default)

| Asset | Qty/site |
|-------|----------|
| Surveillance vehicles | 3 |
| Solar poles | 4 |
| RFID readers | 8 (3+4+1 gate) |
| Gas detectors + Pi gateways | 3 (one per vehicle) |
| CO₂ sensors | 3 |
| RS485 interface modules | 3 |
| SCC server | 1 (fully independent per TCF) |

---

## 3. Edge software responsibilities

### 3.1 Jetson edge agent (`siteguard-edge` — separate repo)

| Responsibility | Detail |
|----------------|--------|
| RTSP ingest | Vehicle PTZ/bullet + pole streams received over WiFi bridge |
| Vision inference | PPE, fall detection, height/harness models → `POST /api/ingest/camera` |
| Local recording | ~12–13 days rolling on 1 TB SSD; violation clips replicated to SCC |
| RFID aggregation | RS-232/485/Ethernet reader events → batch `POST /api/ingest/rfid` |
| Modbus polling | CO₂ + environmental registers → `POST /api/ingest/sensor` |
| VPN uplink | All non-gas traffic via Teltonika RUT200 → RUTX11 at SCC |
| Health heartbeat | `POST /api/ingest/edge/heartbeat` every 60 s |

**Env per vehicle edge unit:**

```bash
SITEGUARD_SITE_ID=1
SITEGUARD_EDGE_DEVICE_ID=edge-vehicle-01
SITEGUARD_EDGE_TOKEN=sgedge_xxxxxxxx
SITEGUARD_SCC_BASE_URL=https://10.0.1.10   # SCC LAN via VPN
SITEGUARD_VPN_INTERFACE=tun0
```

### 3.2 Pi Zero gas gateway (`siteguard-gas-gateway` — separate repo)

| Responsibility | Detail |
|----------------|--------|
| Bluetooth poll | Honeywell BW GasAlertMicroClip XL every **15 min** (configurable) |
| Immediate alarm relay | On threshold breach, POST within **30 s** (don't wait for poll interval) |
| Uplink | Client **site WiFi** only — not vehicle 4G |
| Token | One `gas_gateway` device token per vehicle |

```bash
SITEGUARD_GAS_GATEWAY_ID=gas-gw-vehicle-01
SITEGUARD_GAS_TOKEN=sggas_xxxxxxxx
SITEGUARD_SCC_WIFI_URL=https://10.0.1.10
SITEGUARD_VEHICLE_EDGE_ID=edge-vehicle-01   # FK for dashboard grouping
POLL_INTERVAL_SEC=900
ALARM_IMMEDIATE=true
```

### 3.3 Gate RFID reader

Fixed reader on SCC LAN — **no edge agent**. Options:

| Option | Implementation |
|--------|----------------|
| **A (recommended)** | Reader speaks TCP/Ethernet → small `siteguard-rfid-bridge` service on SCC server or Pi on LAN → `POST /api/ingest/rfid` to localhost Laravel |
| **B** | Reader middleware pushes to Laravel queue via Redis on LAN |

Gate reader token scope: `reader_id = gate-main` only.

---

## 4. Ingest API summary

| Method | Path | Token scope | Payload |
|--------|------|-------------|---------|
| POST | `/api/ingest/camera` | Per `camera_id` | Vision — [06](06-ai-ingestion-api.md) |
| POST | `/api/ingest/rfid` | Per `rfid_reader_id` | Tag sightings batch |
| POST | `/api/ingest/sensor` | Per `sensor_device_id` | Modbus / structured readings |
| POST | `/api/ingest/gas` | Per `gas_gateway_id` | 4-gas detector readings |
| POST | `/api/ingest/edge/heartbeat` | Per `edge_device_id` | Edge health metadata |

All routes: `Authorization: Bearer {token}`, HTTPS, rate-limited, idempotent via `event_id` / `batch_id`.

Detail: §5–§8 below · RFID fields: [13](13-rfid-ssms.md) · Gas/sensor fields: [14](14-gas-co2-environmental.md).

---

## 5. `POST /api/ingest/rfid`

### 5.1 Token

One bearer token per `rfid_readers` row. Token stored in `ingest_api_tokens` with `tokenable_type = RfidReader`.

### 5.2 Request body

```json
{
  "reader_id": "550e8400-e29b-41d4-a716-446655440010",
  "payload": {
    "batch_id": "660e8400-e29b-41d4-a716-446655440011",
    "read_at": "2026-06-08T14:32:00.120Z",
    "events": [
      {
        "epc": "E2801160600002040000ABCDEF",
        "rssi": -42,
        "antenna": 1,
        "first_seen_at": "2026-06-08T14:31:58.000Z",
        "last_seen_at": "2026-06-08T14:32:00.100Z",
        "read_count": 4
      }
    ]
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `reader_id` | R | Must match token's reader |
| `batch_id` | R | UUID — idempotency for whole batch |
| `read_at` | R | Batch timestamp (UTC) |
| `events[]` | R | ≥1 for non-heartbeat batches |
| `epc` | R | ISO 18000-6C EPC |
| `rssi` | O | dBm — signal quality |
| `first_seen_at` / `last_seen_at` | O | Reader-native dwell in zone |

**Gate reader additional event type** (single-event batches allowed):

```json
{
  "events": [
    {
      "epc": "E2801160600002040000ABCDEF",
      "direction": "entry",
      "read_at": "2026-06-08T07:15:00.000Z"
    }
  ]
}
```

`direction`: `entry` | `exit` — required on gate reader rows.

### 5.3 Laravel processing

```text
POST /api/ingest/rfid
  → Validate token ↔ reader_id
  → Load reader, site, rfid_zone
  → Upsert rfid_tag_last_seen (per epc + reader zone)
  → Insert rfid_read_events (append-only)
  → If gate + direction → gate_entry_exit_log
  → Recompute site_headcount_snapshot
  → EvaluateRfidRulesJob → alerts (geofence, occupancy, stationary)
  → Update rfid_readers.last_ingest_at
```

### 5.4 Errors

| Code | HTTP |
|------|------|
| `READER_TOKEN_MISMATCH` | 403 |
| `READER_NOT_FOUND` | 400 |
| `INVALID_DIRECTION` | 422 (gate reader) |
| Duplicate `batch_id` | 200 `{ duplicate: 1 }` |

---

## 6. `POST /api/ingest/sensor`

For CO₂ (NDIR) and client environmental sensors on RS485/Modbus.

### 6.1 Request body

```json
{
  "sensor_device_id": "550e8400-e29b-41d4-a716-446655440020",
  "payload": {
    "event_id": "660e8400-e29b-41d4-a716-446655440021",
    "read_at": "2026-06-08T14:32:00.120Z",
    "readings": [
      { "parameter": "co2_ppm", "value": 412.5, "unit": "ppm", "quality": "good" },
      { "parameter": "temperature_c", "value": 38.2, "unit": "°C", "quality": "good" },
      { "parameter": "humidity_pct", "value": 22.0, "unit": "%", "quality": "good" },
      { "parameter": "wind_speed_m_s", "value": 4.1, "unit": "m/s", "quality": "good" }
    ],
    "raw_registers": { "optional": "debug only in non-prod" }
  }
}
```

### 6.2 Parameter catalog (seeded `sensor_parameters`)

| `parameter` key | Unit | Typical source |
|-----------------|------|----------------|
| `co2_ppm` | ppm | Vehicle NDIR |
| `temperature_c` | °C | Weather station |
| `humidity_pct` | % | Weather station |
| `wind_speed_m_s` | m/s | Weather station |
| `wind_direction_deg` | deg | Weather station |
| `pressure_hpa` | hPa | Weather station |
| `pm25_ug_m3` | µg/m³ | Air quality (client) |
| `pm10_ug_m3` | µg/m³ | Air quality (client) |

`quality`: `good` | `uncertain` | `bad` — from Modbus status flags.

### 6.3 Threshold alarms

Laravel `SensorThresholdService` compares readings to `sensor_devices.settings.thresholds` → creates `sensor_alarms` + optional `alerts` with `source = sensor`.

---

## 7. `POST /api/ingest/gas`

### 7.1 Request body

```json
{
  "gas_gateway_id": "550e8400-e29b-41d4-a716-446655440030",
  "payload": {
    "event_id": "660e8400-e29b-41d4-a716-446655440031",
    "read_at": "2026-06-08T14:32:00.120Z",
    "readings": {
      "lel_pct": 0.0,
      "o2_pct": 20.9,
      "h2s_ppm": 0.0,
      "co_ppm": 0.0
    },
    "alarm_state": "normal",
    "alarm_gases": [],
    "detector_serial": "BW-XXXX",
    "poll_type": "scheduled"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `alarm_state` | R | `normal` \| `low_alarm` \| `high_alarm` \| `stel` \| `twa` |
| `alarm_gases` | R | `[]` or subset of `lel`, `o2`, `h2s`, `co` |
| `poll_type` | R | `scheduled` (15 min) \| `immediate` (threshold breach) |

**Local detector alarms** always fire on hardware first; this POST is for SCC dashboard + UDPM reporting.

### 7.2 Default thresholds (site `settings.gas_thresholds`)

| Gas | Low alarm | High alarm |
|-----|-----------|------------|
| LEL | 10% | 20% |
| O₂ | &lt;19.5% | &gt;23.5% |
| H₂S | 10 ppm | 20 ppm |
| CO | 35 ppm | 200 ppm |

Configurable per site in dashboard **D42 Gas settings**.

---

## 8. `POST /api/ingest/edge/heartbeat`

```json
{
  "edge_device_id": "550e8400-e29b-41d4-a716-446655440040",
  "payload": {
    "event_id": "660e8400-e29b-41d4-a716-446655440041",
    "reported_at": "2026-06-08T14:32:00.120Z",
    "vpn_up": true,
    "storage_free_gb": 412.3,
    "pole_streams_active": 2,
    "cameras_online": 3,
    "rfid_reader_ok": true,
    "modbus_bus_ok": true,
    "software_version": "1.2.0"
  }
}
```

Updates `edge_devices.last_heartbeat_at` → `health_status` for SCC ops dashboard **D05**.

---

## 9. Laravel services (implement)

| Service | Responsibility |
|---------|----------------|
| `IngestRfidService` | Validate, persist events, headcount |
| `IngestSensorService` | Normalize parameters, thresholds |
| `IngestGasService` | Gas alarms, UDPM aggregates |
| `IngestEdgeHeartbeatService` | Edge health |
| `SiteHeadcountService` | Gate-based on-site count |
| `RfidZonePositionService` | Nearest-reader zone assignment |
| `RfidRuleEvaluationService` | Geofence, occupancy, stationary |
| `VisionRfidCorrelationService` | Harness+height zone, incident enrichment — [16](16-hse-incidents-lsr.md) |

### 9.1 Jobs

| Job | Trigger |
|-----|---------|
| `EvaluateRfidRulesJob` | After RFID ingest |
| `EvaluateSensorRulesJob` | After sensor/gas ingest |
| `RecomputeHeadcountJob` | Gate entry/exit |
| `StationaryTagWatchJob` | Scheduled every 1 min |
| `SyncViolationClipToSccJob` | Edge → SCC media |

---

## 10. `ingest_api_tokens` polymorphism

Extend [07 §3.5](07-data-model-and-apis.md#35-ingest_api_tokens-python):

| `tokenable_type` | `tokenable_id` |
|------------------|----------------|
| `Camera` | camera UUID |
| `RfidReader` | reader UUID |
| `SensorDevice` | device UUID |
| `GasGateway` | gateway UUID |
| `EdgeDevice` | edge UUID |

Column rename (migration): `camera_id` → `tokenable_id` + `tokenable_type`, or parallel `ingest_device_tokens` table — **pick one in implementation**; docs assume polymorphic `ingest_api_tokens`.

---

## 11. Network & security

| Path | Encryption | Notes |
|------|------------|-------|
| 4G VPN | AES-256 | Vision, RFID (vehicle/pole), CO₂, environmental, heartbeat |
| Site WiFi → SCC | TLS (HTTPS) | Gas only — must not queue behind video on 4G |
| SCC LAN | TLS internal | Gate RFID, workstation, 55" display |
| Outbound internet | **Blocked** | SCC server; edge may use 4G only as VPN transport |

Detail: [18 — Saudi Aramco compliance](18-saudi-aramco-compliance.md).

---

## 12. Commissioning checklist

1. Register `edge_devices`, `rfid_readers`, `sensor_devices`, `gas_gateways` in dashboard **D40 Field devices**.  
2. Issue ingest token per device; deploy env on Jetson / Pi / gate bridge.  
3. Map each RFID reader to `rfid_zone_id` (not camera zone).  
4. Map Modbus register map on each `sensor_device` (Phase 2 environmental audit).  
5. Confirm site WiFi reaches all 3 vehicle gas gateway positions.  
6. Test: RFID batch → headcount updates; gas POST → dashboard panel; CO₂ POST → trend chart.  
7. Run evacuation drill → **D45** report populates from gate + last-seen.

---

## 13. Assurance tiers (for implementers)

| Tier | Data | Implementation note |
|------|------|---------------------|
| **≥90%** | Gas/CO₂/env register values, gate entry/exit | Calibrated hardware + deterministic ingest |
| **70–89%** | Zone RFID position, distributed headcount | Document as nearest-reader, not GPS |
| **&lt;70%** | Vision PPE/fall | Anonymous alerts; human ack required |

Store `assurance_tier` on `detection_events` (`inferred`) vs `sensor_readings` / `gate_entry_exit_log` (`instrumented`).

---

[← Index](README.md) · **Next:** [13 — RFID / SSMS](13-rfid-ssms.md)
