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
| Ingest API | **POST only** — `/api/ingest/camera`; minimal payload + snapshot — [06](06-ai-ingestion-api.md) |
| Python deployment | **One worker per camera** recommended |
| Sites / cameras | **Dynamic** in dashboard + integration API — [03](03-sites-modules-cameras.md) |
| Roles | **Fixed** `super_admin` + **dynamic** roles — [10](10-users-roles-permissions.md) |
| Dashboard | Laravel + Inertia + Vue |
| Live video in dashboard | Snapshots from ingest; optional HLS later |
| Rule engine | JSON DSL in `rules.definition` |
| Facial recognition / worker identity | **Not in product** |
| AI assistant | Laravel tool-calling only; internet required |
| Mobile app | **Not in product** |

---

## 6. Compliance mapping (informative)

| Requirement area | SiteGuard feature |
|------------------|-------------------|
| PPE program evidence | PPE alerts + snapshot exports |
| Pedestrian–plant separation | Vehicle proximity zones |
| Fall protection program | Height rules + investigations |
| Incident investigation | Investigation module + media |
| Management review | AI assistant + compliance exports |

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
