# Deep Brainstorming — DigiKhata-Inspired Next-Gen Business OS

> **⚠️ Superseded by organized research:** Use **[`DOCs/Research/README.md`](Research/README.md)** — the canonical, structured documentation set (11 files by topic). This file is kept for reference only; **do not edit here** — update the Research folder instead.

---

**Document purpose:** Product, UX, architecture, and implementation thinking for **Lixar** (Lixar-POS / Lixar Khata).  
**Status:** Archived — see `DOCs/Research/`  
**Related artifacts:** `DOCs/project/` (HTML/React prototypes), `Mobile/` (Flutter app), Laravel API backend.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Market Context & Competitive Landscape](#market-context--competitive-landscape)
3. [North Star & Success Metrics](#north-star--success-metrics)
4. [Core Business Verticals & Product Strategy](#core-product-strategy)
5. [Deep Vertical Research (Pakistan)](#deep-vertical-research-pakistan)
6. [Product Positioning](#product-positioning)
7. [Experience Philosophy](#experience-philosophy)
8. [Complete Module Brainstorming (Modules 1–15)](#complete-module-brainstorming)
9. [UX System Brainstorming](#ux-system-brainstorming)
10. [Platform Strategy](#platform-strategy)
11. [Technical Brainstorming](#technical-brainstorming)
12. [Phased Roadmap](#phased-roadmap)
13. [Risks, Constraints & Open Questions](#risks-constraints--open-questions)
14. [Final Product Vision](#final-product-vision)
15. [Appendices A–E](#appendix-a--glossary)

---

## Executive Summary

This phase focuses on:

* Product thinking
* UX strategy
* System architecture
* Real-world SME workflows
* Behavioral design
* Automation opportunities
* Fintech scalability
* AI-native workflows

The goal is **not** to clone [DigiKhata](https://digikhata.pk/) or any single competitor.

The goal is to build:

> **The operating system for small businesses in emerging markets** — starting with Pakistan and expanding to South Asia.

### Core business verticals (Lixar focus)

Lixar is **not** a generic retail POS. The product is shaped around **four real businesses** (in priority order):

| Priority | Vertical | What they sell / manage | Seasonality & nuance |
|:--------:|----------|-------------------------|----------------------|
| **1** | **Agri inputs — pesticides, khaad (fertilizer), spray** | Registered/unregistered crop protection, Urea/DAP, herbicide/insecticide bottles, sprayers | **Kharif / Rabi** demand spikes; expiry & batch critical; farmer udhaar until harvest |
| **2** | **Seasonal crops — sale & purchase** | Wheat, cotton, rice, maize, vegetables — buying from farmers, selling to mills/traders | Price per maund/kg changes daily; moisture & quality grades; commission & arthi relationships |
| **3** | **Property & plots** | Residential/commercial plots, installments, token money, registry milestones | Long-cycle receivables; party = buyer/seller/broker; not SKU inventory |
| **4** | **Mobile repair & sale-purchase** | Used/new phones, parts, repair jobs (screen, battery), trade-in | IMEI/serial tracking; repair ticket ≠ retail invoice; parts stock + labor lines |

One owner may run **multiple verticals** under one workspace (e.g. agri shop + mobile corner) — use **business lines** or **flavors** to switch UI defaults without mixing ledgers blindly.

### What “Business OS” means in practice

| Layer | User-facing promise | Backend reality |
|-------|---------------------|-----------------|
| **Record** | Every sale, udhaar, expense, and stock move in &lt;10 seconds | Append-only ledger + inventory events |
| **Understand** | “Am I okay today?” on one screen | Aggregations + anomaly detection |
| **Act** | One tap to remind, reorder, or collect | Integrations (WhatsApp, Raast, SMS) |
| **Grow** | Credit, insights, multi-branch | Scoring models + workspace isolation |

### Lixar alignment (current repo)

| Asset | Role |
|-------|------|
| `DOCs/project/Lixar Khata.html` + JSX modules | Pixel target for UI (dark emerald theme, PKR, Roman Urdu copy) |
| `Mobile/` Flutter + Riverpod + Hive | Primary client; offline-first local store |
| Laravel + Inertia (web) | Admin, accountant, bulk operations |
| Prototype entities (`PARTIES`, `PRODUCTS`, `INVOICES`) | Seed domain language for APIs and DB schema |

---

## Market Context & Competitive Landscape

### Target geography

**Primary:** Pakistan (urban + peri-urban SMEs).  
**Secondary:** India, Bangladesh (similar udhaar culture, mobile money, low ERP penetration).

### Market realities

* **90%+** of agri retail and local trade is informal; “accounting software” is intimidating — owners think in **maund**, **bori**, **litre**, and **season**, not GL codes.
* **Udhaar (credit)** peaks around **harvest** — farmers pay after crop sale; reminders must respect “fasal ke baad” promises.
* **Agri compliance:** Pesticide/fertilizer dealers may need batch numbers, expiry, and product labels — stock-outs during spray season lose the year’s trust.
* **Crop trading** is volatile — yesterday’s wheat rate ≠ today’s; invoices need **rate per unit** + weight slip photo.
* **Plot deals** span months — token, installment, and registry events are **milestones**, not daily POS.
* **Mobile shops** mix **service jobs** (repair) with **inventory SKUs** (phones/parts) — one app must support both line types.
* **WhatsApp** is the real CRM; share ledger cards, rate updates, and payment links there.
* **Connectivity:** 3G/4G intermittent in rural mandi towns — offline is mandatory.
* **Devices:** Android low-end; thumb-first; often used with gloves/dust — large targets.
* **Language:** Roman Urdu + English; voice examples: *"Rashid ko 2 spray diye"*, *"Ali ne 40 maund gehun becha"*.

### Pakistan SME context (by vertical)

| Vertical | Estimated addressable behavior | Dominant record-keeping today | Digital gap |
|----------|-------------------------------|------------------------------|-------------|
| Agri input retail | Tens of thousands of licensed + village shops (Punjab/Sindh/SK) | Paper **sale register** (legally required for pesticides), company duplicate invoices | No link between register, godown count, and farmer khata |
| Crop / mandi trade | Registered **arthi** + thousands of informal buyers | Weight slips, notebooks, verbal rates | Margin per season invisible; disputes on moisture/kat |
| Property / files | Agents in every housing society corridor | Excel, WhatsApp voice notes, society receipts | Double booking, missed installments, file-vs-plot confusion |
| Mobile repair / resale | Shops in every bazaar + markets (Hall Road, etc.) | Paper tickets, memory | No IMEI audit trail; PTA risk on used stock |

### Competitive matrix (by vertical)

| Vertical | Incumbent tools | Lixar wedge |
|----------|-----------------|-------------|
| **Agri** | Paper ledger (legal), company salesman order books, DigiKhata for udhaar only | **Compliance-ready pesticide register** + batch/expiry + season reorder + farmer khata |
| **Crop** | Arthi notebooks, mandi rate WhatsApp groups, Zarai Mandi–style rate sites (reference) | **Lot-based accounting** + slip photo + season P&L + mill settlement |
| **Property** | Society office portals (partial), agent Excel, Zameen/Facebook listings (marketing only) | **Installment CRM** + plot/file lifecycle + broker commission split |
| **Mobile** | Generic POS, paper job cards | **Repair ticket + DIRBS check log** + parts BOM + used-phone margin |
| **Cross** | DigiKhata, Khatabook | Vertical depth + Urdu voice + offline |

| Product | Strength | Weakness | Lixar opportunity |
|---------|----------|----------|-------------------|
| DigiKhata | Brand, khata habit, Pakistan focus | Not agri-season / expiry / commodity / plot aware | Vertical OS: agri + mandi + plot + mobile |
| Agri ERP / dealer software | Batch, company integration | Expensive, desktop, English-heavy | Mobile-first, Urdu voice, farmer khata |
| Khatabook / OkCredit (India) | Scale, reminders | Less PK fintech (JazzCash, Raast) | Local rails + Urdu voice |
| Excel / paper | Free, flexible | No reminders, no sync | Zero migration friction (import + voice) |
| Generic POS (Square, etc.) | Hardware ecosystem | Not built for udhaar culture | Relationship-first ledger |

### Differentiation thesis

1. **Relationship-first khata** — farmer, arthi, plot buyer, or repair customer as a **party**, not a row.
2. **Season-aware intelligence** — reorder khaad before Kharif, flag spray expiry, crop rate alerts.
3. **Vertical templates** — pesticide shop vs crop mandi vs plot dealer vs mobile shop onboarding in one platform.
4. **Voice + OCR first** — Urdu voice for udhaar, weight slips, and supplier bills.
5. **Embedded collections** (QR, Raast, JazzCash) tied to ledger balance — especially post-harvest recovery.
6. **Multi-vertical workspace** — same owner, separate books per line of business when needed.

---

## North Star & Success Metrics

### North star metric

**Weekly Active Businesses (WAB)** where a business logs ≥1 meaningful event (ledger, invoice, stock, or payment) on **3+ distinct days** in a week.

### Supporting metrics

| Category | Metric | Why it matters |
|----------|--------|----------------|
| Activation | Time to first ledger entry &lt; 3 min | Onboarding friction |
| Retention | D7 / D30 retention by vertical (agri / crop / property / mobile) | Product-market fit |
| Recovery | % overdue balance collected within 7 days of reminder | Core value of khata |
| Revenue | ARPU from subscriptions + payment take rate | Sustainability |
| Trust | Chargeback / fraud rate, support tickets per 1k MAU | Fintech viability |
| Performance | P95 cold start &lt; 2s, offline entry sync &lt; 5s | Low-end devices |

### Anti-metrics (avoid optimizing blindly)

* Raw notification count (causes uninstalls).
* Feature count without depth.
* DAU driven only by promotional pings.

---

# CORE PRODUCT STRATEGY

## Primary User Personas (by vertical priority)

### 1. Agri input dealer — pesticides, khaad, spray *(core)*

> **Deep research:** [Vertical 1 — Agri inputs](#vertical-1--agri-inputs-pesticides-khaad-spray)

**Examples:**

* Pesticide & fertilizer retail shop (dealer / sub-dealer)
* Village-level agri store with sprayers and seeds
* Wholesaler supplying multiple retail counters

**What they stock & sell:**

| Category | Examples | Unit / tracking |
|----------|----------|-----------------|
| **Khaad (fertilizer)** | Urea, DAP, NP, SOP | Bag (50 kg), bori |
| **Spray / pesticide** | Herbicide, insecticide, fungicide | Bottle (ml/L), carton |
| **Equipment** | Manual/battery sprayer, mask | Piece |
| **Adjuvant / seed treatment** | Sticker, booster | Small packs |

**Demographics & context:**

* Shop on highway or mandi edge; farmers arrive in peaks (morning, pre-spray weather).
* Credit common until **fasal** (crop) sale — recovery tied to Kharif/Rabi calendar.
* Staff may sell wrong chemical or expired batch — liability and trust risk.
* Mix of cash, Easypaisa, and long-running farmer khata.

**Jobs to be done (JTBD):**

| When… | I want to… | So I can… |
|-------|------------|-----------|
| Farmer takes spray on udhaar | Log party + product + litres/bags in seconds | Recover after harvest without dispute |
| Season starts (e.g. cotton spray window) | See fast movers & expiry soon | Not miss sales or sell expired stock |
| Company salesman delivers stock | Record purchase + pay partial | Match company statement |
| Farmer disputes “which chemical” | Open timeline with product name & date | Defend with record |

**Pain points:**

* Farmer udhaar forgotten or mixed up between cousins with same name
* Expired pesticide on shelf (regulatory + crop loss)
* Wrong SKU sold (similar bottles)
* Seasonal cash crunch when company demands payment before farmer pays
* Manual register vs actual bags in godown

**Day-in-the-life (compressed):**

```
06:00  Open godown — count Urea bags, check expiry shelf
08:00  Farmers — cash + udhaar for 2 L herbicide + 1 sprayer
12:00  Company delivery — 20 cartons insecticide, partial payment
16:00  Field agent order on phone — reserve stock for pickup
20:00  WhatsApp: "fasal ke baad" reminders to 5 farmers with red balance
```

**Domain-specific product needs:**

* Product catalog: **active ingredient**, **crop label**, **dose per acre** (reference, not prescription)
* **Batch + expiry** mandatory for pesticides; FEFO pick prompts
* **Season tags** on products (Kharif/Rabi/off-season)
* Voice: *"Rashid farmer ko 2 litre karate spray udhaar"*

**Sample parties (replace prototype kiryana names):** Rashid Farmer (Okara), Malik Agro Supplies (company), Village Committee Group.

**Stakeholders this dealer interacts with:**

| Party type | Relationship | Typical khata direction |
|------------|--------------|-------------------------|
| Farmer | Buyer (credit/cash) | Farmer owes dealer (`+` balance) |
| Company distributor | Supplier | Dealer owes company (`−` balance) |
| Field agronomist / company agent | Influencer, not payer | Notes only |
| Transport / loader | Expense | Cash out |
| Farmer committee | Group credit | Shared limit, individual settlement |

**Credit psychology:** Farmer may promise *"gehun ki fasal ke baad"* — product should capture **expected_recovery_season** not only a date. Reminder tone must not insult during flood/drought weeks (snooze weather/region flag — V2).

**Company pressure:** Distributor credit due **before** farmer pays — dashboard **“company payable vs farmer receivable gap”** is a killer metric for this vertical.

---

### 2. Seasonal crop trader — sale & purchase *(second)*

> **Deep research:** [Vertical 2 — Seasonal crops](#vertical-2--seasonal-crops-sale--purchase)

**Examples:**

* Wheat / cotton / rice buyer at mandi
* Vegetable commission agent (arthi)
* Broker linking farmer to flour mill or ginning factory

**What they trade:**

* **Purchase from farmers:** weight slip (maund/kg), moisture, grade, deduction
* **Sale to mills/traders:** bulk invoice, transport, commission
* **Not** classic SKU retail — **commodity + grade + rate** per transaction

**Jobs to be done (JTBD):**

| When… | I want to… | So I can… |
|-------|------------|-----------|
| Farmer brings crop on cart | Record weight, rate, deductions, net payable | Pay correct amount or log udhaar |
| I sell lot to mill | Link purchase lots to sale + margin | Know profit per season |
| Rate changes daily | Update today’s rate template | Avoid argument on old deals |
| Season ends | See who still owes / who I owe | Close books before next crop |

**Pain points:**

* Weight slip disputes (moisture, bardana, kat)
* Multiple arthi / middlemen — nested balances
* Cash heavy days — drawer vs register mismatch
* No single “inventory” — **open lots** and **committed qty**

**Domain-specific product needs:**

* **Commodity module** (not only product SKU): wheat, cotton, etc.
* **Lot / wagon / slip ID** per intake
* **Grade & deduction** lines on invoice
* **Season dashboard:** total bought, sold, margin, outstanding
* Voice: *"Ali ne 40 maund gehun becha, rate 9500"*

**Module overlap:** Khata (farmer/mill parties), Billing (slip-style invoice), Reports (season P&L), optional **Mandi rate** feed (future).

**Who owes whom (confusion point for UX):**

| Transaction | You paid farmer (purchase) | Farmer paid you (rare) |
|-------------|---------------------------|------------------------|
| Accounting | **Payable** — you owe farmer | Receivable |
| Khata `gave/got` | Use **supplier-style** party or “purchase payable” | `got` reduces what you owe |

Use clear Roman Urdu labels: **"Hamain dena hai"** vs **"Hamain lena hai"** on crop screens — not generic shopkeeper wording.

**Rate volatility:** Cotton 2024 saw **phutti** ~7,200–8,100 Rs/40kg and **lint** ~17,200–18,500 Rs/maund in Punjab reports — deals must **lock rate on slip** with timestamp; repricing is a **new transaction**, not silent edit.

---

### 3. Property & plot dealer *(third)*

> **Deep research:** [Vertical 3 — Property & plots](#vertical-3--property--plots)

**Examples:**

* Housing society plot agent
* Commercial plaza installments
* Agricultural land broker (kanal / acre)

**What they manage:**

* **Plots** as inventory (plot #, block, size marla/kanal)
* **Buyers** on installment plans: token → monthly → registry
* **Sellers / developers** as suppliers or commission partners
* **Brokers** with split commission — not product margin

**Jobs to be done (JTBD):**

| When… | I want to… | So I can… |
|-------|------------|-----------|
| Buyer pays token | Log milestone + plot link | Track who holds which plot |
| Installment due | Remind without sounding harsh | Improve collection |
| Plot resold / transferred | Close old ledger, open new | No double booking |
| Partner commission | Record split per deal | Settle with broker khata |

**Pain points:**

* Long cycles — forget which plot is **available vs booked vs registry pending**
* Installment schedules on paper
* Multiple stakeholders (buyer, seller, broker, society office)
* Not a fit for **stock count** — needs **deal pipeline**

**Domain-specific product needs:**

* **Plot registry** (status: available | booked | token paid | installment | registry done)
* **Deal / contract** object linking parties + schedule + attachments (PDF scans)
* **Milestone billing** (not line-item retail)
* Khata per buyer; reminders for installment date
* Reports: receivable aging by society/block

**Module overlap:** Khata (heavy), Billing (milestones), CRM-style pipeline (V2), Documents (attachments).

**File vs plot (must teach in onboarding):**

| Customer says | Means | Lixar record |
|---------------|-------|--------------|
| "File le li" | Pre-allotment claim | `PlotUnit` type = **file** |
| "Plot number aa gaya" | Post-balloting | status → **allotted** |
| "Possession mil gayi" | Can build | **possession** |
| "Registry ho gayi" | Title transfer | **registered** + scan upload |

**Installment math:** 36× monthly is common; also **quarterly** (Park View style) and **balloon** payments — schedule builder templates, not one formula.

**Agent commission:** Often paid in stages (booking, balloting, possession) — track **expected commission** vs **received** per deal.

---

### 4. Mobile repair & sale-purchase shop *(fourth)*

> **Deep research:** [Vertical 4 — Mobile repair](#vertical-4--mobile-repair--sale-purchase)

**Examples:**

* Mobile repair counter (screen, battery, charging port)
* Used phone buy/sell
* Accessories + new phone retail

**What they sell & service:**

| Type | Examples | Tracking |
|------|----------|----------|
| **Repair job** | Screen change, software flash | Ticket ID, device model, IMEI |
| **Sale** | New/used phone, earbuds | IMEI/serial, warranty |
| **Parts** | LCD, battery, flex | SKU stock |
| **Trade-in** | Buy old phone, sell new | Two-legged deal + margin |

**Jobs to be done (JTBD):**

| When… | I want to… | So I can… |
|-------|------------|-----------|
| Customer drops phone | Open repair ticket + advance | Track status (received / ready) |
| Repair done | Add parts used + labor → invoice | Correct margin per job |
| Buy used phone | Log purchase price + IMEI | Resell with profit |
| Customer on udhaar for accessory | Khata + small invoice | Recover on pickup |

**Pain points:**

* Lost track of phones in workshop (“kaun sa ready hai?”)
* Parts used but not billed
* IMEI duplication / swap fraud
* Mixing **service revenue** and **inventory COGS** in one drawer

**Domain-specific product needs:**

* **Repair ticket** workflow (status, parts, labor line)
* **Device record** (brand, model, IMEI, color, condition)
* **Used phone inventory** with purchase cost + asking price
* **Warranty expiry** on sold devices (optional)
* Voice: *"Samsung A12 ka screen change 4500, advance 2000"*

**Module overlap:** Inventory (parts), Billing (invoice + ticket), Khata (udhaar on accessories), Staff (technician attribution).

**PTA checklist (counter poster — product can mirror):**

1. Dial *#06# — note IMEI(s).  
2. SMS each IMEI to **8484**.  
3. Confirm **Compliant** before buy/sell used device.  
4. Log result in Lixar `ImeiCheckLog`.  
5. Dual-SIM: check **both** slots.

**Common repair price bands (indicative, city-dependent):** screen replacement often largest ticket (parts + labor); battery mid; software/low. Show **margin %** to owner only, not technician.

**Hall Road / market dynamics:** High competition — speed of “ready” WhatsApp message drives repeat customers; **ready queue** on home screen = retention feature.

---

### 5. Multi-vertical owner & multi-branch *(cross-cutting)*

Many real users combine **agri shop + mobile corner** or **crop trading + plot side business**.

**Pain points:**

* Mixing ledgers — farmer udhaar shown next to plot installment
* Branch reconciliation (mandi vs city shop)
* Staff selling in one vertical without permission in another

**Workspace model:**

```
Business
  ├── vertical: agri_inputs | crop_trade | property | mobile
  ├── branch: Main Shop | Mandi | Workshop
  └── permissions per vertical + branch
```

**Delegated authority:** Mandi cashier can sell crop lots but not delete plot deals.

---

# DEEP VERTICAL RESEARCH (PAKISTAN)

Field research synthesis for product design — regulations, supply chains, units, seasons, and **what to build in Lixar**. Sources: Punjab/Sindh agri calendars, Agricultural Pesticides Ordinance 1971, PTA DIRBS, mandi/arthi literature, housing society payment norms, market rate reports (2024–2025). *Validate all legal claims with a local advisor before compliance features ship.*

---

## Vertical 1 — Agri inputs (pesticides, khaad, spray)

### 1.1 Industry structure & money flow

```
[Multinational / local mfg]
        ↓ company invoice
[Distributor / regional depot]  — Syngenta, FMC, Engro Fertilizers, Sarsabz, etc.
        ↓ credit 15–45 days common
[Dealer / sub-dealer shop]      — your primary user
        ↓ cash + udhaar (until harvest)
[Farmer]                        — individual + sometimes farmer committee
```

**Revenue model for dealer:**

| Stream | Typical pattern |
|--------|-----------------|
| **Product margin** | Difference between company **dealer price** and **counter rate**; urea highly price-sensitive (gov-influenced), pesticides wider % margin on small packs |
| **Volume incentives** | Company **targets** per season (slabs, free goods, trips) — needs target vs actual tracking |
| **Services** | Free advice (unofficial), sprayer rental, delivery to field |
| **Finance** | Farmer udhaar = implicit lending at 0% — cost of capital hidden until default |

**Reference pricing (2025, indicative — varies by city/brand):**

| Product | Pack | Approx. retail band (PKR) |
|---------|------|---------------------------|
| Urea | 50 kg bag | ~4,300 – 5,550 |
| DAP | 50 kg bag | ~11,000 – 13,000+ (volatile) |
| Cotton insecticide (e.g. 1L pack) | litre | highly brand-dependent |

Dealers often **cannot pass through** sudden urea price changes to farmers already on udhaar — Lixar should show **margin at time of sale** locked on line item.

### 1.2 Regulatory & compliance (product implications)

Under the **Agricultural Pesticides Ordinance, 1971** and Rules 1973:

| Requirement | Implication for Lixar |
|-------------|----------------------|
| **Dealer license** (Form 12/13, ~3-year validity) | Optional `business.license_no` + expiry reminder on owner profile |
| **No sale without license** | Onboarding flag: “licensed pesticide dealer” toggles batch/register features |
| **Written ledger of pesticide sales + buyer names** | **Killer feature:** digital register exportable for inspection — maps 1:1 to `ledger_entries` where `category=pesticide` |
| **Trained handling** | Training cert upload (attachment) — reminder on renewal |

**Fertilizer** is less tightly “per-sale named buyer” than pesticides in practice, but dealers still benefit from unified stock + khata.

**Do not build:** agronomic prescription engine claiming to replace agronomist — only **reference labels** (crop, dose per acre from product label text).

### 1.3 Product taxonomy (catalog depth)

| Class | Subtypes | Units | Tracking |
|-------|----------|-------|----------|
| **Fertilizer (khaad)** | Urea, DAP, NP, SOP, micronutrients | 50 kg bag, sometimes 25 kg | Brand, company lot optional |
| **Pesticide — herbicide** | Wheat burndown, cotton weeds | L, ml | **Batch, expiry mandatory** |
| **Pesticide — insecticide** | Bollworm, whitefly, etc. | L, g | Batch, expiry, crop label |
| **Pesticide — fungicide** | Seed treatment, foliar | kg, L | Batch, expiry |
| **Seed** (often same shop) | Cotton, wheat, vegetables | kg, bag | Season tag |
| **Equipment** | Sprayer 12L/16L, mask, gloves | piece | Warranty optional |

**Catalog fields (minimum viable → advanced):**

```yaml
product:
  name_local: "Karate 2.5 EC"        # what farmer asks for
  company_sku: "SYN-xxx"
  active_ingredient: "Lambda-cyhalothrin"
  formulation: EC | WP | SC
  pack_size: 1
  pack_unit: L | kg | bag
  crops: [cotton, rice]               # label reference
  dose_per_acre: "80ml"               # text from label
  season: [kharif]
  requires_batch: true
  company_id: distributor_ref
```

### 1.4 Season calendar (Punjab-centric — adjust per region)

Use **configurable regional calendar** in app; defaults below from Punjab CRS / agrinfobank patterns (sowing windows overlap by district).

| Season | Crops (examples) | Dealer peak activity | Stock implications |
|--------|------------------|----------------------|-------------------|
| **Kharif** (Apr–Sep sowing band) | Cotton, rice, maize, sugarcane | Cotton spray **Jun–Aug**; rice pesticides Jul–Sep | Insecticide + herbicide spike; sprayer sales |
| **Rabi** (Oct–Mar) | Wheat, gram, vegetables | Wheat herbicide **Nov–Dec**; urea topdress **Feb** | Urea/DAP volume; fungicide seed treat |
| **Off / orchard** | Citrus, mango sprays | Year-round pockets | Lower volume specialty |

**Lixar season engine:**

* Tag products with `primary_season[]`.
* Dashboard **countdown**: “Cotton spray window — 12 days” (configurable).
* Reorder suggestions use **last-year same-week sales** if data exists, else category defaults.

### 1.5 Operational workflows (step-by-step)

#### A — Farmer counter sale (cash)

1. Select/create farmer party (phone, village optional).
2. Scan barcode or pick SKU → qty (bori / litre).
3. If pesticide → select **batch** (FEFO default) → auto-reduce stock.
4. Payment: cash / Easypaisa → `got` optional if advance on account.
5. Print/share WhatsApp receipt (Roman Urdu).

#### B — Farmer udhaar (credit)

1. Same as A but payment = **udhaar** → `gave` ledger + stock out.
2. Optional: **credit limit** per farmer (warn if exceeded).
3. Set **expected recovery** tag: `after_cotton_harvest` | date | custom.
4. Voice shortcut: *"Rashid ko 2 litre karate udhaar, fasal ke baad"*.

#### C — Company delivery (purchase)

1. Supplier party = company/distributor.
2. GRN: line items + batch/expiry on pesticides.
3. Payment: cash / bank / **udhaar to company** (`gave` on supplier side = you owe).
4. Attach photo of company **delivery note** for reconciliation.

#### D — End of day

1. Cash drawer count vs system expected cash.
2. Godown **spot check** count for top 5 SKUs (optional guided flow).
3. List tomorrow’s **expected collections** (harvest calendar).

### 1.6 Pain points → features (mapped)

| Real-world pain | Root cause | Lixar feature |
|-----------------|------------|---------------|
| “Register alag, khata alag” | Legal pesticide book vs mental udhaar | Single entry → export **pesticide register PDF** |
| Expired bottle sold | No FEFO, similar packaging | Expiry sort + block sale past date (override with owner PIN) |
| Company target miss | No running tally | `company_targets` dashboard |
| Farmer says “maine pehle pay kar diya” | Weak proof | Timeline + optional payment photo |
| Wrong cousin’s account | Duplicate names | Phone + father name + village on party |
| Cash stuck before harvest | Working capital | Seasonal **cashflow forecast** + company payable aging |

### 1.7 Integrations & ecosystem

| Partner type | Integration value |
|--------------|-------------------|
| **Engro / Fauji / Sarsabz** etc. | Import price list CSV; order templates (V2) |
| **FasalPay / bank agri finance** | Farmer eligibility flag; not core MVP |
| **WhatsApp** | Receipt, reminder, rate list broadcast to farmer groups |

### 1.8 Agri vertical — data entities (add to schema)

`Party`, `Product`, `ProductBatch`, `LedgerEntry`, `StockMovement`, `CompanyTarget`, `PesticideRegisterExport`

---

## Vertical 2 — Seasonal crops (sale & purchase)

### 2.1 Mandi ecosystem & roles

```
Farmer (cart/trailer)
    → [Optional: village agent / beopari]
        → Arthi (commission agent) OR direct buyer
            → Miller (flour/rice) / Ginning factory (cotton) / exporter
                → Textile / food industry
```

**Arthi (ارتھی):** Commission agent; provides **godown space**, weighing, buyer access, and often **advance (bheja)** to farmers — recovers from final sale. Literature describes **pakka arthi** (registered, 10–30 yrs experience) working with **kacha arthi** / brokers. Commission: fixed **% of sale** or per-bag fee — varies by commodity and mandi.

**Lixar user may be:**

* Arthi themselves
* **Independent buyer** (bypasses arthi sometimes)
* **Broker** linking farmer to mill
* **Beopari** aggregating from villages

Product should support **role tag on party**: `farmer | arthi | mill | broker | transporter`.

### 2.2 Commodities & units (critical)

| Commodity | Common unit | Notes |
|-----------|-------------|-------|
| **Wheat** | 40 kg bag standard in many mandis; **maund** (~40 kg trad.) | Moisture deduction common |
| **Rice (paddy)** | 40 kg bag; maund | Variety matters (Basmati vs coarse) |
| **Cotton (seed cotton / phutti)** | **40 kg** per maund in many reports; lint priced per **maund** separately | 2024: phutti ~7,200–8,100 Rs/40kg Punjab; lint ~17,200–18,500 Rs/maund (volatile) |
| **Maize** | 40 kg / ton | Feed mills |
| **Vegetables** | kg, crate | Perishable — daily rate |

**Never hard-code one maund weight** — `commodity.default_kg_per_maund` per business setting (37.5 vs 40 kg disputes are real).

### 2.3 Weight slip anatomy (what to digitize)

Typical **purchase from farmer** slip fields:

| Field | Urdu / local term | Purpose |
|-------|-------------------|---------|
| Gross weight | Total weight | Scale reading |
| Bag count | Bardana | Deduction per bag tare |
| Bag tare | — | Often 1–2 kg/bag or “extra bags” rule |
| Moisture % | Nasha / moisture | Deduction if above threshold |
| Grade | 1 / 2 / fair | Price multiplier |
| **Kat** | Deduction | Arbitrary or rule-based cut |
| Net weight | Payable qty | After all deductions |
| Rate | Rs per maund or per 40kg | Daily negotiated |
| **Net amount** | Payable | May be cash or udhaar |

**Dispute pattern (2024 India/Punjab press, analogous in PK):** arthi demanding **3 extra bags per 100** for “weight loss” — Lixar should store **deduction rules** as transparent line items, not one opaque number.

### 2.4 Trading workflows

#### A — Intake from farmer (purchase)

1. Create **Lot** `LOT-2026-0142` linked to farmer party.
2. Enter gross weight, bags, moisture, grade, rate → system calculates net (formula configurable).
3. Attach **photo of scale slip**.
4. Payment: cash / partial / full **udhaar** (farmer owes you nothing — **you owe farmer** if purchase; use `got` from farmer perspective inverted → track as **payable**).
5. Lot status: `open` → available for sale.

#### B — Sale to mill

1. Link one or more lots → **sale invoice** to mill party.
2. Add **arthi commission**, **loading**, **transport** as expense lines.
3. Record mill payment (often delayed) → clear receivable.
4. **Margin report:** sale − purchase − expenses per lot or per season.

#### C — Daily rate board

1. Owner sets **today’s rates** per commodity (or imports from manual entry).
2. Optional: staff read-only view for counter.
3. Historical rate chart for wheat/cotton season.

### 2.5 Season rhythm (wheat & cotton examples)

| Crop | Typical procurement window | Cash crunch |
|------|---------------------------|-------------|
| **Wheat** | Apr–Jun harvest | High cash out to farmers; mill payment 7–30 days |
| **Cotton** | Aug–Nov picking | Price volatility; ginning factory settlements |
| **Rice** | Oct–Dec (region dependent) | Moisture disputes peak |

**Season close ritual:** Mark season `closed` → lock rates, generate **P&L by commodity**, list open payables/receivables.

### 2.6 Pain points → features

| Pain | Feature |
|------|---------|
| Moisture argument | Deduction line items + slip photo |
| “Which lot was this sale from?” | Lot linkage on sale |
| Mill payment delayed | Aging on mill party |
| Multiple arthi balances | Party hierarchy or sub-accounts |
| Daily rate chaos | Rate board + timestamp on each deal |

### 2.7 Crop vertical — data entities

`Commodity`, `CommodityRate`, `Lot`, `WeightSlip`, `LotSale`, `MandiExpense`, `Season`

---

## Vertical 3 — Property & plots

### 3.1 File vs plot vs possession (legal-product model)

| Stage | What customer has | Risk level | Lixar status |
|-------|-------------------|------------|--------------|
| **File / application** | Promise of future allotment | High (scams common) | `file_booked` |
| **Balloting done** | Plot number assigned, may not possess land | Medium | `allotted` |
| **Installment plan active** | Paying society/developer | Medium | `installment_active` |
| **Possession** | Physical plot, can visit | Lower | `possession` |
| **Registry / transfer** | Title in name | Lowest (still verify) | `registered` |

**Critical:** A **file is not ownership** until statutory transfer under Transfer of Property Act 1882 / Registration Act 1908 — courts may treat file holder as **creditor** of developer, not owner. Lixar disclaimers in UI; store **society NOC / registration** refs for agent’s own compliance.

### 3.2 Land units

| Unit | Conversion (common in PK marketing) |
|------|-------------------------------------|
| 1 Marla | 225 sq ft (urban societies; verify society) |
| 1 Kanal | 20 Marla |
| 1 Acre | 8 Kanal |

Plot record: `society_id`, `block`, `plot_no`, `size_marla`, `facing` (park/corner), `file_price`, `development_charges`.

### 3.3 Payment plan anatomy (housing societies)

Typical **society installment plan** (varies widely):

| Component | Range (indicative) |
|-----------|-------------------|
| **Booking / token** | PKR 50k – 500k+ |
| **Down payment** | 10–20% of total |
| **Monthly installments** | 36–48 months common (3–4 years) |
| **Balloting fee** | Separate milestone |
| **Possession charges** | Lump sum before handover |
| **Development / utility charges** | Often surprise costs — track as schedule lines |

**Example bands (marketing pages 2024–2025):** 3 Marla monthly installments ~8,500 Rs; 1 Kanal ~55,000 Rs/month in some societies — use as **UI placeholder only**, not business logic.

### 3.4 Stakeholders & commission

```
Developer / Society
    ←→ Agent (your user) ←→ Sub-agent / broker
            ↓
        Buyer (installments)
            ↓
    Seller (if resale) / previous file holder
```

**Commission types:**

* % of plot price on booking
* Fixed per marla
* Split between senior agent and sub-agent — Lixar **commission_rules** on `Deal`

### 3.5 Deal workflows

#### A — New booking (file or plot)

1. Create `Deal` → buyer party + plot/file unit.
2. Record **token** payment → status `token_paid`.
3. Generate **installment schedule** (template: 36 monthly).
4. Attach scanned **booking form** photo/PDF.

#### B — Monthly collection

1. Dashboard: **due this week** installments.
2. Record payment → allocate to installment #N; partial payments supported.
3. WhatsApp reminder template (friendly).
4. Late fee optional line item.

#### C — Resale / transfer

1. Close buyer ledger or transfer balance.
2. New buyer assumes remaining installments (new deal linked to same unit).
3. Audit trail mandatory — never delete old deal.

#### D — Agent compliance checklist (V2)

* Society registered? (SECP / cooperative) — checkbox + doc
* NOC authority (LDA/CDA/RDA) — attachment
* On-site visit date — note

### 3.6 Scams Lixar can mitigate (UX, not legal advice)

| Scam pattern | Product mitigation |
|--------------|-------------------|
| Selling same file twice | Plot/file status `booked` blocks second booking without override |
| Fake society | Checklist + doc vault |
| “Balloting next month” forever | Milestone dates + overdue milestone alerts |
| Cash without receipt | Force receipt record or labeled “informal” with owner PIN |

### 3.7 Property vertical — data entities

`Society`, `PlotUnit`, `Deal`, `InstallmentSchedule`, `InstallmentPayment`, `BrokerCommission`, `Document`

---

## Vertical 4 — Mobile repair & sale-purchase

### 4.1 Market structure (Pakistan)

* **Bazaar shops** — repair + accessories + used phones.
* **Markets** — Hall Road (Lahore), Saddar (Karachi/Rawalpindi), etc.
* **Supply chain:** Parts from Lahore/China imports; used phones from trade-ins, imports, local assembly (Infinix, Vivo, etc.).

**Revenue streams:**

| Stream | Margin driver |
|--------|---------------|
| Repair labor | Flat fee + upsell parts |
| Parts markup | 20–100%+ on screen/battery |
| Used phone flip | Buy low, sell high — **IMEI risk** is existential |
| New phone | Thin margin + volume |
| Accessories | High turnover, low ticket |

### 4.2 PTA / DIRBS compliance (must-have for used phones)

Pakistan **PTA DIRBS** blocks unregistered devices:

| Check method | Use in shop |
|--------------|-------------|
| SMS IMEI to **8484** | Quick counter check |
| Web **dirbs.pta.gov.pk** | Dual-SIM: check both IMEIs |
| Dial *#06# | Show customer IMEI on device |

**Statuses:** Compliant / Non-compliant / Blocked / Not found (fake).

**Lixar workflow — buy used phone:**

1. Enter IMEI(s) → log check result + timestamp + optional screenshot.
2. If non-compliant → warn “PTA block risk” — require owner override to purchase.
3. Store **purchase cost**, **condition** (A/B/C), **accessories**.
4. On sale → re-check if device sat &gt;60 days (policy changes — surface disclaimer).

**IMEI cloning** is widespread — duplicate IMEI in inventory should **hard alert**.

### 4.3 Repair ticket lifecycle

| Status | Meaning | Customer comms |
|--------|---------|----------------|
| `received` | Device in shop | WhatsApp auto: received + ticket # |
| `diagnosing` | Technician checking | — |
| `waiting_parts` | Parts ordered | ETA message |
| `in_progress` | Repair started | — |
| `ready` | Fixed, awaiting pickup | “Ready for pickup” + balance due |
| `delivered` | Closed | Invoice + warranty note |
| `cancelled` | Not repairable | Return or scrap log |

**Fields per ticket:**

`ticket_no`, `customer_party`, `brand`, `model`, `color`, `imei_1`, `imei_2`, `passcode_pattern` (encrypted optional), `fault_description`, `advance_amount`, `technician_id`, `parts[]`, `labor_charge`, `warranty_days`

### 4.4 Parts inventory

| Part type | SKU examples | Link to ticket |
|-----------|--------------|----------------|
| Screens | A12 LCD, S21 OLED | BOM line on close |
| Batteries | — | — |
| Charging flex | — | — |
| Consumables | UV glue, tape | Expense or COGS |

**Reserved stock:** When status → `waiting_parts`, reserve qty so second ticket doesn’t steal part.

### 4.5 Used phone sale & trade-in

**Trade-in deal (two-legged):**

1. **Buy** used device from customer → inventory asset @ cost.
2. **Sell** new device → apply trade-in credit as line discount.
3. Net margin = (new sale + used resale value) − (new COGS + used purchase).

Track **days in inventory** for used phones — aging alert at 30/60 days.

### 4.6 Pain points → features

| Pain | Feature |
|------|---------|
| Lost phones in shop | Ticket status board + customer search |
| Technician stole part | Parts reserved + audit on ticket close |
| PTA block after sale | IMEI log at buy/sell |
| Udhaar on cases | Party khata linked to ticket |
| Warranty comeback | Reopen ticket linked to original |

### 4.7 Mobile vertical — data entities

`RepairTicket`, `DeviceAsset`, `ImeiCheckLog`, `PartSku`, `PartReservation`, `WarrantyClaim`

---

## Cross-vertical synthesis for Lixar

### Shared kernel

All four verticals need: **Party**, **Khata (gave/got)**, **Attachments**, **WhatsApp export**, **Offline outbox**, **Staff permissions**.

### Vertical-specific shells

| Shell | Default home screen | FAB action |
|-------|---------------------|------------|
| Agri | Season banner + receivable farmers + low stock | Add udhaar / sale |
| Crop | Today’s rates + open lots + payables to farmers | New weight slip |
| Property | Installments due + plot pipeline | Record payment |
| Mobile | Tickets by status + ready for pickup | New ticket |

### Onboarding question (single screen)

> “Aap ka main kaam kya hai?”  
> 🌾 Agri shop · 🌾 Mandi / crop · 🏠 Plots · 📱 Mobile repair

Sets default shell; allows “+ add another vertical” later.

---

## Persona → Module Priority Map

| Module | Agri dealer (1) | Crop trader (2) | Property (3) | Mobile shop (4) |
|--------|:---------------:|:---------------:|:------------:|:---------------:|
| Khata / Ledger | ●●● | ●●● | ●●● | ●●● |
| Billing | ●●● | ●●● | ●● (milestones) | ●●● |
| Inventory | ●●● (batch/expiry) | ● (lots) | ● (plots as units) | ●●● (parts/IMEI) |
| Cashflow | ●●● | ●●● | ●● | ●● |
| Season / commodity | ●●● | ●●● | — | — |
| Repair tickets | — | — | — | ●●● |
| Staff | ●● | ●● | ● | ●● |
| AI Assistant | ●● | ●● | ● | ●● |

---

# PRODUCT POSITIONING

**Not:**

* Accounting software (too formal, CA-oriented language)
* ERP (too heavy, long implementation)

**Instead:**

> **"Your Business Command Center"** — Roman Urdu options: *"Dukaan ka control room"* · *"Fasal se le kar plot tak — sab hisaab ek jagah"*

The app should behave like:

* **WhatsApp** simplicity — familiar list + chat-like timelines
* **Stripe** elegance — calm money UI, clear states
* **Notion** flexibility — workspaces, templates, optional depth
* **Revolut** realtime feedback — instant balance updates, celebration micro-moments

### Positioning statement (internal)

For **agri dealers, crop traders, plot dealers, and mobile shop owners in Pakistan** who manage money in registers and WhatsApp, **Lixar** is a **mobile-first business OS** that **records, reminds, and predicts** — unlike generic POS or DigiKhata alone, Lixar is built for **seasonal udhaar, batch/expiry stock, commodity slips, plot installments, and repair tickets** with **voice-first Urdu entry**.

### Messaging pillars

1. **Yaad rakhega** — Farmer udhaar, plot installment, repair advance — nothing lost after harvest.
2. **Season samjhta hai** — Kharif/Rabi alerts, expiry, mandi rates (where enabled).
3. **Aapki zubaan** — *"2 litre spray udhaar"*, *"40 maund gehun"*, *"plot token 50 hazar"*.

---

# EXPERIENCE PHILOSOPHY

## 1. Reduce Anxiety

Small businesses constantly fear:

* Losses
* Debt
* Forgetting payments
* Inventory mismatch

The UI must:

* Calm users — soft colors for debt (not aggressive red walls); use **warn** amber sparingly
* Simplify numbers — show **You'll receive** / **You'll pay** nets (see `khata.jsx` summary band)
* Surface critical actions only — max 3 primary CTAs on dashboard

**Design tactics:**

| Anxiety source | UI response |
|----------------|-------------|
| Large overdue | Progressive disclosure: total → top 3 → full list |
| Negative cashflow | Explain in plain language + one suggested action |
| Complex reports | Narrative first, table second |

---

## 2. Replace Manual Thinking

The app should think for users.

**Examples (vertical-specific):**

* Agri: *"Cotton spray season starts in 10 days — Karate stock sirf 8 litre."*
* Agri: *"3 farmers overdue after harvest — total Rs 1.2L."*
* Crop: *"Is hafte wheat purchase margin 4% kam — rate check karein."*
* Property: *"Block B mein 2 plots token due this week."*
* Mobile: *"5 phones 'ready' status — customers ko WhatsApp bhejein."*

**Insight card schema (from prototypes):**

```ts
type Insight = {
  tone: 'warn' | 'pos' | 'info';
  title: string;      // Short headline
  body: string;       // One sentence + optional number
  action?: {           // Optional CTA
    label: string;    // e.g. "WhatsApp pe reminder bhejein"
    deepLink: string;
  };
};
```

**Rules for insights:**

* Max **5** active insights on home; rotate stale ones.
* Every insight must link to **one action** or be dismissible.
* No insight without a **verifiable data source** (avoid hallucinated finance).

---

## 3. Minimize Typing

Typing is friction on small screens and for users with low literacy comfort.

**Replace with:**

* Voice
* Templates
* Suggestions
* OCR
* Smart defaults

**Input hierarchy (prefer top):**

1. Voice → structured entity extraction
2. Tap template (“Udhaar diya”, “Paisa mila”)
3. Select from recent parties / products
4. Scan barcode / OCR bill
5. Manual numeric keypad (large buttons)
6. Free text (last resort)

---

## 4. Additional principles (expanded)

### Trust through transparency

Every balance change shows: **who entered it, when, on which device** (for disputed entries).

### Forgiving mistakes

* Edit with audit log, not silent overwrite.
* Soft delete with 30-day restore for owners.
* “Undo last entry” snackbar for 10 seconds after save.

### Cultural fit

* **Udhaar** vs **advance** clearly labeled (`gave` / `got` in prototype).
* Shareable **ledger card** image for WhatsApp (branded, readable).
* Friday / month-start patterns for reminders (respect prayer times — no push 12:30–14:00 optional setting).

---

# COMPLETE MODULE BRAINSTORMING

Each module below includes: **Goals**, **User stories**, **Flows**, **Data model sketch**, **Edge cases**, **Integrations**, **MVP vs V2**.

---

# MODULE 1 — AUTH & IDENTITY SYSTEM

## Goals

* Fast onboarding (&lt; 60 seconds to first value)
* Trust building (verified phone, device trust)
* Multi-device sync
* Fraud prevention

---

## User Stories

| ID | As a… | I want… | So that… |
|----|-------|---------|----------|
| A1 | New owner | Sign up with phone OTP | I don't need email |
| A2 | Owner | Use Google/Apple on tablet | Faster login at counter |
| A3 | Owner | See unknown device login | I can block theft |
| A4 | Owner | Switch between businesses | I manage two shops |
| A5 | Staff | Login with PIN under owner account | I don't see owner's other businesses |

---

## Flow

### Login Options

* Phone OTP (primary)
* WhatsApp OTP (delivery via WhatsApp Business API — same number familiarity)
* Google login
* Apple login

**OTP flow (detailed):**

```
1. Enter phone (+92 normalization)
2. Request OTP → rate limit 3/hour/IP/device
3. Enter 6-digit OTP → issue access + refresh tokens
4. If new user → minimal profile (name optional)
5. If no business → Business setup wizard (name, type, currency)
6. Register device fingerprint → trust score baseline
```

### Device Intelligence

Track:

* Device name, model, OS version
* Login location (coarse — city level; precise only with permission)
* IP / ASN risk signals
* Prior session count, failed OTP attempts

**Risk score factors:**

| Signal | Weight |
|--------|--------|
| New device + new city | High |
| Rooted/jailbroken device | Medium |
| Emulator | High |
| VPN datacenter IP | Medium |

---

## Advanced Ideas

### Trusted Device System

* Unknown device → push + SMS to owner: “Approve login?”
* Session approval flow with 15-minute expiry
* Revoke all sessions from Settings

### Business Profiles

User can own:

* Multiple shops
* Multiple brands
* Multiple warehouses

**Data model sketch:**

```
User
  └── BusinessUser (role: owner | admin | staff)
        └── Business
              ├── branches[]
              └── subscription_plan
```

### Session & security (implementation notes)

* **Access token:** short-lived (15 min), in memory.
* **Refresh token:** rotation on use; stored in `flutter_secure_storage`.
* **Staff PIN:** scoped to `branch_id` + permission set; no refresh token export.

---

## MVP vs V2

| MVP | V2 |
|-----|-----|
| Phone OTP, 1 business | Multi-business switcher |
| Single device trust | Full device approval flow |
| Email optional | WhatsApp OTP |
| Biometric app lock | SSO for enterprise |

**Lixar repo today:** `auth_service.dart`, `session_provider.dart`, Laravel Fortify — extend with `business_id` claim in JWT.

---

# MODULE 2 — BUSINESS WORKSPACE SYSTEM

Think:

> **Slack workspace + banking account** — isolated data, shared patterns.

---

## Workspace Structure

```
Business (tenant root)
  └── Branch (physical location)
        └── Team (optional grouping)
              └── User + Role
                    └── Permissions (granular)
```

**Isolation rule:** All queries include `business_id`; branch-scoped data also filters `branch_id` unless user has `cross_branch_read`.

---

## Features

### Multi-Branch Switching

Instant switch between:

* Main branch
* Warehouse
* Outlet

**UX:** Business switcher sheet (prototype: `showBizSwitcher`) — avatar, name, role badge, last active.

**State:** Persist `active_branch_id` in Hive; sync to server on change.

### Branch Metrics

Compare:

* Sales
* Expenses
* Recovery
* Profitability

**Comparison view:** Small multiples chart per branch; tap branch → drill to branch dashboard.

### Roles (suggested)

| Role | Typical user | Capabilities |
|------|--------------|--------------|
| Owner | Proprietor | All + billing plan + delete business |
| Admin | Manager | All except delete business / billing |
| Cashier | Counter staff | Sales, khata entry, no reports export |
| Inventory clerk | Stock room | Stock in/out only |
| Accountant (read) | External CA | Read-only reports + export |

---

## Edge Cases

* User removed from business mid-session → force logout with message.
* Branch deleted with open stock → block until transfer or write-off workflow.
* Clock skew across devices → use server `created_at` for ordering; client clock for display only.

---

# MODULE 3 — SMART DASHBOARD

The dashboard should **NOT** be static.

It should behave like:

> **AI-generated mission control** — prioritized, actionable, calm.

---

## Dashboard Layers

### Layer 1 — Critical Alerts

Highest priority (push + pinned card):

* Overdue payments (amount &gt; threshold or &gt; N days)
* Negative cashflow (projected 7-day)
* Low stock (below reorder point)
* Staff absence (if attendance enabled)

**Alert priority algorithm (draft):**

```
score = (amount_normalized * 0.4) + (days_overdue * 0.3) + (stockout_risk * 0.2) + (user_pin * 0.1)
```

### Layer 2 — Today's Business

* Today's revenue (cash + credit sales + collections)
* Today's expenses
* Cash balance (opening + net today)
* Collections (payments received against udhaar)

**Prototype reference:** `ACTIVITY` feed on home — sale, expense, payment kinds.

### Layer 3 — AI Insights

Examples:

* Agri: *"Is hafte spray sales pichle hafte se 18% up — Karate 1L fast mover."*
* Crop: *"Wheat rate mandi mein 2% up — open lots ka margin check karein."*
* Property: *"3 installments overdue in Block B — total Rs 450,000."*
* Mobile: *"Technician Imran ne sab se zyada repair margin diya."*

**Guardrails:** Insights require minimum 30 days data or labeled as “early estimate.”

### Layer 4 — Action Recommendations

CTA cards:

* Send reminders
* Restock items
* Recover dues

Each card: **one primary button**, optional secondary “Later.”

---

## FUTURISTIC IDEAS

### Predictive Dashboard

Tomorrow prediction:

* Expected sales (moving average + weekday seasonality)
* Expected collections (based on overdue aging curve)
* Inventory shortages (days-of-cover)

**Model v1:** Heuristics, not ML.  
**Model v2:** Per-business time series with fallbacks for sparse data.

### Business Health Score

Score: **0–100**

Calculated from:

| Factor | Weight | Signal |
|--------|--------|--------|
| Recovery efficiency | 25% | Collected / due in 30d |
| Cashflow stability | 25% | Variance of daily net |
| Stock turnover | 20% | COGS / avg inventory |
| Expense discipline | 15% | Opex / revenue trend |
| Growth | 15% | Revenue YoY or 90d trend |

**UX:** Circular gauge + “What improved / hurt score” expandable list.

---

## Dashboard Personalization

* Pin modules (Khata summary, Cashflow river, Top products).
* Hide modules staff shouldn't see (profit margin for cashiers).

---

# MODULE 4 — KHATA / LEDGER SYSTEM

This is the **emotional core**.

Most users come for:

> **"Who owes me money?"** — *Mujh se kon kitna lekar baitha hai?*

---

## Ledger Philosophy

**Traditional ledger apps:** Transaction-first (rows in a table).

**New system:** Relationship-first.

Each **Party** (customer/supplier/both) becomes:

* Financial profile (balance, aging, limits)
* Trust profile (payment history, disputes)
* Behavioral profile (visit frequency, avg ticket, preferred products)

### Party types

| Tag | Balance sign | Meaning |
|-----|--------------|---------|
| Customer | + | They owe you (receivable) |
| Supplier | − | You owe them (payable) |
| Both | ± | Net position per branch |

**Prototype:** `PARTIES` with `balance`, `tag`, `overdue`, `txns[]`.

---

## Customer Intelligence Layer

### Metrics (per party)

| Metric | Calculation | Use |
|--------|-------------|-----|
| Total purchases | Sum credit sales | LTV proxy |
| Average delay | Mean(days to pay) | Reminder timing |
| Payment consistency | % invoices paid within terms | Risk tier |
| Recovery risk | 0–100 score | Auto reminder aggressiveness |
| Profit contribution | Revenue − COGS (if cost linked) | Prioritize collection |

### Risk tiers

| Tier | Behavior | System behavior |
|------|----------|-----------------|
| Green | Pays within 7 days | Friendly reminders only |
| Amber | 8–30 days late pattern | Weekly auto reminder |
| Red | &gt;30 days or spike in credit | Owner alert + strict template |

---

## Ledger Timeline

**Not** table-based primary UI.

**Instead:**

* WhatsApp-like timeline
* Rich cards per entry (`gave` / `got`)
* Voice notes attachment
* Images (product photo, handwritten slip)
* PDF receipts

**Entry card fields:**

```
- kind: gave | got
- amount (PKR)
- note (free text)
- category: Sales | Inventory | Cash | Expense | Other
- at (timestamp, humanized)
- created_by (staff name)
- attachments[]
```

---

## Smart Entries

### Voice Input

**Examples (Roman Urdu) by vertical:**

| Vertical | Voice example | Extracted |
|----------|---------------|-----------|
| Agri | *"Rashid ko 2 litre karate spray udhaar"* | party, product, qty, unit, gave |
| Agri | *"Urea 2 bori Malik ko cash"* | product, qty, party, got/cash sale |
| Crop | *"Ali ne 40 maund gehun becha rate 9500"* | party, commodity, qty, rate, sale |
| Property | *"Society Block A plot 12 token 50 hazar mila"* | plot ref, milestone, got |
| Mobile | *"Samsung A12 screen 4500 advance 2000"* | device, service, amount, partial got |

**AI extraction pipeline:**

```
Audio → STT (Urdu) → LLM structured output → { party, amount, type, category, product_or_commodity?, qty?, unit? }
→ Fuzzy match party / SKU → Confirm sheet → Save
```

**Disambiguation:** If multiple “Bilal” parties → picker with phone last 4 digits.

### OCR Receipts

Camera scans:

* Printed bills
* Handwritten kachcha slips
* Supplier invoices

**Output:** Line items optional; minimum viable = total + vendor + date.

### AI Categorization

Auto-detect:

* Inventory sale
* Expense
* Supplier payment

User can override; override feeds learning (per business, not global PII).

---

## Recovery Engine

### Smart Reminder System

**Reminder personality options:**

| Tone | Sample (Roman Urdu) |
|------|---------------------|
| Friendly | "Assalam o Alaikum Ali bhai, yaad dilana tha ke Rs 18,200 baqi hain. Jab convenient ho." |
| Professional | "Invoice #2041: Rs 18,200 due on 14 Mar. Payment link: …" |
| Strict | "Overdue 3 days: Rs 18,200. Please clear today to avoid hold on credit." |

### Recovery Automation

* Auto WhatsApp reminders (schedule: Tue/Thu 10am local)
* Voice call reminders (IVR or recorded — regulatory check)
* QR / Raast payment request embedded in message

### Risk Engine

Detect:

* Late payment patterns (rolling 90d)
* Fraud indicators (balance up without matching stock/sales)
* Unusual credit increases (&gt;2× historical avg ticket)

**Actions:** Flag to owner only; never auto-block customer without confirmation (relationship risk).

---

## Khata User Flows (step-by-step)

### Flow A — Quick udhaar from home FAB

```
FAB → "Udhaar / Paisa" sheet → Select party (recent first)
→ Amount keypad → Optional note → Category default Sales
→ Save → Toast + update party balance → Optional WhatsApp share card
```

### Flow B — Party detail settlement

```
Khata list → Party → Timeline → "Paisa mila" → Amount
→ Allocate to open invoices (FIFO) or general balance
→ Receipt generated
```

### Flow C — Statement export

```
Party → ⋮ menu → "Statement (PDF)" → Date range
→ PDF with logo, transactions, opening/closing balance
→ Share via WhatsApp
```

---

## Data Model (relational sketch)

```sql
parties (id, business_id, name, phone, tags[], credit_limit, risk_tier, ...)
ledger_entries (id, party_id, branch_id, kind, amount, category, note, created_at, created_by, device_id, sync_id)
ledger_attachments (entry_id, url, type)
reminder_schedules (party_id, tone, channel, cron_expression, paused_until)
```

**Balance:** Materialized `party.balance` updated transactionally, reconciled nightly with sum(entries).

---

## Edge Cases

| Case | Handling |
|------|----------|
| Partial payment | Split allocation across invoices; remainder on account |
| Customer dispute | Mark entry `disputed`; freeze reminders |
| Wrong party | Transfer entry to another party (audit) |
| Negative balance on customer | Treat as advance; apply to next sale |
| Offline duplicate entry | Sync merge by `client_uuid`; if conflict, show merge UI |

---

## MVP vs V2 — Khata

| MVP | V2 |
|-----|-----|
| Parties, gave/got, balance, search, filters | Voice entry, OCR |
| Manual WhatsApp share image | Auto WhatsApp API reminders |
| Overdue flag manual + simple rule | ML risk score |
| Timeline UI | Voice notes on timeline |

---

# MODULE 5 — CASHFLOW ENGINE

Most SMEs fail because:

> **Cash disappears silently** — not because they lack revenue.

---

## Core Philosophy

Every rupee must have:

* **Source** (sale, loan, owner injection)
* **Destination** (expense, supplier, withdrawal)
* **Reason** (category + optional party link)

---

## Cashflow Layers

### Daily Cash

Track:

* Opening balance (counted cash + bank snapshot optional)
* Closing balance
* Variance (books vs physical count)

**Daily close ritual (UX):**

```
Prompt at configurable time (e.g. 21:00):
"Drawer mein kitna cash hai?" → Enter amount
→ Show variance vs expected → If |variance| > threshold, ask reason
```

### Expense Intelligence

Categorize:

* Operational (rent, utilities, wages)
* Personal leakage (flag if tagged personal from business account)
* Supplier payments
* Utilities

**Leakage detection heuristics:**

* Same amount repeated daily without category
* Expense spike &gt; 2σ from 30-day mean
* Round-number withdrawals on non-paydays

### Cashflow Visualization

**Prototype:** `CASHFLOW_30` — 30-day in/out river chart.

**Interactions:** Tap day → transactions list; pinch to 7d / 90d.

---

## Integration with Khata

* Collection (`got`) increases cash-in.
* Credit sale (`gave`) does **not** increase cash until payment recorded.
* Expense module posts to cash-out directly.

---

## MVP vs V2

| MVP | V2 |
|-----|-----|
| Manual expense + daily summary | Auto bank feed (Open Banking) |
| Simple categories | Leakage AI flags |
| Cash in/out chart | Forecast + scenarios |

---

# MODULE 6 — INVENTORY OPERATING SYSTEM

Evolve beyond **"stock count"** into **supply intelligence engine** — with **four inventory modes** matching core verticals.

---

## Inventory modes by vertical

| Mode | Vertical | What is tracked | Key fields |
|------|----------|-----------------|------------|
| **Agri SKU** | Pesticide / khaad / spray | Bags, bottles, cartons | Batch, expiry, active ingredient, season tag |
| **Commodity lot** | Crop trade | Open lots, not fixed SKU | Commodity, grade, weight slip, mandi rate |
| **Plot unit** | Property | Plot #, block, marla/kanal | Status pipeline, not qty decrement |
| **Device & parts** | Mobile | Phones + spare parts | IMEI/serial, condition, repair BOM |

---

## Inventory Layers

### Basic Layer

* Products, categories, variants, units (**bori, kg, litre, maund, piece, kanal**)
* Buy price, sell price, margin display
* SKU / barcode; for agri — **company SKU** vs local nicknames ("choti bottle")

**Agri catalog example (replace generic cooking-oil prototypes):**

| SKU | Name | Unit | Notes |
|-----|------|------|-------|
| PEST-KRT-1L | Karate 1L | litre | Kharif cotton |
| FERT-UREA-50 | Urea 50kg | bag | High velocity |
| EQ-SPRAY-16L | Sprayer 16L | piece | Low expiry concern |

**Prototype note:** Update `PRODUCTS` in `data.jsx` from kiryana items to agri SKUs for demos.

### Operational Layer

* **Batch + expiry** (mandatory for pesticides; recommended for fertilizer bags with season)
* FEFO pick suggestions at billing ("pehle purani expiry")
* Purchase history per **company** (Syngenta, FMC, local distributor)
* Supplier mapping (default vendor per SKU)
* **Spray season calendar** — link products to Kharif/Rabi windows
* **Commodity lots** for crop traders — link purchases to sales for margin
* **Plot status** for property — not traditional stock decrement
* **Repair BOM** — parts reserved against ticket ID

### Intelligence Layer

* Fast-moving stock (velocity score)
* Dead inventory (no sale in N days)
* Predicted shortages (days of cover &lt; lead time)
* Margin analytics (realized margin after discounts)

---

## Product Intelligence

Per-product analytics:

| Metric | Formula / source |
|--------|-------------------|
| Profit generated | Σ(qty × (sell − buy)) − returns |
| Sales frequency | Units / day (7d EMA) |
| Customer preference | Parties buying SKU &gt;2× |
| Seasonal trends | YoY same month (needs 12mo data) |

---

## Barcode Ecosystem

### Support

* QR codes (internal SKU)
* Custom SKUs
* Bluetooth scanners (HID keyboard mode — no SDK required)
* Camera scan (mobile)

### POS mode (tablet)

* Cart on left, catalog grid on right
* Scan adds line; swipe to remove
* Checkout → invoice + optional khata if unpaid

---

## Advanced Ideas

### Smart Shelf Mode

Camera detects:

* Missing products (compare shelf photo to planogram — V3+)
* Shelf gaps

**Reality check:** High CV complexity; pilot in controlled stores only.

### AI Restock Prediction

```
reorder_point = (avg_daily_sales × lead_time_days) + safety_stock
safety_stock = z × σ_daily_sales × sqrt(lead_time)
```

Suggest PO quantity to hit target days of cover (e.g. 14 days).

---

## Stock ↔ Ledger linkage

| Event | Inventory | Khata |
|-------|-----------|-------|
| Cash sale | −stock | Optional party if account customer |
| Udhaar sale | −stock | +party balance |
| Purchase on credit | +stock | −supplier balance |
| Stock adjustment | ±stock | Optional expense/inventory loss |

---

## MVP vs V2 — Inventory

| MVP | V2 |
|-----|-----|
| Agri SKU: products, stock in/out, low stock | Batch/expiry FEFO (pesticide) |
| Link to invoice line items | Season reorder (Kharif/Rabi) |
| — | Commodity lots (crop trader) |
| — | Plot status registry (property) |
| — | IMEI + repair BOM (mobile) |
| Manual reorder list | AI reorder by season forecast |

---

# MODULE 7 — BILLING SYSTEM

Invoices should feel:

> **Elegant and premium** — slips farmers, mills, and buyers trust (agri bill, weight slip, plot receipt, repair invoice).

---

## Invoice Builder UX

### UX Goals

* Fast (&lt; 30s for repeat customer)
* Thumb-friendly (primary actions bottom 40%)
* Minimal typing (search, scan, recent items)

### Features

#### Smart Customer Detection

Typing `"R"` suggests:

* Rashid Farmer
* Rashid Agro (supplier)

Rank by: recency, frequency, branch match.

#### Dynamic Product Search

Search by:

* SKU
* Barcode
* Name (Urdu/English fuzzy)

#### Invoice types by vertical

| Vertical | Document style | Typical lines |
|----------|----------------|---------------|
| Agri | Retail tax invoice / simple bill | SKU, qty (L/bori), batch ref optional |
| Crop | **Weight slip + purchase/sale note** | Commodity, gross weight, deductions, rate/maund, net |
| Property | **Milestone receipt** | Plot ID, token/installment #, due date, balance |
| Mobile | **Repair ticket → invoice** | Labor, parts, IMEI; or phone sale with serial |

#### Invoice States

| State | Meaning | Transitions |
|-------|---------|-------------|
| Draft | Not finalized | → Pending |
| Pending | Sent / awaiting payment | → Paid, Partial, Overdue |
| Paid | Settled | — |
| Partial | Some payment received | → Paid |
| Overdue | Past due date | → Paid, Partial |

**Prototype:** `INVOICES` with `status`, `dueIn`.

#### Payment Links

Each invoice generates:

* QR code (Raast / gateway)
* Payment link (hosted page, mobile-optimized)
* Deep link back to app on success → auto-mark Paid

---

## Invoice Document Model

```
Invoice
  - id (human: INV-2042)
  - party_id
  - line_items[] { product_id, qty, unit_price, discount }
  - subtotal, tax, total
  - status, issued_at, due_at
  - payments[] { amount, method, ref, at }
```

**Tax (Pakistan context):** Optional GST fields; business setting for registered vs unregistered.

---

## Advanced Ideas

### Conversational Invoice Creation

User says:

> "Rashid ko invoice — 2 litre karate, 1 Urea bori"
> "40 maund gehun Ali se khareeda — rate 9500"

→ Resolve party + product + default price → confirm sheet.

### AI Upselling

Suggest:

* Related products (bought together &gt;30% of time)
* Bundles (owner-defined)

**Constraint:** Never add items without explicit confirm tap.

---

## MVP vs V2 — Billing

| MVP | V2 |
|-----|-----|
| Create invoice, PDF/share, statuses | Payment link + auto reconcile |
| Link to khata balance | Conversational create |
| Line items from catalog | Tax reports |

---

# MODULE 8 — PAYMENTS & FINTECH

This module becomes:

> **Financial infrastructure layer** — not a separate app.

---

## Payments Ecosystem

### Integrations (Pakistan-first)

| Rail | Use case | Priority |
|------|----------|----------|
| Raast (P2P / QR) | Instant collection | P1 |
| JazzCash / Easypaisa | Wallet pay | P1 |
| Card gateway | Online invoices | P2 |
| Bank transfer (manual confirm) | B2B | MVP |
| Stripe-like | Export markets later | P3 |

### Features

#### Smart Collections

Customer receives:

* Payment link
* QR code
* Auto reminders with embedded pay CTA

#### Wallet Layer (V2+)

Business wallet:

* Internal transfers between branches
* Cashback campaigns (partners)
* Supplier payouts batch

**Compliance:** Partner with licensed EMI/bank; no unlicensed custody of customer funds.

---

## Future Fintech Expansion

### Embedded Lending

Underwrite using:

* Cashflow stability (6mo)
* Recovery rate
* Sales consistency

**Products:** Working capital, invoice financing, stock financing.

### Supplier Credit Scoring

Enable **BNPL for shops** to buy inventory — revenue share with distributors.

---

## Reconciliation

```
Payment webhook → match invoice_id or party_id + amount
→ If partial, update invoice Partial
→ Post ledger `got` entry
→ Notify owner push: "Ali ne Rs 5,000 bheje"
```

---

## MVP vs V2 — Payments

| MVP | V2 |
|-----|-----|
| Manual "mark paid" + record method | Raast QR on invoice |
| Share payment instructions text | Webhook auto reconcile |
| — | Business wallet |

---

# MODULE 9 — REPORTING & ANALYTICS

Most reports today are:

* Ugly
* Hard to understand
* English-heavy

---

## New Philosophy

Reports should:

* **Explain** — narrative headline
* **Predict** — next 7/30 days (when enough data)
* **Recommend** — one action per insight

---

## Report Types

### Financial

* Revenue (cash vs credit)
* Expenses by category
* Net profit (gross − COGS − opex)
* Cashflow statement (simplified)

### Operational

* Inventory turnover
* Branch performance
* Staff productivity (sales per shift)

### Customer Intelligence

* Top customers (revenue, margin)
* High-risk customers (aging, risk tier)
* Lifetime value (simple cumulative)

---

## AI REPORTS

Examples:

* "Your margin fell because Urea purchase rate increased 8% this month."
* "Cotton spray SKUs dead stock — 6 bottles expired last Rabi."
* "Inventory dead stock increased 12% — 6 SKUs with no sale in 45 days."

**Format:** Title + 2 sentences + `[View details]` + `[Take action]`.

---

## Export & sharing

* PDF (A4 + thermal 80mm templates)
* Excel for accountant (CSV minimum viable)
* Scheduled weekly WhatsApp summary (opt-in)

---

## MVP vs V2

| MVP | V2 |
|-----|-----|
| P&L simple, aging, stock valuation | AI narrative reports |
| PDF export | Scheduled delivery |
| — | ClickHouse real-time analytics |

---

# MODULE 10 — STAFF & OPERATIONS

SMEs struggle with:

* Staff accountability
* Attendance fraud
* Payroll confusion

---

## Features

### Staff Profiles

* Role, branch assignment
* Attendance history
* Salary + advances (khata-style staff due)
* Performance: sales attributed at POS

**Prototype:** `STAFF` with `due`, `attendance`, `salary`.

### GPS Attendance (optional)

* Geo-fenced check-in (100–200m radius)
* Photo selfie optional (privacy toggle)
* Offline check-in → sync with server timestamp

**Ethics:** Inform staff; comply with local labor law.

### Operational Monitoring

Track:

* Sales by staff member
* Cash handled vs drawer variance
* Error rate (voided invoices, deleted entries)

---

## Permission Matrix (granular)

| Permission | Owner | Admin | Cashier | Inventory | Accountant |
|------------|:-----:|:-----:|:-------:|:---------:|:----------:|
| View reports | ✓ | ✓ | — | — | ✓ |
| Create invoice | ✓ | ✓ | ✓ | — | — |
| Delete ledger entry | ✓ | ✓ | — | — | — |
| Adjust stock | ✓ | ✓ | — | ✓ | — |
| Export data | ✓ | ✓ | — | — | ✓ |
| Manage staff | ✓ | ✓ | — | — | — |

Implement as **RBAC** JSON on `BusinessUser`; enforce API + UI.

---

## Payroll flow (V2)

```
Month end → compute base + commission − advances
→ Owner approves → Mark paid → Expense entry + staff khata cleared
```

---

# MODULE 11 — AI ASSISTANT

This becomes:

> **The brain of the platform** — not a gimmick chatbot.

---

## AI Interaction Modes

### Chat

Examples:

* "How much pending payment today?"
* "Top 3 customers by pending?"
* "Karate 1L stock kitni hai?"
* "Is season cotton lot ka total margin?"
* "Block A mein kitne plots booked hain?"
* "Ready repair phones kaun se hain?"

**Prototype:** `CHAT_SEED` in `data.jsx`.

**Architecture:**

```
User message → Intent classifier → Tool router → {
  query_ledger, query_stock, generate_report, draft_reminder
} → Natural language response + optional chart spec
```

### Voice

Urdu / Hindi / Punjabi voice assistant — same tool router after STT.

### Smart Actions (with confirmation)

AI can **propose**, user **confirms**:

* Generate invoice draft
* Send reminders (preview message)
* Create expense from voice

**Never** auto-send money or delete data without confirm.

---

## AI MEMORY

Learns **per business** (encrypted, tenant-isolated):

* Business hours and peak days
* Seasonal cycles (Ramadan, Eid, wedding season)
* Customer behavior aggregates (not cross-tenant)

**Retention:** User can reset AI memory in Settings.

---

## Safety & quality

* Tool calls only on **read** data unless explicit write confirm.
* Rate limits on LLM to control cost.
* Fallback: “I couldn't find that — try opening Khata.”

---

# MODULE 12 — NOTIFICATION SYSTEM

Notifications should **NOT** annoy users — they should **earn** attention.

---

## Priority Levels

### Critical (immediate push)

* Overdue invoices &gt; threshold
* Low cash balance (&lt; user-defined floor)
* Failed sync / security alert

### Important (batched 2× daily)

* Stock warnings
* Pending approvals (large credit sale)

### Passive (weekly digest)

* Weekly business summary
* Health score change

---

## Channels

| Channel | Use |
|---------|-----|
| Push (FCM) | Time-sensitive |
| In-app inbox | Full history |
| SMS | OTP, critical security only |
| WhatsApp | Reminders to **customers**, not spam to owner |

**Quiet hours:** Default 22:00–08:00; respect Ramadan optional schedule.

---

## Notification content template

```
Title: Rs 76,800 overdue — Shahzad Cloth
Body: 8 days past due. Tap to send reminder.
Action: SEND_REMINDER | SNOOZE_3D | VIEW_PARTY
```

---

# MODULE 13 — OFFLINE-FIRST ENGINE

Critical for Pakistan / India markets.

---

## Requirements

### Must Work Offline

* Ledger entries (with `client_uuid`)
* Billing (draft + finalized queue)
* Inventory updates
* Party create/edit (merge on sync)

### Online-only (graceful degradation)

* Payment link generation
* AI assistant (cache last 5 Q&A optional)
* Multi-device real-time sync display

---

## Sync Engine

### Architecture

```
Local (Hive)
  └── Outbox table: { entity, payload, op, client_uuid, created_at }
        ↓ on connectivity
API batch ingest → server validates → returns ack / conflict
        ↓
Update local entity version + clear outbox
```

### Conflict resolution

| Scenario | Resolution |
|----------|------------|
| Same entry edited on two devices | Last-write-wins with audit **or** owner merge UI if amounts differ |
| Delete vs edit | Delete wins if owner; else flag |
| Stock negative conflict | Server rejects; client shows “stock insufficient” |

**Timestamp:** Server `updated_at` authoritative; display local time with timezone.

### Sync UX

* Subtle status: “Synced” / “Pending (3)” / “Offline”
* Manual “Sync now” in settings
* Failed sync → retry exponential backoff

**Lixar repo:** `HiveService`, `internet_connection_service.dart` — extend with outbox pattern.

---

# MODULE 14 — TRUST & SECURITY

Trust is **EVERYTHING** in fintech and udhaar.

---

## Security Features

### Authentication

* PIN (staff)
* Biometrics (owner quick unlock)
* Session management (device list, revoke)

### Financial Security

* Fraud scoring on new devices + large transactions
* Unusual activity detection (e.g. bulk delete at 3am)
* Velocity limits on credit sales per party per day

### Data protection

* Encryption at rest (server), TLS in transit
* `flutter_secure_storage` for tokens
* Optional E2E for attachments (V3)

---

## Audit Trails

Every mutation logs:

```
audit_log {
  actor_id, business_id, branch_id,
  entity_type, entity_id,
  action: create | update | delete,
  before_json, after_json,
  device_id, ip, at
}
```

**Owner UI:** “History” on ledger entry and invoice.

---

## Compliance checklist (Pakistan-oriented)

* User consent for SMS/WhatsApp
* SBP / PTA awareness for payment partners
* Data localization preference for enterprise tier
* Right to export and delete account (GDPR-style best practice)

---

# MODULE 15 — SUPER APP EXPANSION

Future direction:

> **Business ecosystem platform**

---

## Future Modules

### Commerce

* Online store (catalog sync from inventory)
* B2B marketplace (discover suppliers)

### Logistics

* Delivery tracking
* Rider management + COD reconciliation

### Procurement

* Supplier ordering from reorder suggestions
* Group buying across merchants

### Banking

* Business accounts
* Debit cards tied to wallet

**Strategy:** Only expand after **core loop** retention proven: Khata → Remind → Collect → Repeat.

---

# UX SYSTEM BRAINSTORMING

Aligned with `DOCs/project/theme.jsx` and Lixar Khata prototypes.

---

## DESIGN LANGUAGE

### Interface Feel

* Premium **dark mode** default (emerald accent — prototype `palette: emerald`)
* High readability (contrast ≥ WCAG AA for body text)
* Large spacing (touch targets ≥ 48dp)
* Floating surfaces (cards, sheets — `borderRadius: 22`)

### Color semantics

| Token | Use |
|-------|-----|
| `pos` / green | Money in, receivable, success |
| `neg` / red | Payable, loss, overdue |
| `warn` | Amber alerts, low stock |
| `accent` | Primary CTA, active chips |

---

## Motion Design

### Motion Rules

* Instant feedback (&lt; 100ms) on button press
* Soft spring physics on sheets (Reanimated / `flutter_animate`)
* Minimal animation fatigue — no parallax on lists

**Meaningful motion:** Balance number animates on payment received; confetti only on milestone (first 100% recovery week).

---

## Typography System

### Numeric Focus

* Monospace or tabular figures for amounts (`FONT_MONO` in prototype)
* Currency symbol prefix: **Rs** with space (`Rs 18,200`)
* Larger font for primary KPI (22–28sp)

### Bilingual

* UI strings in `easy_localization` — `en`, `ur` (Roman), future `ur-Arab`
* Numbers always Western digits for alignment

---

## FUTURISTIC UX IDEAS

### Dynamic Island Notifications (iOS / Android live activity)

Realtime: “Rs 5,000 received from Rashid Farmer.”

### AI Command Bar

Like Linear / Raycast:

```
User types: "Show overdue customers"
→ Instant filtered khata list + total
```

**Keyboard shortcut on tablet:** `Cmd+K` equivalent.

### Contextual FAB

FAB changes by screen (prototype `onFab` logic):

| Screen | FAB action |
|--------|------------|
| Home | Add entry |
| Khata | Add entry |
| Inventory | Open scanner |
| Invoice | New invoice |

---

## Component library (Flutter mapping)

| Prototype | Flutter target |
|-----------|----------------|
| `Pressable`, `IconButton` | `AppButton`, ink well |
| `ScreenHeader` | `AppTopBar` |
| `TextInput` | `AppTextField` |
| `PartyCard` | Feature widget in `features/khata/` |
| Toast | `show_toast.dart` |

---

# PLATFORM STRATEGY

## Mobile First

**Primary device:** Android low-end phones (API 24+).

**Performance budget:**

* APK size &lt; 40 MB initial
* Lazy-load AI models
* Image compression on upload

**Current stack:** Flutter 3.5+, Riverpod, Hive CE, GoRouter — see `Mobile/pubspec.yaml`.

---

## Tablet Support

Designed for:

* Counters (landscape POS)
* Split view: cart + catalog
* Larger typography mode auto-enabled

---

## Web Dashboard

For:

* SMEs (owner overview)
* Accountants (read-only + export)
* Admins (staff, billing plan)

**Stack:** Laravel + Inertia — reuse API, no duplicate business logic.

---

# TECHNICAL BRAINSTORMING

## Suggested Architecture (detailed)

### High-level diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Flutter Mobile │     │   Web (Inertia) │     │  Partner APIs   │
│  Hive + Outbox  │     │   React/Vue     │     │  WhatsApp, etc. │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │   Laravel API (core)   │
                    │   Auth, CRUD, Webhooks │
                    └────────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   PostgreSQL    │   │  Redis          │   │  S3-compatible  │
│   (tenant data) │   │  cache, queues  │   │  attachments    │
└─────────────────┘   └────────┬────────┘   └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
           ┌─────────────────┐       ┌─────────────────┐
           │ Go microservices│       │  Worker queue   │
           │ (AI, analytics) │       │  reminders, OCR │
           └─────────────────┘       └─────────────────┘
```

### Frontend (Mobile)

* **Flutter** (chosen in repo — not React Native)
* Riverpod for state
* `go_router` for navigation
* `hive_ce` for offline entities + outbox
* `dio` for API
* `flutter_animate` for motion

**Feature folder structure** (`Mobile/architecture.md`):

```
lib/src/features/<feature>/
  presentation/
  controllers/
  models/
```

### Backend

* **Laravel** — REST API, auth, webhooks, admin
* **Go microservices** (optional scale-out) — heavy OCR, analytics aggregation, LLM proxy

### Realtime

* WebSockets or SSE for “payment received” on open screens
* Redis pub/sub for multi-instance Laravel

### Database

* **PostgreSQL** — row-level `business_id` on all tenant tables
* Indexes: `(business_id, party_id)`, `(business_id, created_at DESC)`
* Partitioning by `business_id` hash at scale (V3)

### Analytics

* **ClickHouse** — event stream: `sale_created`, `reminder_sent`, `payment_received`
* Funnel and retention dashboards for product team

### AI

| Capability | Implementation |
|------------|----------------|
| OCR | Cloud API or self-hosted PaddleOCR → Go worker |
| Voice STT | Whisper API / local model for Urdu |
| LLM assistant | Tool-calling GPT with strict schemas |
| Insights | SQL + rules engine v1; ML v2 |

---

## API design conventions

* Version prefix: `/api/v1/`
* Idempotency-Key header on POST for payments and ledger
* Pagination: cursor-based `?after=id&limit=50`
* Errors: `{ "message", "code", "fields" }`

**Example: Create ledger entry**

```http
POST /api/v1/businesses/{bid}/branches/{brid}/ledger-entries
Idempotency-Key: {client_uuid}
{
  "party_id": "uuid",
  "kind": "gave",
  "amount": 12000,
  "category": "sales",
  "note": "2L Karate spray udhaar",
  "client_created_at": "2026-05-17T14:05:00+05:00"
}
```

---

## Multi-tenancy & security

* JWT claims: `sub`, `business_id`, `branch_ids[]`, `permissions[]`
* Laravel policies per model
* Rate limiting per user + per business tier

---

## Observability

* Structured logs (JSON)
* Sentry for mobile + API
* Business metrics: Prometheus + Grafana

---

# PHASED ROADMAP

## Phase 0 — Foundation (current)

* [ ] Auth (phone OTP), business setup
* [ ] Theme, navigation shell, Hive bootstrap
* [ ] API skeleton + tenant middleware

## Phase 1 — Core loop (MVP) — **Agri dealer first**

* [ ] Khata: parties (farmer/supplier), gave/got, timeline, search, filters
* [ ] Agri product catalog: khaad, spray, units (bori/litre), low stock
* [ ] Dashboard: today's activity, receivable/payable, season banner (Kharif/Rabi)
* [ ] Basic reports: aging, simple P&L
* [ ] Offline outbox + sync
* [ ] Share ledger card / PDF statement (WhatsApp)

## Phase 2 — Operations & vertical expansion

* [ ] Batch/expiry for pesticides; FEFO prompt at sale
* [ ] Invoices linked to parties (agri line items)
* [ ] **Crop trader:** commodity lot, weight slip, maund rate
* [ ] **Property:** plot unit, token/installment milestones
* [ ] **Mobile:** repair ticket + parts + IMEI on sale
* [ ] Expenses + daily cash summary
* [ ] Staff roles (basic RBAC)

## Phase 3 — Growth

* [ ] Payment links (Raast / wallet)
* [ ] WhatsApp reminder automation
* [ ] AI chat (read-only queries)
* [ ] Voice entry beta

## Phase 4 — Scale

* [ ] Multi-branch
* [ ] ClickHouse analytics
* [ ] Embedded lending partners
* [ ] Super-app modules (commerce, logistics)

---

# RISKS, CONSTRAINTS & OPEN QUESTIONS

## Risks

| Risk | Mitigation |
|------|------------|
| Low retention after install | Time-to-value &lt; 3 min; onboarding with sample data |
| WhatsApp API cost / policy | Manual share MVP; apply for BSP early |
| AI hallucination in finance | Tool-only queries; confirm writes |
| Offline sync conflicts | Clear merge UI; owner authority |
| Fintech regulation | Partner with licensed entities |

## Open questions (decide before build)

1. **Onboarding default vertical** — Agri-only MVP vs picker (agri / crop / property / mobile)?
2. **Flavors** — `Mobile/lib/src/flavors.dart`: separate APK per vertical or one app with vertical switch?
3. **Pesticide compliance** — Batch/expiry MVP mandatory or Phase 2?
4. **Crop module** — Separate "mandi mode" UI or shared invoice with commodity fields?
5. **Property** — Plot registry in MVP or Phase 2?
6. **Tax / GST** — Required for MVP or Phase 2?
7. **Default language** — Roman Urdu vs English first launch?
8. **Pricing model** — Per vertical subscription or unified plan?
9. **Backend source of truth** — Supabase vs Laravel-only? (`.env` may hint; keep one path.)

---

# FINAL PRODUCT VISION

This product should eventually feel like:

> **"An AI-powered operating system for agri dealers, crop traders, plot dealers, and mobile businesses in emerging markets."**

Not just bookkeeping. But:

* **Financial intelligence** — farmer udhaar, plot installments, repair advances in one calm view
* **Operational control** — expiry-safe spray stock, commodity lots, plot pipeline, IMEI inventory
* **Recovery automation** — post-harvest reminders that respect *fasal ke baad*
* **Season prediction** — reorder khaad before Kharif, flag spray gaps before cotton window
* **Embedded fintech** — collect with Raast/JazzCash when the farmer sells crop
* **AI assistant** — *"kitni karate bachi hai?"* in Urdu
* **Growth engine** — supplier credit and multi-branch when the mandi grows

---

## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| Khata | Ledger of credit/debit with a party |
| Udhaar | Goods/money given on credit |
| Party | Customer, supplier, farmer, buyer, broker, or both |
| Gave | You gave value (they owe you) |
| Got | You received payment (reduces their debt) |
| Khaad | Fertilizer (Urea, DAP, etc.) |
| Spray | Pesticide / crop protection (liquid or powder) |
| Kharif / Rabi | Major cropping seasons in Pakistan |
| Maund | Traditional weight unit (~40 kg for wheat; verify per commodity) |
| Mandi | Agricultural market / trading hub |
| Arthi | Commission agent in mandi |
| Fasal | Crop; harvest — often when farmer pays udhaar |
| Plot / marla / kanal | Land units for property vertical |
| Token | Initial booking payment on a plot |
| IMEI | Mobile device identifier for sale/repair tracking |
| Raast | Pakistan instant payment system |
| Phutti | Seed cotton (before ginning) |
| Lint | Ginned cotton fiber |
| Bardana | Jute/gunny bag; tare weight in mandi |
| Kat | Deduction from gross weight or amount |
| Beopari | Village-level crop aggregator/trader |
| Pakka arthi | Registered, established commission agent |
| Kacha arthi | Informal intermediary |
| File (property) | Pre-possession society allotment claim — not title |
| Balloting | Lottery assigning plot numbers to file holders |
| Possession | Society hands over physical plot |
| DIRBS | PTA device registration system |
| IMEI | 15-digit device ID checked via 8484 / DIRBS |
| GNPL | Grow Now Pay Later (agri finance programs) |
| FEFO | First-expiry-first-out stock picking |
| GRN | Goods received note (stock in from supplier) |

---

## Appendix B — Prototype → API entity map

| Prototype (`data.jsx`) | API resource |
|------------------------|--------------|
| `PARTIES` | `/parties` |
| `txns` on party | `/ledger-entries` |
| `PRODUCTS` | `/products` |
| `INVOICES` | `/invoices` |
| `STAFF` | `/staff` |
| `INSIGHTS` | `/insights` (computed) |
| `ACTIVITY` | `/activity-feed` (computed) |
| `CASHFLOW_30` | `/reports/cashflow` |

---

## Appendix C — Vertical feature checklist

| Capability | Agri (1) | Crop (2) | Property (3) | Mobile (4) |
|------------|:--------:|:--------:|:------------:|:------------:|
| Party khata (gave/got) | ● | ● | ● | ● |
| Product SKU stock | ● | ○ | — | ● (parts/phones) |
| Batch / expiry | ● | — | — | ○ (parts) |
| Pesticide legal register export | ● | — | — | — |
| Company target / incentive tracking | ○ | — | — | — |
| Season tag (Kharif/Rabi) | ● | ● | — | — |
| Commodity / maund / weight slip | — | ● | — | — |
| Lot margin / season P&L | — | ● | — | — |
| Daily mandi rate board | — | ● | — | — |
| Plot + installment schedule | — | — | ● | — |
| File vs plot lifecycle | — | — | ● | — |
| Society / NOC document vault | — | — | ○ | — |
| Repair ticket + status | — | — | — | ● |
| IMEI / DIRBS check log | — | — | — | ● |
| Used phone aging alert | — | — | — | ○ |
| Voice templates (Urdu) | ● | ● | ● | ● |
| WhatsApp share card | ● | ● | ● | ● |

● = core · ○ = optional · — = not primary

---

## Appendix D — Regulatory & reference links (verify before ship)

| Topic | Reference |
|-------|-----------|
| Pesticide dealer license & sale register | Agricultural Pesticides Ordinance, 1971; DPP Pakistan |
| Crop calendar (Punjab) | Punjab CRS / agrinfobank approved calendars |
| PTA device check | dirbs.pta.gov.pk · SMS 8484 |
| Property file vs plot | Transfer of Property Act 1882; society NOC authorities (LDA/CDA/RDA) |

---

## Appendix E — Season calendar template (Punjab defaults, configurable)

| Month | Agri dealer focus | Crop trader focus |
|-------|-------------------|-------------------|
| Jan–Feb | Rabi wheat topdress, vegetables | Wheat procurement planning |
| Mar–Apr | Wheat herbicide tail, maize prep | **Wheat harvest** cash intensity |
| May–Jun | Cotton sowing inputs, rice nursery | Wheat movement to mills |
| Jul–Aug | **Cotton spray peak**, rice pesticides | Early cotton phutti |
| Sep–Oct | Rice, late cotton spray | **Cotton peak picking** |
| Nov–Dec | Rabi wheat sowing, mustard | Cotton ginning settlements; wheat planting inputs |

---

*Last expanded: May 2026 — deep vertical research: agri → crop → property → mobile.*
