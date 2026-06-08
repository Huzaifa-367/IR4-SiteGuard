# 05 — Vertical Research: Mobile Repair & Sale-Purchase

[← Index](README.md) · [04 Property](04-vertical-property-plots.md) · **Next:** [06 Personas](06-personas-and-workspace.md)

**Priority:** #4  
**Primary user:** Bazaar repair shop, used/new phone retailer

---

## Table of contents

1. [Industry overview](#1-industry-overview)
2. [Revenue & margin](#2-revenue--margin)
3. [PTA / DIRBS compliance](#3-pta--dirbs-compliance)
4. [Repair ticket lifecycle](#4-repair-ticket-lifecycle)
5. [Device catalog — models & variants](#5-device-catalog--models--variants)
6. [Parts catalog — compatibility & variants](#6-parts-catalog--compatibility--variants)
7. [Stock, reservations & pricing](#7-stock-reservations--pricing)
8. [Used phones & trade-in](#8-used-phones--trade-in)
9. [Pain points → features](#9-pain-points--features)
10. [Screens & UX](#10-screens--ux)
11. [Data model](#11-data-model)
12. [Product scope](#12-product-scope)

---

## 1. Industry overview

### 1.1 Shop formats

| Format | Location examples | Mix |
|--------|-------------------|-----|
| Counter repair | Every bazaar | Repair + accessories |
| Used phone specialist | Hall Road Lahore, Saddar KHI/RWP | Buy/sell + PTA anxiety |
| Brand outlet + service | Malls | New sales + warranty repair |
| Mall kiosk | Accessories | Low repair |

### 1.2 Supply chain

- **Parts:** Lahore markets, China import screens/batteries  
- **New phones:** Official distributor + gray import  
- **Used phones:** Trade-in, customer sell, dealer chain  

---

## 2. Revenue & margin

| Stream | Typical margin | Lixar tracking |
|--------|----------------|----------------|
| Repair labor | Flat fee + upsell | `labor_charge` on ticket |
| Parts | 20–100%+ on screen/battery | BOM lines → COGS |
| Used flip | Buy low sell high | Device asset cost vs sale |
| New phone | Thin | IMEI + serial on invoice |
| Accessories | High turnover | SKU retail |

**Owner-only metric:** margin % per ticket — hide from technician role.

---

## 3. PTA / DIRBS compliance

Pakistan **PTA Device Identification Registration and Blocking System (DIRBS)** blocks unregistered devices on cellular networks.

### 3.1 Check methods

| Method | Steps |
|--------|-------|
| SMS | Send IMEI to **8484** |
| Web | dirbs.pta.gov.pk |
| Dial | *#06# on device |
| App | DIRBS official app |

### 3.2 Status meanings

| Status | Shop action |
|--------|-------------|
| Compliant / Approved | OK to buy/sell |
| Non-compliant | Warn customer; owner override to purchase |
| Blocked | Do not buy |
| Not found | Possible fake — hard stop |

### 3.3 Lixar buy workflow (used phone)

```text
1. Enter IMEI_1 (and IMEI_2 if dual SIM)
2. Log check_result + timestamp + optional screenshot
3. If duplicate IMEI in inventory → HARD ALERT (cloning risk)
4. Record purchase_price, condition A|B|C, accessories
5. On sale → re-check if policy requires (e.g. >60 days in stock)
```

### 3.4 Counter poster (in-app help)

1. Dial *#06# — note IMEIs  
2. SMS each to 8484  
3. Confirm Compliant  
4. Log in Lixar  
5. Dual SIM: check **both**  

**Disclaimer in app:** PTA rules change — not legal advice.

### 3.5 IMEI cloning problem

Cloned IMEIs from duty-paid phones appear on counterfeit devices — duplicate detection protects shop from buying stolen/cloned stock and reputational loss.

---

## 4. Repair ticket lifecycle

### 4.1 States

| Status | Meaning | Customer message |
|--------|---------|------------------|
| `received` | In shop | "Ticket #1042 received" |
| `diagnosing` | Triage | — |
| `waiting_parts` | Parts ordered | ETA optional |
| `in_progress` | Repairing | — |
| `ready` | Pickup | **"Ready for pickup"** + balance |
| `delivered` | Closed | Invoice + warranty |
| `cancelled` | No repair | Return device |

### 4.2 Ticket fields

| Field | Notes |
|-------|-------|
| `ticket_no` | Human readable T-1042 |
| `customer_party_id` | Khata link |
| `device_model_id` | e.g. Samsung Galaxy A12 |
| `device_variant_id` | Storage / color / region — optional if unknown at intake |
| `imei_1`, `imei_2` | |
| `passcode_pattern` | Encrypted optional |
| `fault_description` | |
| `advance_amount` | `got` on create |
| `technician_id` | Performance |
| `parts[]` | `part_variant_id` + qty — reserved from stock |
| `labor_charge` | |
| `warranty_days` | Default 7/30 |

### 4.3 Ready queue (retention)

Home screen: **phones ready for pickup** — one-tap WhatsApp Urdu template. Speed = repeat business in competitive bazaars.

---

## 5. Device catalog — models & variants

Phones are not a single SKU. Shops think in **brand → model → variant** (RAM/storage, color, region). Each **variant** can have its own **optional default prices** for new sale, used buy, and used sell.

### 5.1 Catalog hierarchy

```text
Brand (Samsung, Apple, Infinix, Vivo)
  └── DeviceModel (Galaxy A12, iPhone 11, Y12s)
        └── DeviceVariant (4/64 Black, 4/128 Blue, PTA vs non-PTA pack)
              └── optional: DeviceAsset (physical unit with IMEI)
```

| Level | Example | Shared across units? |
|-------|---------|----------------------|
| **Brand** | Samsung | Yes |
| **DeviceModel** | Galaxy A12 | Yes — repair parts usually fit all variants* |
| **DeviceVariant** | 4GB / 64GB / Blue | Per configuration |
| **DeviceAsset** | IMEI 35…, condition B | One physical phone |

\*Some parts differ by variant (e.g. screen connector revision) — handled via **part compatibility** in [§6](#6-parts-catalog--compatibility--variants).

### 5.2 Variant attributes (device)

| Attribute | Examples | Required? |
|-----------|----------|-----------|
| `storage` | 32GB, 64GB, 128GB | Often |
| `ram` | 3GB, 4GB, 6GB | Often on Android |
| `color` | Black, Blue, Gold | Optional on ticket |
| `region` | PTA, CN, EU | Affects PTA / bands |
| `network` | 4G, 5G | Newer models |
| `sku_code` | Distributor code | Optional |

**Display name (auto):** `Samsung A12 · 4/64 · Black`

### 5.3 Optional prices per device variant

Prices are **optional** — shop may price only at transaction time; defaults speed up counter.

| Price field | Use |
|-------------|-----|
| `default_retail_price` | New phone sale |
| `default_used_buy_price` | Trade-in / purchase from customer |
| `default_used_sell_price` | Listed used asking price |
| `default_labor_screen` | Suggested labor for screen job (optional) |

```yaml
device_variant:
  id: uuid
  device_model_id: uuid
  label: "4GB / 64GB / Black"
  storage_gb: 64
  ram_gb: 4
  color: Black
  default_retail_price: 28500      # optional
  default_used_buy_price: 18000    # optional
  default_used_sell_price: 22000   # optional
  is_active: true
```

**On sale:** Pull defaults → user can override; line stores **actual** `unit_price` locked on invoice.

### 5.4 Ticket intake (device selection)

```text
Brand → Model → Variant (or "Variant maloom nahi" → model only)
→ IMEI + fault
→ Part picker filtered by model compatibility
```

If variant unknown at drop-off, link `device_model_id` only; technician sets `device_variant_id` at diagnosis.

---

## 6. Parts catalog — compatibility & variants

Spare parts are **never** just "screen" — they are **screen for A12** in **quality tier** (Original / OLED / Copy / In-cell) at **different prices**.

### 6.1 Parts hierarchy

```text
PartCategory (Screen, Battery, Charging flex, Back glass, Camera)
  └── PartProduct (Screen assembly — Galaxy A12)
        ├── compatibility: [DeviceModel: A12] or [DeviceVariant: …]
        └── PartVariant (ORG OLED, COPY LCD, COPY In-cell)
              └── stock qty, buy/sell price (optional per variant)
```

| Level | Example |
|-------|---------|
| **PartCategory** | Screen |
| **PartProduct** | A12 Screen Assembly |
| **PartVariant** | A12 Screen · Original OLED |
| **PartVariant** | A12 Screen · Copy LCD |
| **PartVariant** | A12 Screen · Copy In-cell |

### 6.2 Part variant attributes

| Attribute | Examples |
|-----------|----------|
| `quality_tier` | original, oem, copy_a, copy_b |
| `technology` | OLED, LCD, incell, amoled |
| `color` | Black, White (for back glass) |
| `supplier` | Hall Road vendor name |
| `barcode` | Scan at GRN |
| `warranty_days` | 7, 30 |

**Label (UI):** `A12 Screen · Copy In-cell` — Roman Urdu: *"Copy screen"*, *"Original"*

### 6.3 Compatibility matrix

Link parts to devices they fit.

```yaml
part_compatibility:
  part_product_id: a12-screen-assembly
  device_model_id: samsung-a12          # all variants
  # OR narrow:
  device_variant_id: samsung-a12-464-black   # rare
```

**Repair ticket UX:** After model selected, part search shows **only compatible** `PartProduct` / `PartVariant`.

### 6.4 Optional prices per part variant

| Price field | Use |
|-------------|-----|
| `cost_price` | Last / weighted purchase cost |
| `sell_price` | Default when adding to ticket BOM |
| `labor_suggested` | Optional hint (often on PartProduct) |

```yaml
part_variant:
  id: uuid
  part_product_id: a12-screen
  code: COPY_INCELL
  label: "Copy In-cell"
  quality_tier: copy_a
  cost_price: 2800          # optional — from GRN if blank
  sell_price: 4500            # optional — override on ticket allowed
  stock_qty: 12               # base unit: piece
  reorder_point: 3
```

**Ticket BOM line:**

```json
{
  "part_variant_id": "uuid",
  "qty": 1,
  "unit_cost": 2800,
  "unit_price": 4500,
  "price_overridden": false
}
```

### 6.5 Part catalog examples

#### Screens — Samsung Galaxy A12

| Part variant | Quality | Optional sell | Optional cost |
|--------------|---------|---------------|---------------|
| A12 Screen ORG | Original | 12,500 | 9,800 |
| A12 Screen Copy OLED | Copy | 6,500 | 4,200 |
| A12 Screen Copy In-cell | Copy | 4,500 | 2,800 |

#### Battery — Samsung Galaxy A12

| Part variant | Quality | Optional sell |
|--------------|---------|---------------|
| Battery ORG | Original | 3,200 |
| Battery Copy | Copy | 1,800 |

#### Charging flex — iPhone 11 (model-specific product)

| Part variant | Optional sell |
|--------------|---------------|
| Flex ORG | 4,500 |
| Flex Copy | 2,200 |

### 6.6 Consumables (no device variant)

| PartProduct | PartVariant | Stock in |
|-------------|-------------|----------|
| UV glue | 50ml bottle | ml or piece |
| Tesa tape | Roll | piece |

Use `base_unit: piece | ml` — same pattern as [agri units](../02-vertical-agri-inputs.md#6-units-pricing--margins).

### 6.7 Voice / search

- *"A12 copy screen lagao"* → `PartProduct` A12 screen + variant COPY_INCELL  
- *"Original battery S21"* → model S21 + variant ORG battery  

---

## 7. Stock, reservations & pricing

### 7.1 Stock is per part variant

| Rule | Detail |
|------|--------|
| Inventory key | `part_variant_id` — not generic "screen" |
| Base unit | `piece` (default); consumables may use `ml` |
| GRN | Increments variant stock + updates `cost_price` if set |
| Sale / BOM | Decrements variant stock |

### 7.2 Reservation on ticket

When status → `waiting_parts`:

```yaml
part_reservation:
  repair_ticket_id: T-1042
  part_variant_id: a12-screen-copy-incell
  qty: 1
  status: reserved | consumed | released
```

Prevents selling the last copy screen on two open tickets.

### 7.3 Pricing rules

| Scenario | Behavior |
|----------|----------|
| Variant has `sell_price` | Pre-fill BOM; editable on ticket |
| No sell price | User enters; save optional "remember as default" |
| Variant has `cost_price` | Margin = sell − cost on close |
| Price override | `price_overridden: true` + audit for owner review |

**Labor** stays on ticket (`labor_charge`) — can add `PartProduct.default_labor` as suggestion per job type.

### 7.4 New phone retail (device variant)

Sell from `DeviceVariant` with optional `default_retail_price`:

```text
POS → Samsung A12 → 4/64 Black → IMEI scan → price pre-filled → invoice
```

Stock: either **serialized** (`DeviceAsset` per IMEI) or **qty per variant** (sealed box count) — shop setting.

---

## 8. Used phones & trade-in

### 8.1 Device asset (instance)

Physical unit — always tied to a **device variant** when known.

```yaml
device_asset:
  id: uuid
  device_model_id: samsung-a12
  device_variant_id: samsung-a12-464-black   # optional at buy, refine later
  imei_1: "..."
  imei_2: null
  purchase_cost: 18000                       # actual paid
  asking_price: 22000                      # can copy from variant.default_used_sell_price
  condition: A | B | C
  pta_check_log_id: uuid
  status: in_stock | sold | scrapped
  color_observed: Black                      # if variant_id null
```

**Aging alert:** 30 / 60 days unsold (per asset or per variant aggregate).

### 8.2 Trade-in (two-legged)

1. Buy used from customer → inventory asset  
2. Sell new phone → trade-in credit line  
3. Net margin across both legs on deal summary  

---

## 9. Pain points → features

| Pain | Feature |
|------|---------|
| "Kaun sa ready hai?" | Status board |
| Wrong screen bought (A11 vs A12) | Model compatibility filter |
| Copy vs original price mix-up | **Part variants** with clear labels + prices |
| Same part, different supplier cost | Per-variant `cost_price` from GRN |
| Parts not billed | Close ticket requires BOM or confirm none |
| PTA block after sale | IMEI log |
| Technician theft | Staff + reservation audit |
| Warranty return | Reopen linked ticket |
| Udhaar on case | Party khata on ticket |
| 64GB vs 128GB price difference | **Device variant** defaults |

---

## 10. Screens & UX

| Screen | Purpose |
|--------|---------|
| Mobile Home | Tickets by status, ready queue |
| New ticket | Brand → model → variant (optional) + fault + advance |
| Ticket detail | Status stepper, BOM (part variants), invoice |
| PTA check | IMEI entry + log |
| Device catalog | Models + variants + optional prices |
| Parts catalog | Part products, variants, compatibility |
| Parts stock | Qty **per part variant** |
| Used inventory | Device assets by model/variant + aging |
| POS sell phone | Variant → IMEI → price (defaults) |

### 10.1 Part picker on ticket (wireframe)

```text
Device: Samsung A12 (4/64 Black)
┌────────────────────────────────────────┐
│ Add part — compatible only             │
│ [ Screen ] [ Battery ] [ Charging flex ] │
│                                         │
│ ○ Original OLED      Rs 12,500  (5)    │
│ ● Copy In-cell       Rs  4,500  (12)   │
│ ○ Copy LCD           Rs  3,800  (2)    │
│                                         │
│ Labor: [ 800 ]                          │
└────────────────────────────────────────┘
```

### 10.2 Device variant admin

```text
Model: Galaxy A12
┌──────────────┬────────┬──────────┬──────────┐
│ Variant      │ Retail │ Used buy │ Used sell│
├──────────────┼────────┼──────────┼──────────┤
│ 3/32 Black   │ 24,500 │ 14,000   │ 17,500   │
│ 4/64 Blue    │ 28,500 │ 18,000   │ 22,000   │
│ 4/128 Gold   │ 32,000 │ 20,000   │ 25,000   │
└──────────────┴────────┴──────────┴──────────┘
(all price columns optional)
```

**FAB:** New ticket (workshop) / Scan barcode (parts GRN)

---

## 11. Data model

### 11.1 Catalog entities

| Entity | Description |
|--------|-------------|
| `DeviceBrand` | Samsung, Apple, … |
| `DeviceModel` | Galaxy A12 — belongs to brand |
| `DeviceVariant` | Storage/RAM/color + **optional default prices** |
| `PartCategory` | Screen, battery, … |
| `PartProduct` | "A12 Screen assembly" — job family |
| `PartCompatibility` | Links PartProduct → DeviceModel or DeviceVariant |
| `PartVariant` | Original / Copy / … + **optional cost & sell** + `stock_qty` |

### 11.2 Operations entities

| Entity | Description |
|--------|-------------|
| `RepairTicket` | Links `device_model_id`, optional `device_variant_id` |
| `TicketPartLine` | `part_variant_id`, qty, unit_cost, unit_price, override flag |
| `PartReservation` | Stock hold per ticket |
| `DeviceAsset` | Physical phone — IMEI + optional variant |
| `ImeiCheckLog` | PTA result |
| `TicketStatusHistory` | State machine |
| `WarrantyClaim` | Reopen link |

### 11.3 ER diagram (text)

```text
DeviceBrand 1─* DeviceModel 1─* DeviceVariant 1─* DeviceAsset
DeviceModel 1─* PartCompatibility *─1 PartProduct 1─* PartVariant
RepairTicket *─* TicketPartLine *─1 PartVariant
RepairTicket *─0..1 DeviceVariant
```

### 11.4 Deprecated naming

`PartSku` → use **`PartVariant`** (sellable/stock SKU) under **`PartProduct`** (catalog parent).

---

## 12. Product scope

- **Repair tickets:** model pick, statuses, advance, parts/labor lines, invoice  
- **PartProduct** + **PartVariant** (Original/Copy), compatibility matrix, BOM, stock per variant, optional cost/sell prices  
- **DeviceBrand** → **DeviceModel** → **DeviceVariant**; used asset linked to variant; default used/retail prices  
- Serialized new-phone stock per variant, **trade-in** deals  
- PTA/DERBS **IMEI** log, compliance flags  
- Barcode GRN, supplier price lists, technician KPI, variant-level analytics  

---

[← Index](README.md) · **Next:** [06 — Personas & Workspace](06-personas-and-workspace.md)
