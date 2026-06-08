# 14 — Gas, CO₂ & Environmental Monitoring

[← Index](README.md) · **Linked:** [12 IoT ingest](12-iot-ingestion-and-edge.md) · [17 UDPM report](17-udpm-weekly-report.md) · **Next:** [15 — QR equipment](15-qr-equipment.md)

**Module keys:** `gas_monitoring`, `environmental` (CO₂ stored under `environmental` with `parameter = co2_ppm`)

---

## 1. Purpose

Continuous industrial safety sensor data for SCC dashboard and **UDPM-GM-0058 §6.5** items iv, viii, ix, x:

| Stream | Hardware | Path to SCC |
|--------|----------|-------------|
| **4-gas** (LEL, O₂, H₂S, CO) | Honeywell BW GasAlertMicroClip XL | Pi Zero → **site WiFi** → `POST /api/ingest/gas` |
| **CO₂** | NDIR RS485/Modbus | Jetson poll → `POST /api/ingest/sensor` |
| **Weather / air quality** | Client RS485 sensors | Jetson Modbus → `POST /api/ingest/sensor` |

**Prerequisite:** Client site WiFi operational before gas commissioning ([18](18-saudi-aramco-compliance.md) assumption #1).

---

## 2. Data model

### 2.1 `gas_gateways`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `edge_device_id` | FK | R — parent vehicle |
| `name` | string | R — "Vehicle 2 gas gateway" |
| `code` | string | R — `gas-gw-vehicle-02` |
| `vehicle_label` | string | O — display on dashboard |
| `last_ingest_at` | datetime | RO |
| `health_status` | enum | `online`, `offline` |
| `settings` | json | `poll_interval_sec`, `detector_serial` |

### 2.2 `sensor_devices`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `edge_device_id` | FK | O — vehicle edge |
| `device_type` | enum | `co2_ndir`, `weather_station`, `air_quality`, `custom_modbus` |
| `name` | string | R |
| `code` | string | R |
| `modbus_config` | json | R — see §3 |
| `last_ingest_at` | datetime | RO |
| `settings` | json | thresholds per parameter |

### 2.3 `sensor_readings` (partition by month recommended)

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `sensor_device_id` | FK | O — null for gas-only rows |
| `gas_gateway_id` | FK | O — null for Modbus rows |
| `parameter` | string | R — catalog key |
| `value` | decimal | R |
| `unit` | string | R |
| `quality` | enum | `good`, `uncertain`, `bad` |
| `read_at` | datetime | R |
| `event_id` | uuid | R — idempotency |
| `assurance_tier` | enum | `instrumented` |

### 2.4 `gas_readings` (optional normalized view)

Alternatively store 4-gas as single row per event:

| Column | Type | Notes |
|--------|------|-------|
| `gas_gateway_id` | FK | R |
| `lel_pct`, `o2_pct`, `h2s_ppm`, `co_ppm` | decimal | R |
| `alarm_state` | enum | R |
| `alarm_gases` | json | R |
| `poll_type` | enum | `scheduled`, `immediate` |
| `read_at` | datetime | R |
| `event_id` | uuid | R |

**Implementation:** Use `gas_readings` table + mirror summary into `sensor_readings` for unified charts, or single `sensor_readings` with parameter keys — pick one; docs show both for clarity.

### 2.5 `sensor_alarms`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `source_type` | enum | `gas_gateway`, `sensor_device` |
| `source_id` | FK | R |
| `parameter` | string | R |
| `value` | decimal | R |
| `threshold` | decimal | R |
| `severity` | enum | `high`, `critical` |
| `alarm_at` | datetime | R |
| `cleared_at` | datetime | O |
| `alert_id` | FK | O — link to alert inbox |

---

## 3. Modbus configuration (`sensor_devices.modbus_config`)

```json
{
  "protocol": "modbus_rtu",
  "port": "/dev/ttyUSB0",
  "baud": 9600,
  "parity": "N",
  "slave_id": 1,
  "poll_interval_sec": 60,
  "registers": [
    {
      "parameter": "co2_ppm",
      "function": "holding",
      "address": 0,
      "count": 1,
      "scale": 1.0,
      "offset": 0,
      "unit": "ppm"
    },
    {
      "parameter": "temperature_c",
      "function": "holding",
      "address": 10,
      "count": 1,
      "scale": 0.1,
      "offset": 0,
      "unit": "°C"
    }
  ]
}
```

**Phase 2:** Environmental sensor audit confirms register map per client hardware.

Edge agent reads config from Laravel integration export or local cached JSON refreshed on VPN connect.

---

## 4. Default thresholds

Stored in `sites.settings`:

```json
{
  "gas_thresholds": {
    "lel_pct": { "low": 10, "high": 20 },
    "o2_pct": { "low": 19.5, "high": 23.5 },
    "h2s_ppm": { "low": 10, "high": 20 },
    "co_ppm": { "low": 35, "high": 200 }
  },
  "co2_ppm": { "warning": 5000, "high": 30000 },
  "gas_offline_minutes": 20,
  "sensor_offline_minutes": 5
}
```

---

## 5. Alert rules

| Rule code | Condition | Severity | Module |
|-----------|-----------|----------|--------|
| `GAS-001` | LEL ≥ high threshold | critical | gas_monitoring |
| `GAS-002` | O₂ outside range | critical | gas_monitoring |
| `GAS-003` | H₂S ≥ high | critical | gas_monitoring |
| `GAS-004` | CO ≥ high | critical | gas_monitoring |
| `GAS-005` | No gas ingest &gt; `gas_offline_minutes` | high | gas_monitoring |
| `ENV-001` | CO₂ ≥ warning | high | environmental |
| `ENV-002` | Parameter exceeds device threshold | configurable | environmental |

**Local hardware alarm** on Honeywell BW is independent — dashboard alert is supplementary.

---

## 6. Dashboard (D47–D49)

### D47 — Live gas panel

- One card per vehicle/gateway: LEL%, O₂%, H₂S, CO with gauge + alarm badge  
- Last sync time; amber if &gt; 20 min (scheduled poll)  
- Link to historical trend  

### D48 — CO₂ & environmental

- Combined trend chart: CO₂, temp, humidity, wind  
- Tab per `sensor_device`  
- Weekly min/max/avg summary strip  

### D49 — Sensor alarms history

- Filterable table of `sensor_alarms` + linked alerts  

**55" display:** Rotating gas panel + environmental strip when not showing cameras.

---

## 7. Reporting aggregates (for UDPM)

`GenerateUdpmWeeklyReportJob` queries:

| Metric | Query |
|--------|-------|
| Gas summary | min/max/avg per gas per vehicle; alarm count |
| CO₂ summary | min/max/avg per vehicle |
| Weather | daily avg temp, humidity, max wind |
| Environmental | client parameters per Phase 2 map |

Detail: [17](17-udpm-weekly-report.md).

---

## 8. Permissions

| Permission | Allows |
|------------|--------|
| `gas.view` | Live gas dashboard |
| `environmental.view` | CO₂ + weather dashboards |
| `sensors.manage` | CRUD devices, thresholds, Modbus map |
| `gas_thresholds.manage` | Site-level gas limits |

---

## 9. Implementation notes

### 9.1 Gas path isolation

Do **not** route gas POSTs through vehicle 4G. Pi Zero uses site WiFi directly to SCC HTTPS endpoint.

### 9.2 Sampling location disclaimer

UI footer on D47: *"Readings represent detector location on surveillance vehicle (~0.4 m height), not site-wide ambient air."*

### 9.3 Assurance

All `sensor_readings` / `gas_readings`: `assurance_tier = instrumented`. Use for UDPM automated sections without human ack.

### 9.4 Calibration records

`gas_gateways.settings.last_calibration_at` + optional `calibration_cert_path` — manual entry at commissioning.

---

[← Index](README.md) · **Next:** [15 — QR equipment](15-qr-equipment.md)
