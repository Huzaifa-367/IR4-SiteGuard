# 10 — Risks, Vision & Product Decisions

[← Index](README.md) · [09 Technical](09-technical-and-platform.md) · **Next:** [11 Data Model](11-data-model-and-apis.md)

> **Scope:** This document captures **what Lixar is** (full product), **what we still need to decide**, and **what can go wrong** — not a phased rollout plan. Feature detail lives in [08](08-product-modules.md) and vertical docs `02`–`05`.

---

## 1. Full product scope

### 1.1 Platform & workspace

- **Super Admin** web console (`/admin`): tenants, users, subscriptions, support impersonation, system flags — [12](12-super-admin-platform.md)  
- Phone OTP auth (WhatsApp OTP optional), Google/Apple sign-in  
- Create business → user is **creator + partner**; pick **one vertical** (immutable)  
- **Multi-business** switcher; isolated Hive cache + API per `business_id`  
- Branches, business settings, subscription per business  
- Default **Cash** account seeded; add bank accounts (MCB, HBL, …)  
- **Partners:** invite/accept by phone, team list, remove partner/staff (**creator protected**), audit log, optional PIN on removal  
- **Staff RBAC:** admin, cashier, mandi clerk, inventory clerk, technician, accountant  
- **Offline-first mobile:** all core tenant data on device; background pull/push sync + conflict resolution  
- `audit_log` on mutations; PIN/biometric; session revoke  

### 1.2 Core modules (all verticals)

| Area | Included |
|------|----------|
| **Khata** | Parties, gave/got, timeline, attachments, voice notes, risk tiers, recovery tones, PDF/WhatsApp statement, voice + OCR entry, reminder schedules |
| **Accounts** | Cash + bank accounts (MCB, HBL, …), in/out transaction log, account-to-account transfers; all payments linked to `account_id` |
| **Cashflow** | Daily drawer on cash account, expenses per account, 7/30/90 charts, bank reconciliation |
| **Inventory** | Agri SKU + batch/FEFO; crop lots; plot pipeline; mobile device/parts variants + IMEI |
| **Billing** | Agri invoice, weight slip, installment receipt, repair invoice; Raast QR payment links + webhook reconcile |
| **Payments** | Raast, JazzCash, Easypaisa, manual bank; reconciliation → `got` |
| **Reporting** | Aging, season P&L, lot margin, installment aging, ticket margin, pesticide register; PDF/thermal/CSV; AI narrative on verified data |
| **AI** | Mobile **light models** (STT/OCR/slots); **Laravel** assistant + tool-calling (online); confirm → REST |
| **Notifications** | Push tiers, batched summaries, customer WhatsApp reminders (BSP) |
| **Super Admin** | Platform dashboard, suspend business, feature flags, support sessions, billing overrides |

### 1.3 Agri inputs

- Catalog: khaad, spray, pesticide; base / purchase / sale units (bori 50/25 kg, loose kg)  
- Stock GRN, FEFO, low stock, season banner, company targets  
- Pesticide register export; company catalog sync hooks  
- Integrations: WhatsApp share, company price CSV, bank/GNPL flags, Raast on balance  

### 1.4 Crop trading

- Commodity config, mandi rate board, weight slip, lots, deductions (kat, nasha, bardana)  
- Multi-lot sale, expense lines, season close, arthi commission templates, beopari multi-farmer  

### 1.5 Property & plots

- Society, PlotUnit, Deal, token, installment schedules (templates + manual), payments  
- Compliance checklist + doc vault; commission splits; society portal sync where available  
- WhatsApp installment reminders  

### 1.6 Mobile repair & sale-purchase

- Repair tickets (statuses, advance, invoice), PTA/DERBS IMEI log  
- **PartProduct** + **PartVariant**, compatibility, BOM, stock per variant  
- **DeviceVariant** catalog, used assets, trade-in, serialized new stock  
- Barcode GRN, supplier price lists, technician KPI, variant analytics  

### 1.7 Scale & expansion (same product family, optional modules)

- Multi-branch consolidation, ClickHouse analytics  
- Lending / supplier BNPL via licensed partners  
- Holding-company rollup across businesses  
- Super-app: commerce, logistics, procurement (only where Khata → remind → collect is already in use)

---

## 2. Open product decisions

| # | Question | Current leaning |
|---|----------|-----------------|
| 1 | Business vertical at create | Picker; immutable; new business for new vertical |
| 2 | Multi-business UX | Business switcher + per-`business_id` cache |
| 3 | App packaging | Single APK (all verticals) vs branded APK — cosmetic |
| 4 | Change vertical after create | **No** self-serve; support migration only |
| 5 | Pesticide batch/expiry | **Yes** — FEFO in agri inventory |
| 6 | GST / tax fields | Include configurable fields; counsel for filing claims |
| 7 | Default language | Roman Urdu + English |
| 8 | Pricing | Per-business subscription |
| 9 | Backend host | Laravel (+ Postgres) primary; evaluate Supabase if needed |
| 10 | Open bag tracking (agri) | Optional per product — godown can stay base-kg only |

---

## 3. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Low retention | TTV &lt;3 min; vertical sample data onboarding |
| WhatsApp API cost | Manual share + BSP when volume justifies |
| AI hallucination | Server-side tools only; confirm all writes via REST |
| On-device model size / accuracy | Optional quantized packs; always confirm before save; server path for hard cases |
| Assistant used offline | Block chat when offline; light STT/OCR drafts still allowed |
| Stale offline data | Background pull on launch/foreground/periodic; show `last_pull_at`; bootstrap before first use |
| Sync conflicts | Owner merge UI |
| Fintech regulation | Licensed partners for wallet/custody |
| Partner disputes / wrongful removal | Audit log; PIN on partner removal; creator not removable |
| Support impersonation abuse | Short TTL; `platform_audit_logs`; readonly default role |
| Legal pesticide export | Counsel before marketing compliance features |

---

## 4. Product vision

> **AI-powered operating system for agri dealers, crop traders, plot dealers, and mobile businesses in emerging markets.**

| Pillar | Deliverable |
|--------|-------------|
| Financial intelligence | Farmer udhaar, installments, advances — one view |
| Operational control | Expiry-safe stock, lots, plot pipeline, IMEI |
| Recovery automation | Post-harvest respectful reminders |
| Season prediction | Reorder before Kharif; spray gap alerts |
| Embedded fintech | Raast when farmer has cash |
| AI assistant | Urdu queries on real data |
| Growth | Multi-branch, supplier credit, partner teams |

---

[← Index](README.md) · **Next:** [11 — Data Model & Appendices](11-data-model-and-apis.md)
