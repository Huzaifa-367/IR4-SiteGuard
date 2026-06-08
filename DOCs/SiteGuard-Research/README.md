# SiteGuard AI — Product Research (Master Index)

**Working title:** SiteGuard AI  
**Primary deployment (IR4):** **On-premise SCC** per site — Laravel + MySQL at each Safety Command Center; no data leaves site boundary  
**Stack:** **Laravel** (dashboard + **MySQL** + multi-plane ingestion API + **AI assistant** optional) · **Python** (vision inference) · **Edge agents** (Jetson, Pi Zero gas gateway)  
**Last updated:** June 2026  
**Status:** Full product spec — vision + IoT + UDPM reporting

> **IR4 reference:** [IR4 Technical Proposal](../IR4%20Technical%20Proposal_v2.docx.md) — Central & South TCF Safety Command Centers.

---

## Product in one paragraph

SiteGuard is a **safety command center platform**: **Python/Jetson** runs vision per camera and **POSTs** to Laravel; **edge agents** ingest RFID, gas, CO₂, and environmental sensors via dedicated APIs. Operators manage sites, cameras, RFID zones, workers, equipment, and sensors in the dashboard. HSE staff use **Laravel + Inertia** for alerts, live gas/RFID panels, investigations, **UDPM-GM-0058 weekly reports**, and an optional **AI assistant**. PPE vision alerts are **anonymous**; worker identity comes from **RFID** only.

---

## How to use this documentation

| If you are… | Start here |
|-------------|------------|
| **Product / founder** | [01 — Vision & Market](01-vision-and-market.md) |
| **HSE / safety lead** | [02 — Detection](02-detection-capabilities.md) · [16 — HSE & LSR](16-hse-incidents-lsr.md) · [17 — UDPM report](17-udpm-weekly-report.md) |
| **Laravel / full-stack** | [05 — Architecture](05-technical-architecture.md) · [07 — Data model](07-data-model-and-apis.md) · [10 — RBAC](10-users-roles-permissions.md) |
| **Edge / IoT integrator** | [12 — IoT & edge](12-iot-ingestion-and-edge.md) · [06 — Camera ingest](06-ai-ingestion-api.md) |
| **RFID / SSMS** | [13 — RFID](13-rfid-ssms.md) |
| **Gas / environmental** | [14 — Gas, CO₂ & environmental](14-gas-co2-environmental.md) |
| **Equipment QR** | [15 — QR equipment](15-qr-equipment.md) |
| **Compliance (Saudi Aramco)** | [18 — SA compliance](18-saudi-aramco-compliance.md) |
| **Dashboard UI** | [04 — Web dashboard UX](04-web-dashboard-ux.md) |
| **AI assistant** | [11 — AI Assistant](11-ai-assistant.md) |

**Reading order (implementation):** Start with [19 — Implementation roadmap](19-implementation-roadmap.md), then `18` → `12` → `07` → `06` → `13` → `14` → `15` → `16` → `17` → `03` → `10` → `05` → `08` → `04` → `02` → `11` → `09`

---

## Document map

| # | File | Contents |
|---|------|----------|
| **01** | [vision-and-market.md](01-vision-and-market.md) | Problem, SCC scope, metrics |
| **02** | [detection-capabilities.md](02-detection-capabilities.md) | PPE, mask, fall, vehicle, height, vision↔RFID |
| **03** | [sites-modules-cameras.md](03-sites-modules-cameras.md) | Dynamic sites, locations, cameras |
| **04** | [web-dashboard-ux.md](04-web-dashboard-ux.md) | Dashboards, KPIs, SCC live view, new screens |
| **05** | [technical-architecture.md](05-technical-architecture.md) | Laravel + edge + dual network paths |
| **06** | [ai-ingestion-api.md](06-ai-ingestion-api.md) | `POST /api/ingest/camera` |
| **07** | [data-model-and-apis.md](07-data-model-and-apis.md) | Full schema, routes, IoT entities |
| **08** | [product-modules.md](08-product-modules.md) | Product modules 1–21 |
| **09** | [risks-compliance-vision.md](09-risks-compliance-vision.md) | Privacy, identity split, assurance tiers |
| **10** | [users-roles-permissions.md](10-users-roles-permissions.md) | RBAC + IR4 role templates |
| **11** | [ai-assistant.md](11-ai-assistant.md) | Laravel AI SDK (optional on air-gap) |
| **12** | [iot-ingestion-and-edge.md](12-iot-ingestion-and-edge.md) | Edge topology, RFID/gas/sensor ingest APIs |
| **13** | [rfid-ssms.md](13-rfid-ssms.md) | Personnel tracking, evacuation, workers |
| **14** | [gas-co2-environmental.md](14-gas-co2-environmental.md) | 4-gas, CO₂, weather, Modbus |
| **15** | [qr-equipment.md](15-qr-equipment.md) | Equipment registry, scan UX, Zebra |
| **16** | [hse-incidents-lsr.md](16-hse-incidents-lsr.md) | Incidents, LSR auto + manual |
| **17** | [udpm-weekly-report.md](17-udpm-weekly-report.md) | UDPM-GM-0058 §6.5 engine |
| **18** | [saudi-aramco-compliance.md](18-saudi-aramco-compliance.md) | GI matrix, on-prem, retention |
| **19** | [implementation-roadmap.md](19-implementation-roadmap.md) | **Phased Laravel build plan** |

---

## Core structure (data model)

```text
SiteGuard installation (per SCC site — one database)
  └── Site
        ├── Vision: modules (ppe, vehicle, height, incident_vision)
        │     └── Cameras → POST /api/ingest/camera
        ├── RFID / SSMS: rfid_zones, readers, worker_records
        │     └── POST /api/ingest/rfid
        ├── Gas: gas_gateways (Pi Zero per vehicle)
        │     └── POST /api/ingest/gas
        ├── Environmental: sensor_devices (CO₂, weather)
        │     └── POST /api/ingest/sensor
        ├── Equipment: equipment_assets → QR scan /equipment/{slug}
        ├── HSE / LSR: hse_incidents, lsr_violation_logs
        ├── UDPM: udpm_weekly_reports
        └── Users, roles, audit logs
```

---

## Ingest API surface

| Endpoint | Token scope | Doc |
|----------|-------------|-----|
| `POST /api/ingest/camera` | Per camera | [06](06-ai-ingestion-api.md) |
| `POST /api/ingest/rfid` | Per RFID reader | [12 §5](12-iot-ingestion-and-edge.md#5-post-apiingestrfid) |
| `POST /api/ingest/sensor` | Per sensor device | [12 §6](12-iot-ingestion-and-edge.md#6-post-apiingestsensor) |
| `POST /api/ingest/gas` | Per gas gateway | [12 §7](12-iot-ingestion-and-edge.md#7-post-apiingestgas) |
| `POST /api/ingest/edge/heartbeat` | Per edge device | [12 §8](12-iot-ingestion-and-edge.md#8-post-apiingestedgeheartbeat) |
| `POST /api/ingest/media` | Edge device | [16 §1.5](16-hse-incidents-lsr.md#15-video-evidence) |
| `POST /api/ingest/telematics` | Per telematics device | [17 §5](17-udpm-weekly-report.md#5-vehicle-telematics-vi) |

---

## Detection & product modules

| Module key | Purpose |
|------------|---------|
| `ppe` | Helmets, vests, gloves, **face mask** |
| `vehicle_proximity` | Person vs moving equipment |
| `working_at_height` | Harness, edges, ladders |
| `incident_vision` | Fall / worker down (camera) |
| `rfid_ssms` | Personnel tracking, evacuation |
| `gas_monitoring` | LEL, O₂, H₂S, CO |
| `environmental` | CO₂, weather, air quality |
| `qr_equipment` | Equipment QR registry |
| `hse_incidents` | Incident classification |
| `lsr` | Life Saving Rules log |

---

## Suggested repository layout

| Path | Role |
|------|------|
| `siteguard/` | Laravel + MySQL — dashboard + all ingest + reports |
| `siteguard-python/` | Vision inference workers |
| `siteguard-edge/` | Jetson agent — RFID, Modbus, VPN, camera POST |
| `siteguard-gas-gateway/` | Pi Zero — Bluetooth gas → WiFi |
| `DOCs/SiteGuard-Research/` | This research set |

---

## Glossary

| Term | Meaning |
|------|---------|
| **SCC** | Safety Command Center — on-prem server + ops room |
| **SSMS** | RFID personnel tracking subsystem |
| **UDPM** | Saudi Aramco UDPM-GM-0058 weekly reporting standard |
| **Assurance tier** | `instrumented` (sensors) vs `inferred` (AI) |
| **Anonymous PPE** | Vision violations without worker identity |

Full glossary: [07 — Appendix A](07-data-model-and-apis.md#appendix-a--glossary)
