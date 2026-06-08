# 04 — Vertical Research: Property & Plots

[← Index](README.md) · [03 Crop](03-vertical-crop-trading.md) · **Next:** [05 Mobile](05-vertical-mobile-repair.md)

**Priority:** #3  
**Primary user:** Housing society agent, plot dealer, land broker

*Legal content is product context only — not legal advice.*

---

## Table of contents

1. [Industry overview](#1-industry-overview)
2. [File vs plot vs possession](#2-file-vs-plot-vs-possession)
3. [Land units & plot records](#3-land-units--plot-records)
4. [Payment plans & milestones](#4-payment-plans--milestones)
5. [Stakeholders & commissions](#5-stakeholders--commissions)
6. [Deal lifecycle](#6-deal-lifecycle)
7. [Fraud & risk patterns](#7-fraud--risk-patterns)
8. [Operational workflows](#8-operational-workflows)
9. [Screens & UX](#9-screens--ux)
10. [Data model](#10-data-model)
11. [Product scope](#11-product-scope)

---

## 1. Industry overview

Pakistan property retail revolves around **housing schemes** (societies) selling **files** (future allotment claims) and eventually **plots** (numbered land after balloting/possession). Agents earn **commission** on booking and installments collected over **years**.

### 1.1 Agent types

| Type | Focus |
|------|-------|
| **Society authorized agent** | One or more schemes |
| **Independent broker** | Multiple societies |
| **Land broker (agricultural)** | Kanal/acre — different doc set |
| **Investor flipper** | Buy file low, sell high |

### 1.2 What is NOT inventory

Plots/files are **pipeline units**, not qty stock. You do not "sell 3 plots from shelf" like urea bags — you **transition status** on a unique `PlotUnit`.

---

## 2. File vs plot vs possession

| Stage | Customer holds | Legal strength | Lixar `plot_unit.status` |
|-------|----------------|----------------|--------------------------|
| Application / file | Promise of future plot | Weak — contractual claim | `file_booked` |
| Balloting | Plot number assigned | Medium | `allotted` |
| Installments ongoing | Paying society | Medium | `installment_active` |
| Possession | Physical plot visit | Stronger | `possession` |
| Registry | Title transfer recorded | Strongest (verify) | `registered` |

**Critical:** File ≠ ownership. Transfer of Property Act 1882 + Registration Act 1908 govern real title. Courts may treat file holder as **creditor of developer** until proper registration.

### 2.1 Customer language map

| Customer says | Meaning | Action in app |
|---------------|---------|---------------|
| "File le li" | Bought pre-allotment | Create file unit + deal |
| "Plot number aa gaya" | Balloted | → `allotted` |
| "Possession mil gayi" | Can build | → `possession` |
| "Registry ho gayi" | Title | → `registered` + doc scan |

---

## 3. Land units & plot records

### 3.1 Units

| Unit | Typical conversion |
|------|-------------------|
| 1 Marla | 225 sq ft (society-specific) |
| 1 Kanal | 20 Marla |
| 1 Acre | 8 Kanal |

### 3.2 PlotUnit fields

| Field | Example |
|-------|---------|
| `society_id` | Gulberg Greens, Citi Housing |
| `block` | A, B, Executive |
| `plot_no` | 127 |
| `size_marla` | 5, 10, 20 |
| `facing` | park, corner, boulevard |
| `unit_type` | `file` \| `plot` |
| `total_price` | PKR |
| `status` | available \| booked \| … |

---

## 4. Payment plans & milestones

### 4.1 Typical components (housing societies)

| Component | Indicative range |
|-----------|------------------|
| Booking / token | PKR 50k – 500k+ |
| Down payment | 10–20% |
| Monthly installments | **36–48 months** common |
| Quarterly option | Some societies (e.g. 2/4/6 quarter plans) |
| Balloting fee | Separate milestone |
| Possession charges | Lump before handover |
| Development / utility | Surprise costs — schedule lines |

**Marketing examples (2024–25, UI placeholders only):**

- 3 Marla: ~Rs 8,500/month in some societies  
- 1 Kanal: ~Rs 55,000/month in some societies  

### 4.2 Schedule builder templates

| Template | Structure |
|----------|-----------|
| Standard 36M | Token + down + 36 monthly |
| Quarterly 12Q | Token + 12 quarterly |
| Balloon | Low monthly + large final |

Partial payments allocate to **oldest due installment** first (configurable).

---

## 5. Stakeholders & commissions

```text
Developer / Society
    ↔ Agent (Lixar user) ↔ Sub-agent
            ↓
        Buyer (installments)
            ↓
    Previous file holder (resale)
```

### 5.1 Commission tracking

| Model | Lixar |
|-------|-------|
| % of plot price | `deal.commission_percent` |
| Fixed per marla | `commission_per_marla` |
| Staged (booking / balloting / possession) | `CommissionMilestone` records |

---

## 6. Deal lifecycle

```text
available → token_paid → installment_active → [possession] → registered
                ↘ cancelled / transferred
```

### 6.1 New booking

1. Select `PlotUnit` (must be `available`)  
2. Create `Deal` + buyer party  
3. Record token → `token_paid`  
4. Generate `InstallmentSchedule`  
5. Attach booking form scan  

### 6.2 Collection

1. Dashboard: installments due this week  
2. Record payment → allocate to installment #N  
3. WhatsApp receipt  
4. Late fee optional  

### 6.3 Resale / transfer

1. Close or transfer old buyer balance  
2. New `Deal` on same unit — **never delete** old deal  
3. Full audit trail  

---

## 7. Fraud & risk patterns

| Scam | Mitigation in Lixar |
|------|---------------------|
| Double sale of file | `booked` blocks second deal without owner override |
| Fake society | Compliance checklist + doc vault |
| Endless "balloting next month" | Milestone dates + overdue alerts |
| Cash without receipt | Require receipt record or owner PIN "informal" |
| Same plot two agents | Society + plot_no unique constraint |

### 7.1 Agent compliance checklist

- [ ] Society SECP / cooperative registration verified  
- [ ] NOC authority (LDA / CDA / RDA) attachment  
- [ ] Site visit date noted  
- [ ] Buyer CNIC copy stored  

---

## 8. Operational workflows

### 8.1 Daily agent routine

1. Open **Installments due**  
2. Call/WhatsApp top 5 overdue  
3. Record payments received  
4. Update plot pipeline board  
5. Review new inquiries → assign `PlotUnit`  

---

## 9. Screens & UX

| Screen | Purpose |
|--------|---------|
| Property Home | Due installments, pipeline counts |
| Plot registry | Grid: block → plots by status color |
| Deal detail | Schedule, payments, docs, commission |
| Record payment | Allocate to installment |
| Society list | Per-society totals |
| Buyer khata | Ledger + linked deals |

**FAB:** Record payment  
**Voice:** *"Block A plot 12 token 50 hazar mila"*

---

## 10. Data model

`Society`, `PlotUnit`, `Deal`, `InstallmentSchedule`, `InstallmentRow`, `InstallmentPayment`, `BrokerCommission`, `Document`, `ComplianceChecklist`

### Deal snapshot

```yaml
deal:
  id: DEAL-2026-0089
  plot_unit_id: ...
  buyer_party_id: ...
  total_price: 4500000
  token_amount: 200000
  schedule_template: standard_36m
  status: installment_active
  agent_commission_expected: 135000
  agent_commission_received: 50000
```

---

## 11. Product scope

- `Society`, **PlotUnit** registry, pipeline board (available → booked → sold)  
- **Deal**, token, installment schedules (templates + manual rows)  
- Record payments, installment aging, buyer khata  
- Schedule templates, WhatsApp reminders, document vault  
- Agent **compliance checklist**, commission splits  
- Society portal sync where APIs exist  

---

[← Index](README.md) · **Next:** [05 — Mobile Repair](05-vertical-mobile-repair.md)
