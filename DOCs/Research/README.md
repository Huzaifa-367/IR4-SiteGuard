# Lixar Product Research — Master Index

**Product:** Lixar (Lixar-POS / Lixar Khata)  
**Market:** Pakistan primary · South Asia secondary  
**Last updated:** May 2026  
**Status:** Living documentation — **full product spec** (no phased MVP / V1 / Phase rollout in these docs)  
**Validated:** May 2026 — section order, cross-links, API/sync params, feature flags

> **Note:** The legacy brainstorm file [`../Reaearch.md`](../Reaearch.md) remains for history. **This folder is the canonical, organized research set.** Do not duplicate edits in both places — update here.

---

## How to use this documentation

| If you are… | Start here |
|-------------|------------|
| **Product / founder** | [01 — Vision & Market](01-vision-and-market.md) → vertical docs `02`–`05` |
| **Designer** | [07 — Experience & UX](07-experience-and-ux.md) + vertical workflows in `02`–`05` |
| **Mobile engineer** | [09 — Technical & Platform](09-technical-and-platform.md) + [11 — Data Model](11-data-model-and-apis.md) |
| **Backend engineer** | [11 — Data Model & APIs](11-data-model-and-apis.md) + [08 — Product Modules](08-product-modules.md) |
| **Platform / super admin** | [12 — Super Admin](12-super-admin-platform.md) + [11 §3.4 / §14.18](11-data-model-and-apis.md#34-platform-super-admin-no-business_id) |
| **Implementing a feature** | Find module in [08](08-product-modules.md) → vertical detail in `02`–`05` → schema in [11](11-data-model-and-apis.md) |

---

## Document map

| # | File | Contents |
|---|------|----------|
| **01** | [vision-and-market.md](01-vision-and-market.md) | Executive summary, four verticals, Business OS layers, market & competition, metrics, positioning |
| **02** | [vertical-agri-inputs.md](02-vertical-agri-inputs.md) | Pesticides, khaad, spray — supply chain, law, seasons, workflows, schema, screens |
| **03** | [vertical-crop-trading.md](03-vertical-crop-trading.md) | Mandi, arthi, commodities, weight slips, lots, rates, season P&L |
| **04** | [vertical-property-plots.md](04-vertical-property-plots.md) | File vs plot, installments, societies, deals, scams, commissions |
| **05** | [vertical-mobile-repair.md](05-vertical-mobile-repair.md) | Repair tickets, PTA/DERBS, IMEI, parts, used phones, trade-in |
| **06** | [personas-and-workspace.md](06-personas-and-workspace.md) | **One business = one vertical**; multi-business users; tenancy & roles |
| **07** | [experience-and-ux.md](07-experience-and-ux.md) | Design principles, dashboard layers, design system, FAB, localization |
| **08** | [product-modules.md](08-product-modules.md) | Modules 1–17: auth, workspace, khata, accounts, …, **super admin** |
| **09** | [technical-and-platform.md](09-technical-and-platform.md) | Flutter/Laravel architecture, **offline-first sync**, light models, server AI assistant |
| **10** | [roadmap-risks-vision.md](10-roadmap-risks-vision.md) | Full product scope, risks, open decisions, north-star vision |
| **11** | [data-model-and-apis.md](11-data-model-and-apis.md) | **Full schema** (70+ tables), fields R/O, relations, **complete REST catalog** |
| **12** | [super-admin-platform.md](12-super-admin-platform.md) | **Lixar platform ops** — tenants, billing, support impersonation, system flags |

**Reading order (core stack):** `01` → `06` → `08` → `09` → `11` → `12` · Vertical deep dives: `02`–`05` when implementing a vertical.

---

## Core business verticals

| P | Vertical | One-line definition |
|---|----------|---------------------|
| **1** | **Agri inputs** | Pesticide, fertilizer (khaad), spray retail — farmer udhaar until harvest |
| **2** | **Crop trading** | Seasonal buy/sell of wheat, cotton, rice — mandi lots & weight slips |
| **3** | **Property & plots** | Society files, installments, token — deal pipeline not SKU stock |
| **4** | **Mobile** | Repair tickets, parts, used/new phones — IMEI & PTA compliance |

**Tenancy:** One user → many **businesses**; each business → **one vertical only**; each business → **multiple partners** (creator + invited; **creator cannot be removed by partners**). Details: [06](06-personas-and-workspace.md).

---

## Repository artifacts

| Path | Role |
|------|------|
| `DOCs/project/Lixar Khata.html` | UI prototype (emerald dark, PKR, Roman Urdu) |
| `DOCs/project/data.jsx` | Sample domain data — **should match vertical 02 catalog** |
| `Mobile/` | Flutter + Riverpod + Hive |
| Laravel + Inertia | Owner web + **Super Admin** (`/admin`) + API |

---

## Glossary (quick)

| Term | Meaning |
|------|---------|
| Khata | Credit/debit ledger with a party |
| Udhaar | Credit sale / unpaid balance |
| Gave / Got | You gave value (they owe) / you received payment |
| Khaad | Fertilizer |
| Maund | Trade weight unit — **configure kg per commodity** |
| Bori / bag | Sale or purchase pack — **50 kg or 25 kg per product**, not global |
| Base unit | Godown stock unit (kg, L, piece) |
| Sale unit | Counter unit — can be loose kg (5, 10) or full bori |
| File | Pre-possession housing society claim — not land title |

Full glossary: [11 — Appendices](11-data-model-and-apis.md#appendix-a--glossary)
