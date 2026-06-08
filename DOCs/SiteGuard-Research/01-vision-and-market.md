# 01 — Vision & Market

[← Index](README.md) · **Next:** [02 Detection capabilities](02-detection-capabilities.md)

---

## 1. Executive summary

Construction and industrial sites lose billions annually to injuries, downtime, and insurance premiums. Manual safety walks cannot cover every zone 24/7. **SiteGuard AI** is a **single-project** system (one operator, many sites): **Python** runs vision per camera and **POSTs** minimal payloads (detections + snapshot) to **Laravel**; HSE teams manage sites, cameras, and alerts through a **Laravel + Inertia web dashboard**.

**Positioning:** *On-prem or private-cloud safety intelligence — your cameras, your models, one control plane.*

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
Per site:
  Cameras (multiple angles per detection module)
    → Python inference (separate repo — typically one worker per camera)
        → POST /api/ingest/camera  (token + camera_id + snapshot + detections)
            → Rules → Alerts
                → Inertia dashboard (Laravel)
                → AI assistant (Laravel AI SDK — `laravel/ai` agent + tools)
```

**What we do not build in the Laravel repo:**

- Python training / inference code (separate project)  
- Consumer mobile app for workers  
- Multi-tenant SaaS signup/billing  
- Autonomous machine interlocks (advisory alerts only)  

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
| OSHA (US) | PPE 1926.28, fall protection 1926.501, vehicles 1926.601 |
| UK HSE CDM | Principal contractor duty to manage site safety |
| ISO 45001 | OH&S management system evidence |
| GDPR / UK GDPR | Worker images = personal data; retention & DPIA |

Detail: [09 — Risks & compliance](09-risks-compliance-vision.md)

---

[← Index](README.md) · **Next:** [02 — Detection capabilities](02-detection-capabilities.md)
