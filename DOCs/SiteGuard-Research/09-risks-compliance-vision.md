# 09 — Risks, Compliance & Vision

[← Index](README.md)

---

## 1. North-star vision

> **Every high-risk moment on site is seen, logged, and actionable — without replacing human judgment.**

SiteGuard is **decision support**, not autonomous enforcement. HSE teams stay in control; vision models scale coverage; the **AI assistant** ([11](11-ai-assistant.md)) scales analysis of alerts and trends on real data.

---

## 2. Privacy & data protection

| Topic | Policy direction |
|-------|------------------|
| **Lawful basis** | Legitimate interest / contract with site operator — DPIA required |
| **Worker images** | Personal data; snapshots in ingest payload; minimize retention |
| **Signage** | Site operator must post CCTV + AI analytics notice |
| **Retention** | Default 90 days snapshots; configurable; legal hold flag |
| **Right to erasure** | Delete by event / camera request where jurisdiction requires |
| **Cross-border** | Single-installation — operator controls hosting region |

---

## 3. Safety & liability

| Risk | Mitigation |
|------|------------|
| False sense of security | Terms: system is adjunct to HSE program |
| Missed detection | Never claim 100%; show model version + confidence on alerts |
| Alert fatigue | Cooldowns, dwell, FP feedback loop |
| Wrongful disciplinary use | Customer policy: investigate before discipline; audit log |

---

## 4. Technical risks

| Risk | Mitigation |
|------|------------|
| Ingest flood | Rate limits per camera token; max detections per POST |
| Camera offline | No ingest POST within threshold → offline flag + notification |
| Large snapshots | Max body size; JPEG preferred |
| Model drift | Version on camera/site settings; per-site threshold tune |
| RTSP instability | Python reconnect; camera stays offline until POST resumes |
| Clock skew | Server `received_at` authoritative for SLA |
| AI hallucination | Tool-calling on server only; citations; confirm before writes ([11](11-ai-assistant.md)) |

---

## 5. Product boundaries (fixed)

| Topic | Decision |
|-------|----------|
| Vision ingest | `POST /api/ingest/camera` — [06](06-ai-ingestion-api.md) |
| IoT ingest | `POST /api/ingest/rfid`, `/sensor`, `/gas`, `/edge/heartbeat` — [12](12-iot-ingestion-and-edge.md) |
| Edge deployment | Jetson per vehicle + Pi Zero gas gateway; Python per camera stream |
| Sites / cameras | **Dynamic** in dashboard — [03](03-sites-modules-cameras.md) |
| Roles | **Fixed** `super_admin` + **dynamic** roles — [10](10-users-roles-permissions.md) |
| Dashboard | Laravel + Inertia + React |
| Live video in dashboard | Snapshots from ingest; SCC 55" live view — optional HLS later |
| Rule engine | JSON DSL in `rules.definition` + RFID rule service |
| **Facial recognition** | **Not in product** |
| **Worker identity** | **RFID only** — never auto-link vision snapshots to workers — [13](13-rfid-ssms.md) |
| **Anonymous PPE** | Violation logs without worker name — IR4 requirement |
| AI assistant | Optional; **disabled by default** on air-gapped SCC — [18](18-saudi-aramco-compliance.md) |
| Mobile app | **Not in product** — equipment QR uses responsive web **E01** |
| Data residency | **On-premise only** for IR4 — [18](18-saudi-aramco-compliance.md) |

---

## 6. Compliance mapping

### 6.1 Generic (OSHA / ISO 45001)

| Requirement area | SiteGuard feature |
|------------------|-------------------|
| PPE program evidence | PPE alerts + anonymous snapshot exports |
| Pedestrian–plant separation | Vehicle proximity zones |
| Fall protection program | Height rules + HSE incidents |
| Incident investigation | Investigations + `hse_incidents` |
| Management review | UDPM reports + optional AI assistant |

### 6.2 Saudi Aramco / UDPM (IR4)

| Requirement | SiteGuard feature |
|-------------|-------------------|
| UDPM-GM-0058 §6.5 | Module 21 — [17](17-udpm-weekly-report.md) |
| SSMS / RFID | Module 15 — [13](13-rfid-ssms.md) |
| Gas / CO₂ | Modules 16–17 — [14](14-gas-co2-environmental.md) |
| Six applicable GIs | [18 — SA compliance](18-saudi-aramco-compliance.md) |
| Portable device register | `worker_records.portable_devices` |
| LSR | Module 20 — [16](16-hse-incidents-lsr.md) |

### 6.3 Assurance tiers

| Tier | Sources | Use in reports |
|------|---------|----------------|
| **≥90% instrumented** | Gas, CO₂, Modbus env, gate RFID | UDPM automated sections |
| **70–89%** | Zone RFID position, distributed headcount | Display with disclaimer |
| **Inferred** | Vision PPE, fall, harness | Decision support; human ack |

---

## 7. Vision pillars

| Pillar | Deliverable |
|--------|-------------|
| Continuous vision | PPE, vehicle, height on commissioned cameras |
| Simple ingest | One POST per camera — token + snapshot + detections |
| Actionable alerts | Rules, inbox, investigations |
| Evidence | Required snapshot on every ingest event |
| Intelligence | AI assistant on real site data — server-side tools only |

---

[← Index](README.md)
