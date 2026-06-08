# 01 — Vision & Market

[← Index](README.md) · **Next:** [02 Detection capabilities](02-detection-capabilities.md)

---

## 1. Executive summary

Construction and industrial sites lose billions annually to injuries, downtime, and insurance premiums. Manual safety walks cannot cover every zone 24/7. **SiteGuard AI** is a **Safety Command Center platform**: vision (Python/Jetson), RFID personnel tracking, gas/CO₂/environmental sensors, QR equipment, HSE/LSR workflows, and **UDPM-GM-0058** weekly reporting — unified in **Laravel + Inertia**.

**IR4 positioning:** *On-premise SCC — your site boundary, your data, one control plane. No cloud dependency.*

**Generic positioning:** *On-prem or private-cloud safety intelligence — cameras + IoT + compliance reporting.*

---

## 2. Problem

| Pain | Detail |
|------|--------|
| Sparse supervision | One HSE officer per large site; blind spots at night and weekends |
| Reactive culture | Incidents discovered after harm; CCTV reviewed manually hours later |
| PPE fatigue | Workers comply when watched; violations return immediately after |
| Plant–person interface | Forklifts, dump trucks, and pedestrians share yards without consistent exclusion |
| Height work | Harness and guardrail checks are procedural, not continuously verified |
| Audit pressure | Clients and regulators demand evidence — photos, logs, corrective actions |

---

## 3. Solution

```text
Per SCC site (on-prem Laravel):
  Cameras → Jetson/Python → POST /api/ingest/camera → PPE / fall / height alerts
  RFID readers → POST /api/ingest/rfid → headcount, geofence, evacuation
  Gas (Pi Zero) → POST /api/ingest/gas → LEL / H₂S / O₂ / CO
  Modbus sensors → POST /api/ingest/sensor → CO₂, weather, environmental
  Equipment QR → smartphone scan → /equipment/{slug}
        → Rules + UDPM weekly report + Inertia dashboard
        → AI assistant (optional — off on air-gapped SCC)
```

**What we do not build in the Laravel repo:**

- Python / Jetson / Pi Zero edge agents (separate projects) — [12](12-iot-ingestion-and-edge.md)  
- Consumer mobile app (equipment scan is responsive web)  
- Multi-tenant SaaS signup/billing  
- Autonomous machine interlocks (advisory alerts only)  
- Digital Work Permit integration (manual LSR unless client API added)  

---

## 4. Buyers & personas

| Persona | Goal | Budget holder |
|---------|------|----------------|
| **HSE director** | Reduce TRIFR; prove program to board | Yes |
| **Site manager** | Daily toolbox; stop work authority | Influencer |
| **Project owner (client)** | Contractor compliance in SLA | Influencer |
| **Security / IT** | SSO, data residency, API security | Gatekeeper |

Detail: [03 — Sites, modules & cameras](03-sites-modules-cameras.md) · [10 — Users & RBAC](10-users-roles-permissions.md)

---

## 5. Market & competition

| Competitor type | Examples | Gap SiteGuard fills |
|-----------------|----------|---------------------|
| Generic CV platforms | Intenseye, Protex AI, viAct | Region-agnostic; need clear API-first + height module |
| VMS analytics plugins | BriefCam, Avigilon | Locked to vendor; weak open ingestion |
| PPE-only startups | Various | Rarely combine vehicle + height in one rule fabric |
| Manual + drones | — | Not continuous |

**Wedge:** Simple **POST-only ingest** per camera; unified **alert inbox** across three domains; dynamic sites and roles in one install.

---

## 6. Deployment model (not SaaS)

| Model | Notes |
|-------|-------|
| **Single installation** | One Laravel deploy per operator — all sites in one database |
| **Per-site rollout** | Enable modules and cameras incrementally |
| **Professional services** | Zone calibration, Python worker install, model tuning |

---


## 7. Success metrics

| Metric | Target (illustrative) |
|--------|------------------------|
| Mean time to acknowledge alert | &lt; 15 min on shift |
| False positive rate (operator-marked) | &lt; 20% after 2-week tune |
| Ingestion API availability | 99.9% |
| No ingest POST gap | &lt; 2 min before camera “offline” flag |
| Time to first alert after install | &lt; 48 h |

---

## 8. Regulatory alignment (non-legal)

| Framework | Relevance |
|-----------|-----------|
| **UDPM-GM-0058** (Saudi Aramco) | SCC weekly report §6.5 — [17](17-udpm-weekly-report.md) |
| **SA Governance Instructions** (×6) | On-prem, CCTV, portable devices — [18](18-saudi-aramco-compliance.md) |
| OSHA (US) | PPE 1926.28, fall protection 1926.501, vehicles 1926.601 |
| UK HSE CDM | Principal contractor duty to manage site safety |
| ISO 45001 | OH&S management system evidence |
| GDPR / UK GDPR | Worker images = personal data; RFID identity; retention & DPIA |

Detail: [09 — Risks & compliance](09-risks-compliance-vision.md)

---

[← Index](README.md) · **Next:** [02 — Detection capabilities](02-detection-capabilities.md)
