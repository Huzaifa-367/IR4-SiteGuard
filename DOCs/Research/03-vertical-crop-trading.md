# 03 — Vertical Research: Seasonal Crop Trading (Mandi)

[← Index](README.md) · [02 Agri](02-vertical-agri-inputs.md) · **Next:** [04 Property](04-vertical-property-plots.md)

**Priority:** #2  
**Primary user:** Crop buyer, arthi (commission agent), beopari, broker

---

## Table of contents

1. [Industry overview](#1-industry-overview)
2. [Mandi ecosystem](#2-mandi-ecosystem)
3. [Commodities & units](#3-commodities--units)
4. [Weight slip & deductions](#4-weight-slip--deductions)
5. [Pricing & rate discovery](#5-pricing--rate-discovery)
6. [Money flow & who owes whom](#6-money-flow--who-owes-whom)
7. [Season rhythm](#7-season-rhythm)
8. [Operational workflows](#8-operational-workflows)
9. [Pain points → features](#9-pain-points--features)
10. [Screens & UX](#10-screens--ux)
11. [Data model](#11-data-model)
12. [Product scope](#12-product-scope)
13. [Sample transactions](#13-sample-transactions)

---

## 1. Industry overview

Crop trading in Pakistan is **not retail POS**. Value moves in **lots** (wagon, cart, trailer) with **negotiated daily rates**, **weight deductions**, and **commission** to arthi/middlemen.

### 1.1 User archetypes

| Archetype | Description | Lixar mode |
|-----------|-------------|------------|
| **Pakka arthi** | Registered, 10–30 yrs mandi presence; godown + scale | Full lot + commission |
| **Independent buyer** | Purchases direct from farmer | Lot purchase + mill sale |
| **Beopari** | Village aggregator; brings combined loads | Multi-farmer lot optional |
| **Broker** | Links farmer to mill; fee only | Commission lines |
| **Miller liaison** | Represents flour/ginning off-taker | Mill party receivable |

### 1.2 Key commodities

| Commodity | Harvest / flow | Price unit (typical) |
|-----------|----------------|----------------------|
| **Wheat** | Rabi; Apr–Jun procurement | Rs per 40 kg or per maund |
| **Cotton (phutti)** | Kharif picking Aug–Nov | Rs per 40 kg; lint separate |
| **Cotton lint** | Post-ginning | Rs per maund |
| **Rice (paddy)** | Kharif/Rabi by variety | Rs per 40 kg; variety critical |
| **Maize** | — | Feed mills; ton or 40kg |
| **Vegetables** | Daily | Rs/kg; perishable |

**2024 cotton reference (Punjab reports, volatile):**

- Seed cotton (phutti): roughly **Rs 7,200 – 8,100 / 40 kg**
- Lint: roughly **Rs 17,200 – 18,500 / maund**
- Prices swing with global textile demand, FX, local production (PCGA reports have cited large production swings)

---

## 2. Mandi ecosystem

```text
Farmer (cart / trailer)
    → [Beopari optional]
        → Arthi OR direct buyer
            → Miller / rice exporter / ginning factory
                → Industry
```

### 2.1 Arthi role

- Provides **weighing**, **godown storage**, **buyer access**
- Often advances cash (**bheja**) to farmer — recovers from final sale
- Earns **commission** (% of sale or per bag)
- Supply chain may include **kacha arthi** under **pakka arthi**

### 2.2 Party role tags

`farmer | beopari | arthi | mill | broker | transporter | labour`

---

## 3. Commodities & units

### 3.1 Critical rule

**Never hard-code maund = 40 kg globally.**

| Setting | Purpose |
|---------|---------|
| `commodity.default_kg_per_maund` | Business-level |
| `commodity.default_kg_per_bag` | Often 40 kg wheat bag |
| `commodity.bardana_tare_kg` | Per bag deduction |

### 3.2 Unit conversion table (marketing vs trade)

| Term | Common meaning | Lixar |
|------|--------------|-------|
| Maund | Traditionally ~40 kg in grain mandis (disputed 37.5 in some contexts) | Configurable |
| Bag / bardana | Often 40 kg wheat | Per commodity |
| Ton | 1000 kg | Maize exports |
| Kanal / acre | Land — **not** crop qty | Property vertical only |

---

## 4. Weight slip & deductions

### 4.1 Slip fields (digitize all)

| Field | Local term | Formula role |
|-------|------------|--------------|
| Gross weight | Total | Start |
| Bag count | Bardana | `bags × tare` |
| Bag tare | Per bag kg | Subtract |
| Moisture % | Nasha | If &gt; threshold → deduct kg or % |
| Grade | 1 / 2 / fair | Rate multiplier |
| **Kat** | Arbitrary cut | Transparent line — never hidden |
| Net weight | Payable qty | After deductions |
| Rate | Rs/maund or Rs/40kg | × net |
| **Net amount** | Payable | Cash or payable to farmer |

### 4.2 Dispute pattern (document for transparency)

Press reports in regional mandis describe arthi requiring **extra bags per 100** for alleged weight loss during storage (e.g. 3 bags per 100 ≈ significant cost per farmer). Lixar stores each deduction as a **visible line** with optional rule template:

```text
rule: moisture_deduction
  if moisture > 14% then deduct (moisture - 14) * 0.5 kg per bag
```

### 4.3 Photo evidence

Every intake: **attach scale slip photo** — stored on `WeightSlip.attachment_id`.

---

## 5. Pricing & rate discovery

### 5.1 Rate sources today

- Shouting market / buyer bids
- WhatsApp broadcast groups
- Reference sites (e.g. grain market summaries, zarai mandi blogs) — **manual entry in Lixar**, not scrape without license

### 5.2 Lixar rate board

| Feature | Behavior |
|---------|----------|
| Daily rate entry | Owner sets wheat/cotton/etc. per unit |
| Timestamp | Every deal links `rate_id` or snapshot rate |
| History chart | 30-day line per commodity |
| Staff view | Read-only rates on intake screen |

**Rule:** Changing today's rate **does not** alter closed lots.

---

## 6. Money flow & who owes whom

### 6.1 Purchase from farmer (you buy)

- You **owe** farmer → **Payable** (Hamain dena hai)
- Cash paid → reduces payable
- Udhaar to farmer → increases payable

### 6.2 Sale to mill

- Mill **owes** you → **Receivable** (Hamain lena hai)
- Mill pays late → aging report

### 6.3 UX labels (Roman Urdu)

| Screen | Label |
|--------|-------|
| Payables list | **Hamain dena hai** |
| Receivables list | **Hamain lena hai** |
| Net | **Aaj ka farq** |

Do **not** use generic shopkeeper "You'll receive" without context on crop screens.

---

## 7. Season rhythm

| Crop | Procurement window | Cash intensity |
|------|-------------------|----------------|
| Wheat | Apr–Jun | High cash out; mill pays 7–30 days |
| Cotton | Aug–Nov picking | Volatile; ginning settlement delays |
| Rice | Oct–Dec (region) | Moisture disputes |

### 7.1 Season close ritual

1. Mark `Season` closed  
2. Lock commodity rates for editing  
3. Report: bought qty, sold qty, margin, open payables/receivables  
4. Archive lots  

---

## 8. Operational workflows

### 8.1 Intake (purchase from farmer)

```text
New Lot → Farmer party → Enter slip fields → Photo
→ Net amount calculated → Payment: cash | partial | payable
→ Lot status: open
```

### 8.2 Sale to mill

```text
Select open lot(s) → Mill party → Sale price → Expenses (commission, transport)
→ Invoice → Receivable until paid
```

### 8.3 Margin

```text
margin = sale_amount - purchase_amount - expenses - shrinkage
```

Per lot and per season aggregate.

---

## 9. Pain points → features

| Pain | Feature |
|------|---------|
| Moisture fight | Line-item deductions + photo |
| Lost lot traceability | Lot ID on every sale |
| Mill late payment | Mill aging |
| Rate chaos | Rate board + locked historical deals |
| Nested arthi | Sub-accounts or party hierarchy |
| Cash drawer mismatch | Daily close like agri |

---

## 10. Screens & UX

| Screen | Content |
|--------|---------|
| Mandi Home | Today's rates, open lots, payables/receivables |
| New weight slip | Full deduction form + photo |
| Lot list | Status open/sold/partial |
| Lot detail | Purchase slip + linked sales |
| Rate board | Edit today / history |
| Season summary | P&L by commodity |
| Party (farmer/mill) | Khata + linked lots |

**FAB:** New weight slip  
**Voice:** *"Ali ne 40 maund gehun becha rate 9500"*

---

## 11. Data model

### 11.1 Entities

`Commodity`, `CommodityRate`, `Season`, `Lot`, `WeightSlip`, `DeductionLine`, `LotSale`, `LotExpense`, `MandiInvoice`

### 11.2 Lot

```yaml
lot:
  id: LOT-2026-0142
  season_id: wheat-2026
  farmer_party_id: uuid
  commodity_id: wheat
  gross_kg: 3200
  deductions: [{ type: moisture, amount_kg: 40 }, { type: kat, amount_rs: 500 }]
  net_kg: 3100
  rate_per_unit: 9500
  rate_unit: per_maund
  purchase_amount: 737375
  status: open | partial_sold | closed
  slip_photo_url: ...
```

---

## 12. Product scope

- Commodity config (maund kg per crop), mandi **rate board**  
- **Weight slip** intake with deductions (kat, nasha, bardana)  
- **Lot** lifecycle: open → partial_sold → closed; margin per lot  
- Multi-lot sale, expense lines, **season close** P&L  
- Arthi commission templates, beopari multi-farmer lots  
- Party khata, cashflow, offline sync (shared platform kernel)  

---

## 13. Sample transactions

| # | Event | Effect |
|---|-------|--------|
| 1 | Buy 200 maund wheat from Ali @ 9500 | Lot open, payable Ali |
| 2 | Pay Ali 500k cash | Payable reduced |
| 3 | Sell lot to mill @ 10200 | Sale linked, receivable mill |
| 4 | Mill pays 1.2M | Receivable cleared |
| 5 | Deduct 3 bags weight loss rule | Deduction line on new intake |

---

[← Index](README.md) · **Next:** [04 — Property & Plots](04-vertical-property-plots.md)
