# 02 — Vertical Research: Agri Inputs (Pesticides, Khaad, Spray)

[← Index](README.md) · [01 Vision](01-vision-and-market.md) · **Next:** [03 Crop Trading](03-vertical-crop-trading.md)

**Priority:** #1  
**Primary user:** Pesticide & fertilizer retail dealer / sub-dealer  
*Regulatory notes are product implications only — validate with legal counsel before compliance releases.*

---

## Table of contents

1. [Industry overview](#1-industry-overview)
2. [Supply chain & money flow](#2-supply-chain--money-flow)
3. [Regulatory environment](#3-regulatory-environment)
4. [Product catalog taxonomy](#4-product-catalog-taxonomy)
5. [Seasonality & crop calendar](#5-seasonality--crop-calendar)
6. [Units, pricing & margins](#6-units-pricing--margins)
7. [Day-to-day operations](#7-day-to-day-operations)
8. [Stakeholders & party model](#8-stakeholders--party-model)
9. [Pain points → product features](#9-pain-points--product-features)
10. [Screens & UX inventory](#10-screens--ux-inventory)
11. [Data model & API](#11-data-model--api)
12. [Integrations & ecosystem](#12-integrations--ecosystem)
13. [Product scope](#13-product-scope)
14. [Sample transactions](#14-sample-transactions)

---

## 1. Industry overview

### 1.1 Shop types

| Type | Location | Scale | Lixar fit |
|------|----------|-------|-----------|
| **Highway / mandi-edge dealer** | Near grain mandi or town bypass | Medium stock, high footfall | Full POS + khata + season |
| **Village agri store** | Rural market | Small range, heavy udhaar | Khata + voice + simple stock |
| **Sub-dealer** | Supplies 3–10 village shops | Wholesale + delivery | Multi-party company payables |
| **Company-owned outlet** | Branded | Strict company reporting | Target tracking, batch |

### 1.2 What moves across the counter

| Category | Local name | Examples | Margin profile |
|----------|------------|----------|----------------|
| Fertilizer | Khaad | Urea, DAP, NP, SOP, MOP | Thin, volume-driven, govt-influenced price |
| Herbicide | Weedicide / spray | Wheat burndown, cotton weeds | Wider % on small packs |
| Insecticide | Keetnash / spray | Bollworm, whitefly, jassid | Seasonal spike cotton/rice |
| Fungicide | — | Seed treat, foliar | Rabi seed season |
| Seed | Beej | Cotton, wheat, hybrid corn | Bundled with crop protection |
| Equipment | — | Sprayer 12L/16L, mask, gloves | One-time, lower expiry risk |
| Micronutrients | — | Zinc, boron mixes | Niche, higher margin |

### 1.3 Major industry players (Pakistan — reference)

**Manufacturers / brands (dealers stock):** Engro Fertilizers, Fauji Fertilizer, Sarsabz, Fatima Group, FFBL; crop protection via Syngenta, FMC, Bayer crop science channels, local distributors (e.g. ALTIGA-style networks, SYAC Zarai Markaz retail chains).

**Finance programs (integration opportunities):**

- Bank agri finance (e.g. Al Baraka Khalyan-style crop input financing)
- **FasalPay** GNPL (grow now pay later) for inputs

---

## 2. Supply chain & money flow

```
[Manufacturer]
      ↓ invoice + targets
[Distributor / regional depot]
      ↓ 15–45 day credit common
[Dealer shop]  ← LIXAR PRIMARY USER
      ↓ cash | Easypaisa | udhaar (until harvest)
[Farmer] (+ optional farmer committee)
```

### 2.1 Revenue streams (dealer)

| Stream | Description | Lixar tracking |
|--------|-------------|----------------|
| Product margin | Dealer price vs counter rate | Lock `cost_at_sale` on line item |
| Volume incentives | Company slabs, free goods | `CompanyTarget` actual vs goal |
| Services | Delivery, sprayer rental | Service line or expense |
| Implicit finance | Farmer 0% udhaar until harvest | Aging + `expected_recovery_season` |

### 2.2 Working capital trap

**Classic squeeze:** Company payment due **before** farmer pays after harvest.

**Dashboard metric (killer):** `farmer_receivable_total − company_payable_total = working_capital_gap`

---

## 3. Regulatory environment

### 3.1 Agricultural Pesticides Ordinance, 1971 (+ Rules 1973)

| Requirement | Detail | Lixar feature |
|-------------|--------|---------------|
| Dealer license | Form 12 application, Form 13 license, ~**3 years** validity, renewal Form 14 | `business.pesticide_license_no`, `license_expires_at`, reminder |
| No sale without license | Illegal to store/sell pesticides unlicensed | Onboarding toggle enables batch/register |
| **Written ledger** | Record **all pesticide sales** + **buyer names** | **Pesticide Register PDF/CSV** from `ledger_entries` where `is_pesticide_sale=true` |
| Training | Safe handling training by approved bodies | Cert attachment + renewal reminder |
| Cancellation risk | Adulteration, malpractice | Audit trail immutable |

**Fertilizer:** Less stringently “named buyer per bag” in enforcement practice, but unified stock + khata still valuable.

**Do not build:** Prescription / agronomic recommendation engine replacing licensed agronomist — only **label reference** (crop, dose per acre as printed on pack).

---

## 4. Product catalog taxonomy

### 4.1 Categories

```text
Fertilizer
  ├── Nitrogen (Urea)
  ├── Phosphatic (DAP)
  ├── NP / NPK blends
  └── Micronutrients

Crop Protection
  ├── Herbicide
  ├── Insecticide
  ├── Fungicide
  └── Seed treatment / adjuvant

Equipment & PPE
  ├── Sprayer
  └── Mask / gloves

Seed (optional module)
```

### 4.2 Product record (full field list)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | uuid | yes | |
| `name_local` | string | yes | What farmer asks for: "Karate", "Urea Sona" |
| `name_english` | string | no | Invoice / company |
| `company_id` | fk | no | Syngenta, Engro, etc. |
| `company_sku` | string | no | Reconciliation |
| `category` | enum | yes | fertilizer / herbicide / … |
| `active_ingredient` | string | pesticides | Label reference |
| `formulation` | enum | pesticides | EC, WP, SC, WG |
| `base_unit` | enum | yes | Canonical stock: `kg`, `L`, `ml`, `piece` — see [§6](#6-units-pricing--margins) |
| `purchase_units[]` | UnitConversion[] | yes | How company delivers (bori, bag, carton) |
| `sale_units[]` | UnitConversion[] | yes | How farmer buys (full bag, 5 kg, 10 kg, 1 L) |
| `default_purchase_unit_id` | fk | no | GRN default |
| `default_sale_unit_id` | fk | no | Counter default |
| `barcode` | string | no | Scan at counter — can map to a sale unit |
| `buy_price` | money | yes | Updates on GRN |
| `sell_price` | money | yes | Counter default |
| `requires_batch` | bool | pesticides=true | |
| `primary_season` | enum[] | no | kharif, rabi, year_round |
| `crops` | string[] | no | cotton, wheat — label only |
| `dose_per_acre` | string | no | Display only from label |
| `reorder_point` | decimal | no | Low stock alert |
| `is_active` | bool | yes | Soft hide |

### 4.3 Batch record (pesticides)

| Field | Notes |
|-------|-------|
| `batch_no` | Company batch |
| `expiry_date` | Block sale after unless owner override |
| `qty_on_hand` | Always in **base_unit** (e.g. kg, L) |
| `grn_id` | Link to purchase |
| `purchase_unit_id` | Unit used on GRN line (e.g. bag_50) |
| `purchase_qty` | e.g. 100 bags → stored as 5000 kg |

---

## 5. Seasonality & crop calendar

**Configure per `business.region`** — defaults below Punjab-oriented.

### 5.1 Kharif vs Rabi (conceptual)

| Season | Typical crops | Dealer peak |
|--------|---------------|-------------|
| **Kharif** | Cotton, rice, maize, sugarcane | Cotton spray Jun–Aug; rice chem Jul–Sep |
| **Rabi** | Wheat, gram, potato, mustard | Wheat herbicide Nov–Dec; urea topdress Feb |
| **Orchard** | Citrus, mango | Year-round pockets |

### 5.2 Month-by-month dealer focus (Punjab template)

| Month | Stock-up | Sell peak | Collection |
|-------|----------|-----------|------------|
| Jan–Feb | Rabi topdress | Urea movement | Rabi harvest prep |
| Mar–Apr | Wheat chem tail | Last Rabi spray | — |
| May–Jun | Cotton sowing inputs | Seed + early chem | — |
| Jul–Aug | Cotton spray | Insecticide **peak** | Early udhaar pressure |
| Sep–Oct | Rice chem | Rice pesticides | — |
| Nov–Dec | Wheat sowing | Herbicide + DAP | Cotton harvest **collections** |
| Dec–Jan | — | — | Farmer pays cotton udhaar |

### 5.3 Lixar season engine

- Product `primary_season[]`
- Home **banner:** "Cotton spray window — 12 days left"
- Reorder: same-week-last-year sales if ≥12mo data else category default
- **Do not** auto-order without owner confirm

---

## 6. Units, pricing & margins

Agri shops **buy** in company packs (bori / bag / carton) but **sell** in full packs *or* smaller amounts (5 kg, 10 kg, half-litre). Lixar must separate **purchase units**, **sale units**, and a single **base unit** for godown stock — with explicit **conversion factors**.

### 6.1 Design rules

| Rule | Why |
|------|-----|
| **One base unit per product** for inventory | Godown count is always in kg, L, or piece — no ambiguity |
| **Many sale units** per product | Farmer may take 10 kg, not whole 50 kg bori |
| **Purchase units** match company invoice | GRN in bags; stock converts to base |
| **Conversions are per-product** | Urea bag = 50 kg here, another brand = 25 kg |
| **Never assume global “bag = 50 kg”** | Dealer configures per SKU |
| **Fractional sale deducts base qty** | Sell 10 kg → stock −10 kg (may open a “loose” bag mentally) |
| **Price can be per sale unit or derived** | Rs/bori OR Rs/kg with auto calc |

### 6.2 Base unit (stock / godown)

| `base_unit` | Used for | Examples |
|-------------|----------|----------|
| `kg` | Solid fertilizer, some powders | Urea, DAP, WP packs weighed loose |
| `L` | Liquids (primary) | Herbicide, insecticide |
| `ml` | Small liquid packs | Optional if you prefer integer stock for sachets |
| `piece` | Equipment, sachets counted | Sprayer, mask, single sachet |

**Display:** Show stock as base + friendly alias, e.g. `2,450 kg (49 bori @ 50 kg)` — alias is **read-only** from conversion, not second inventory.

### 6.3 Purchase units (company / GRN)

What arrives on the **company delivery note**. Each purchase unit maps → base unit via `factor_to_base`.

| Code (example) | Label (UI) | Typical `factor_to_base` | Notes |
|----------------|--------------|--------------------------|-------|
| `bag_50` | Bori / bag (50 kg) | **50** kg | Most Punjab urea |
| `bag_25` | Bag (25 kg) | **25** kg | Some brands / regions |
| `bag_40` | Bag (40 kg) | **40** kg | Verify per product |
| `bori` | Bori | *alias of product default bag* | Roman Urdu label — same factor as configured bag |
| `carton_12x1L` | Carton (12×1 L) | **12** L | Pesticide bottles |
| `box_4x5L` | Box (4×5 L) | **20** L | Larger packs |
| `bottle_1L` | Bottle 1 L | **1** L | Single unit purchase |
| `drum_200L` | Drum | **200** L | Bulk |
| `piece` | Piece | **1** piece | Sprayer |

**GRN line example:**

```text
Urea Sona — 80 bag_50 → stock + 4,000 kg
Karate 1L — 5 carton_12x1L → stock + 60 L
```

### 6.4 Sale units (counter / farmer)

What the farmer asks for at the counter. Each sale unit also has `factor_to_base`.

| Code | Label (UI) | `factor_to_base` | Typical use |
|------|------------|------------------|-------------|
| `bag_50` | Poora bori (50 kg) | 50 kg | Full bag sale |
| `bag_25` | Poora bag (25 kg) | 25 kg | Full small bag |
| `kg` | Kilo | **1** kg | Loose / partial |
| `kg_5` | 5 kg | 5 kg | Preset chip (optional shortcut) |
| `kg_10` | 10 kg | 10 kg | Preset chip |
| `kg_20` | 20 kg | 20 kg | Preset chip |
| `L` | Litre | 1 L | Loose liquid |
| `ml_500` | Half litre | 0.5 L | If allowed |
| `bottle_1L` | Bottle | 1 L | Sealed bottle |
| `piece` | Piece | 1 | Sprayer |

**Important:** `kg_5`, `kg_10` are **sale presets** (qty multiplier), not separate inventory units — user can also enter `qty=7` × unit `kg` → 7 kg deducted.

**Roman Urdu counter prompts:**

- *"Poora bori"* → default full purchase bag for that SKU  
- *"5 kilo urea"* → sale unit `kg`, qty `5`  
- *"Adha bori"* → sale unit `kg`, qty `25` (if bori=50) — show calc on confirm sheet  

### 6.5 Product-level conversion examples

#### Example A — Urea (50 kg bori, loose kg allowed)

| Unit type | Code | factor_to_base | Default price basis |
|-----------|------|----------------|---------------------|
| Base | — | — | `kg` |
| Purchase | `bag_50` | 50 kg | Company invoice per bag |
| Sale | `bag_50` | 50 kg | Rs 4,800/bori |
| Sale | `kg` | 1 kg | Rs 96/kg (auto: 4800÷50) |

**Sale scenarios:**

| Farmer buys | Qty | Base deducted | Amount |
|-------------|-----|---------------|--------|
| 1 poora bori | 1 × bag_50 | 50 kg | 4,800 |
| 10 kg loose | 10 × kg | 10 kg | 960 |
| 2 bori + 5 kg | 2×bag_50 + 5×kg | 105 kg | 9,600 + 480 |

#### Example B — Urea variant (25 kg bag only)

| Purchase | `bag_25` | 25 kg |
| Sale | `bag_25` | 25 kg |
| Sale | `kg` | 1 kg |

Same UI — different factors on the **product**, not global app setting.

#### Example C — Karate 1 L (carton in, bottle or loose L out)

| Purchase | `carton_12x1L` | 12 L |
| Purchase | `bottle_1L` | 1 L |
| Sale | `bottle_1L` | 1 L |
| Sale | `L` | 1 L | Only if dealer sells decanted (policy flag `allow_loose_liquid`) |

#### Example D — Sprayer (piece only)

| Base | `piece` |
| Purchase & sale | `piece` × 1 |

### 6.6 Conversion data model

```yaml
unit_definition:
  id: bag_50
  code: bag_50
  label_en: "Bag (50 kg)"
  label_ur: "Bori (50 kg)"
  dimension: mass          # mass | volume | count
  factor_to_base: 50       # multiply qty by this → base unit
  base_unit: kg            # must match product.base_unit

product_unit:
  product_id: urea-sona
  unit_id: bag_50
  role: purchase | sale | both
  is_default_purchase: true
  is_default_sale: false
  price: 4800              # optional fixed price per this sale unit
  price_per_base: null     # or derive from bori price

product:
  base_unit: kg
  allow_fractional_sale: true
  sale_presets: [5, 10, 20, 25]   # kg chips on keypad
```

**Invoice line stores:**

```json
{
  "product_id": "...",
  "sale_unit_code": "kg",
  "sale_qty": 10,
  "base_qty": 10,
  "base_unit": "kg",
  "unit_price": 96,
  "line_total": 960
}
```

### 6.7 Stock movements

| Event | User enters | System records |
|-------|-------------|----------------|
| GRN | 100 `bag_50` | `+5000 kg` |
| Sale | 10 `kg` | `−10 kg` |
| Sale | 2 `bag_50` | `−100 kg` |
| Adjustment | −3 kg (spillage) | `−3 kg` |
| Stock count | Godown 2,440 kg | Compare to system |

**Low-stock alert:** In base unit, e.g. `remaining_kg < reorder_point_kg`.

**Optional open bag tracking:** Track “bori #7 opened, ~40 kg left” for auditors; default godown accounting uses base kg only.

### 6.8 Pricing & margin per unit

| Mode | Behavior |
|------|----------|
| **Price per sale unit** | Rs per bori, Rs per bottle — explicit on line |
| **Price per base unit** | Rs/kg, Rs/L — qty × rate |
| **Derived** | Set bori price → auto calc kg price = bori ÷ factor |

**On sale lock:** `unit_cost_at_sale` in base unit (from weighted batch cost) × `base_qty` = COGS line.

**Margin display (owner):**

```text
Sold: 10 kg @ 96 = 960
COGS: 10 kg @ 82 = 820
Margin: 140 (14.6%)
```

### 6.9 Reference retail bands (2025, indicative)

| Product | Default purchase unit | Typical sale units | PKR range |
|---------|----------------------|-------------------|-----------|
| Urea | bag_50 (50 kg) | bori, 5/10/20 kg loose | ~4,300 – 5,550 / borı |
| DAP | bag_50 | bori, loose kg | ~11,000 – 13,000+ / borı |
| Cotton insecticide | bottle_1L or carton | 1 L bottle | Brand-dependent |

**Lock margin at sale:** `unit_cost`, `unit_price`, `sale_unit_code`, `base_qty` on every line — price changes mid-season do not alter past entries.

### 6.10 Counter UX (sale unit picker)

```text
Product: Urea Sona
┌─────────────────────────────────────┐
│ [ Poora bori (50kg) ]  [ 5 kg ]     │
│ [ 10 kg ]  [ 20 kg ]  [ Custom kg ] │
│ Qty: [ 10 ]  Unit: kg               │
│ = 10 kg  ·  Rs 960                  │
└─────────────────────────────────────┘
```

- Default chips from `product.sale_presets`  
- **Custom:** numeric qty + unit dropdown (`kg`, `bag_50`, …)  
- Confirm sheet always shows **base equivalent** (“Stock se 10 kg kam hoga”)  
- Voice: *"Urea 10 kilo"* → product + `kg` + qty 10  

---

## 7. Day-to-day operations

### 7.1 Opening (06:00–08:00)

1. Cash float count  
2. Godown walk — top 5 SKUs count vs system  
3. Expiry shelf check — FEFO  
4. Review overdue farmer list  

### 7.2 Counter sale (cash)

```text
Select farmer → Add product → Pick sale unit (bori / 5kg / 10kg / L / bottle)
→ Enter qty → Confirm base deduction (e.g. 10 kg) → Batch if pesticide
→ Payment: Cash → Stock − in base unit → Receipt WhatsApp
```

### 7.3 Counter sale (udhaar)

```text
Same + Payment: Udhaar → Ledger gave + stock −
→ Set recovery: after_cotton_harvest | date
→ Optional credit limit warning
```

### 7.4 Company delivery (GRN)

```text
Supplier party → Line items + batch/expiry → Attach delivery note photo
→ Payment: cash | bank | company udhaar → Stock +
```

### 7.5 End of day

```text
Drawer count → Variance reason if needed
→ Pesticide register preview (if sales today)
→ Schedule tomorrow reminders
```

---

## 8. Stakeholders & party model

| Party role | Tag | Balance meaning |
|------------|-----|-----------------|
| Farmer | `customer` | + they owe you |
| Company / distributor | `supplier` | − you owe them |
| Farmer committee | `customer` + `group` | Shared limit |
| Company agronomist | `contact` | No balance — notes |
| Loader / transport | `expense` | — |

**Disambiguation fields:** `phone`, `father_name`, `village`, `cnic_last4` (optional)

**Credit psychology:** Capture `expected_recovery_season` not only calendar date.

---

## 9. Pain points → product features

| Pain | Feature |
|------|---------|
| Register ≠ khata | Single write → register export + party balance |
| Expired sale | FEFO + block past expiry |
| Wrong cousin name | Rich party identity |
| Company target miss | Targets dashboard |
| "I already paid" | Timeline + payment photo attachment |
| Cash before harvest | Working capital gap widget |
| Similar bottles | Product image on catalog |
| Staff theft | Staff attribution + drawer variance |
| Sell 10 kg but stock book in boriyon | **Base unit** stock + sale unit picker (kg / bori) |
| 25 kg vs 50 kg bag confusion | Per-product `bag_25` / `bag_50` factors, not global |
| Company bill in bags, farmer in kg | GRN purchase unit → base; sale unit separate |

---

## 10. Screens & UX inventory

| Screen | Purpose |
|--------|---------|
| Agri Home | Season banner, receivable total, low stock, insights |
| Khata list | Farmers / suppliers, filters overdue |
| Party detail | Timeline, gave/got, statement export |
| Quick sale sheet | FAB — SKU grid + keypad |
| Product catalog | Categories, batch view |
| GRN / stock in | Company delivery |
| Pesticide register | Filter + export PDF |
| Company targets | Progress bars per company |
| Reports | Season sales, margin, aging |

**Default FAB:** Add sale / udhaar  
**Voice:** *"Rashid ko 2 litre karate udhaar"*

---

## 11. Data model & API

### 11.1 Entities

`Party`, `Product`, `UnitDefinition`, `ProductUnit`, `ProductBatch`, `StockMovement`, `LedgerEntry`, `LedgerAttachment`, `Invoice`, `InvoiceLine`, `CompanyTarget`, `PesticideRegisterExport`, `SeasonConfig`

**Units:** `UnitDefinition` (global codes) + `ProductUnit` (per-SKU purchase/sale roles, factors, prices). Stock always stored in `product.base_unit`.

### 11.2 Ledger entry (agri extensions)

```json
{
  "kind": "gave",
  "amount": 8400,
  "party_id": "farmer-uuid",
  "category": "sales",
  "is_pesticide_sale": true,
  "lines": [
    {
      "product_id": "...",
      "batch_id": "...",
      "sale_unit_code": "L",
      "sale_qty": 2,
      "base_qty": 2,
      "base_unit": "L",
      "unit_price": 4200,
      "line_total": 8400
    }
  ],
  "expected_recovery_season": "kharif_cotton_harvest",
  "note": "Karate 2L udhaar"
}
```

### 11.3 API endpoints (additive)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports/pesticide-register` | Date range export |
| GET | `/insights/working-capital-gap` | Receivable − payable |
| POST | `/stock/grn` | Goods received |

---

## 12. Integrations & ecosystem

| Partner | Capability | Value |
|---------|------------|-------|
| WhatsApp | Share + BSP reminders | Receipt, reminder |
| Agri companies | Price CSV / API | Catalog sync |
| FasalPay / banks | GNPL flags | Farmer finance |
| Raast | QR on balance | Instant collection |

---

## 13. Product scope

- Parties (farmer/supplier), gave/got, timeline, recovery tiers  
- Agri catalog: khaad, spray, pesticide; base / purchase / sale units  
- Stock GRN, batch/expiry **FEFO**, low stock, season banner, company targets  
- Pesticide register PDF export  
- Billing, WhatsApp ledger card/PDF, offline sync  
- Voice entry, OCR company bill, automated WhatsApp reminders  
- Company price CSV / API sync  
- Raast collection on party balance; GNPL / bank program hooks  

---

## 14. Sample transactions

| # | Narration | System effect |
|---|-----------|---------------|
| 1 | Rashid buys 2L Karate on udhaar | `gave` 8400, sale 2×`L`, base −2 L, batch A |
| 1b | Rashid buys 10 kg Urea loose | `gave`, sale 10×`kg`, base −10 kg (not full bori) |
| 1c | Rashid buys 1 poora bori Urea | sale 1×`bag_50`, base −50 kg |
| 2 | Rashid pays 5000 cash partial | `got` 5000, balance reduced |
| 3 | Engro delivers 100 urea bags | GRN +100, payable to Engro |
| 4 | Cash sale 1 sprayer | Invoice paid, stock −1, cash in |
| 5 | Expired batch write-off | Stock adjust, expense or loss category |

---

[← Index](README.md) · **Next:** [03 — Crop Trading](03-vertical-crop-trading.md)
