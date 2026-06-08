# SiteGuard AI — Product Research (Master Index)

**Working title:** SiteGuard AI  
**Deployment:** **Single project** — one Laravel installation, many **sites** (not multi-tenant SaaS)  
**Stack:** **Laravel** (dashboard + **MySQL** + ingestion API + **AI assistant** via [`laravel/ai`](https://laravel.com/docs/ai-sdk)) · **Python** (vision inference — **separate codebase**, not documented here)  
**Last updated:** May 2026  
**Status:** Living documentation — **full product spec** (no phased rollout / version tranches in these docs)

> **Separate from [Lixar POS research](../Research/README.md).** Python posts to **`POST /api/ingest/camera` only** (one token per camera, minimal payload + snapshot). The **AI assistant** follows the same **Laravel-only tool-calling** pattern as Lixar — see [11 — AI Assistant](11-ai-assistant.md).

---

## Product in one paragraph

SiteGuard is a **single-deployment** safety platform: **Python** runs vision per camera and **POSTs** `camera_id` + `payload` to **Laravel** (`/api/ingest/camera`, one token per camera). Operators **dynamically** add sites, locations, enabled modules, and cameras (dashboard or integration API). **Roles are dynamic** except one fixed **`super_admin`** with full access. HSE staff use a **Laravel + Inertia dashboard** for alerts, zones, investigations, compliance reports, and an **AI assistant** — with **no mobile app**.

---

## How to use this documentation

| If you are… | Start here |
|-------------|------------|
| **Product / founder** | [01 — Vision & Market](01-vision-and-market.md) |
| **HSE / safety lead** | [02 — Detection capabilities](02-detection-capabilities.md) |
| **Laravel / full-stack** | [05 — Technical architecture](05-technical-architecture.md) + [10 — Users & RBAC](10-users-roles-permissions.md) |
| **AI / assistant** | [11 — AI Assistant](11-ai-assistant.md) |
| **Python integrator** | [03 — Sites & cameras](03-sites-modules-cameras.md) §7 then [06 — AI ingestion API](06-ai-ingestion-api.md) |
| **DB & API design** | [07 — Data model & APIs](07-data-model-and-apis.md) |
| **Dashboard UI** | [04 — Web dashboard UX](04-web-dashboard-ux.md) |

**Reading order:** `01` → `03` → `10` → `05` → `07` → `06` → `11` → `04` → `08` → `09`

---

## Document map

| # | File | Contents |
|---|------|----------|
| **01** | [vision-and-market.md](01-vision-and-market.md) | Problem, single-project scope, metrics |
| **02** | [detection-capabilities.md](02-detection-capabilities.md) | PPE, vehicle, height — rules & severities |
| **03** | [sites-modules-cameras.md](03-sites-modules-cameras.md) | **Dynamic** sites, locations, modules, cameras + integration API |
| **04** | [web-dashboard-ux.md](04-web-dashboard-ux.md) | **Informational dashboards**, KPIs, site/module hubs, alert inbox |
| **05** | [technical-architecture.md](05-technical-architecture.md) | Laravel monolith; Python external |
| **06** | [ai-ingestion-api.md](06-ai-ingestion-api.md) | **Single POST** `/api/ingest/camera` — token + `camera_id` + `payload` |
| **07** | [data-model-and-apis.md](07-data-model-and-apis.md) | Eloquent schema, routes, policies |
| **08** | [product-modules.md](08-product-modules.md) | **Detailed** product modules 1–14 (capabilities, flows, widgets) |
| **09** | [risks-compliance-vision.md](09-risks-compliance-vision.md) | Privacy, liability, vision |
| **10** | [users-roles-permissions.md](10-users-roles-permissions.md) | **Dynamic roles** + fixed `super_admin` |
| **11** | [ai-assistant.md](11-ai-assistant.md) | **Laravel tool-calling**, chat, command bar |

---

## Core structure (data model)

```text
SiteGuard installation (one database)
  └── Site A, Site B, …
        └── site_locations (optional tree)
        └── Detection module: PPE | Vehicle | Height (enabled per site)
              └── Camera 1, Camera 2, …
                    ├── ingest_api_token (1:1)
                    ├── zones, rules → alerts
                    └── Python → POST /api/ingest/camera
        └── Users (super_admin fixed + dynamic roles + site_user)
        └── AI assistant (per site, per user)
```

---

## Detection modules (vision)

| Module key | Purpose |
|------------|---------|
| `ppe` | Helmets, vests, gloves, etc. |
| `vehicle_proximity` | Person vs moving equipment |
| `working_at_height` | Harness, edges, ladders, scaffolding |

---

## System surfaces

| Surface | Stack | Users |
|---------|--------|-------|
| **Web dashboard** | Laravel + Inertia | HSE, supervisors, admins |
| **AI assistant** | Laravel AI SDK (`laravel/ai`) — `SiteSafetyAgent` + tools | Same users — `ai.assistant.use` |
| **Ingestion API** | `POST /api/ingest/camera` only | One token per camera |
| **Python vision** | Separate repo | Out of scope here |
| **Mobile app** | — | **Not in product** |

---

## Suggested repository layout

| Path | Role |
|------|------|
| `siteguard/` | Laravel + MySQL — dashboard + ingest + `laravel/ai` + jobs |
| `siteguard-python/` | Vision inference workers |
| `DOCs/SiteGuard-Research/` | This research set |

---

## Glossary

| Term | Meaning |
|------|---------|
| **Site** | One construction / industrial location |
| **Detection module** | PPE, vehicle proximity, or working at height |
| **Camera** | One RTSP stream for one module at one site; one ingest token |
| **Ingest payload** | `event_id`, `captured_at`, `snapshot`, `detections[]` |
| **Alert** | Rule-triggered safety item |
| **AI assistant** | Laravel-hosted chat with tool-calling on safety data |

Full glossary: [07 — Appendix A](07-data-model-and-apis.md#appendix-a--glossary)
