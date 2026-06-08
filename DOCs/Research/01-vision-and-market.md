# 01 — Vision, Market & Strategy

[← Index](README.md) · **Next:** [02 Agri Inputs](02-vertical-agri-inputs.md)

---

## 1. Executive summary

### 1.1 What we are building

**Lixar** is a mobile-first **Business OS** for Pakistan’s informal and semi-formal economy — not generic accounting software and not a Western POS.

> **Vision:** An AI-powered operating system for **agri dealers, crop traders, plot dealers, and mobile shop owners** — starting in Pakistan, expanding across South Asia.

### 1.2 What we are not building

| Not this | Why |
|----------|-----|
| DigiKhata clone | We go deeper on vertical workflows (season, expiry, mandi lots, plots, IMEI) |
| Full ERP | Too heavy; owners reject long setup |
| CA / tax-first accounting | Language and mental model mismatch |
| WhatsApp replacement | We **compose** with WhatsApp (share cards, reminders) |

### 1.3 Product design principles

- Product thinking aligned to **real shops** (not abstract SME)
- UX strategy: calm money, Urdu voice, offline-first
- System architecture: tenant-safe, sync-safe, audit-safe
- Behavioral design: harvest credit, relationship-first khata
- Automation: reminders, season alerts, reorder — not black-box AI finance
- Fintech: Raast, wallets — after trust and records exist
- AI-native: **light models on mobile** (voice/OCR drafts) + **server assistant** (Laravel tool-calling); human confirm before writes

---

## 2. Four core verticals

| P | Vertical | Primary user | Core question the app answers |
|---|----------|--------------|------------------------------|
| **1** | Agri inputs | Pesticide / fertilizer dealer | *"Kis kisan ka kitna udhaar hai, aur spray stock kab khatam hogi?"* |
| **2** | Crop trading | Mandi buyer, arthi, broker | *"Is season lot par kitna margin bana, aur aaj gehun ka rate kya hai?"* |
| **3** | Property & plots | Society / plot agent | *"Kaun sa plot booked hai, aur kis buyer ki installment due hai?"* |
| **4** | Mobile repair & sale | Bazaar repair / used phone shop | *"Kaun si repair ready hai, aur ye IMEI PTA ok hai?"* |

**Multi-business owners:** Same user may run agri shop **and** mobile counter — as **two separate businesses** (one vertical each), switched via business switcher. Data never mixes across businesses; see [06 — Tenancy](06-personas-and-workspace.md).

---

## 3. Business OS layers

| Layer | User promise | System implementation |
|-------|--------------|------------------------|
| **Record** | Log sale, udhaar, stock, slip in &lt;10s | Append-only ledger + inventory events + `client_uuid` |
| **Treasury** | “Cash mein kitna, bank mein kitna?” | Accounts (Cash, MCB, HBL) + in/out log + transfers |
| **Understand** | “Aaj theek hoon ya nahi?” | Dashboard aggregates + rule-based insights |
| **Act** | Remind, reorder, collect | WhatsApp share, Raast QR, push |
| **Grow** | Credit, multi-branch, targets | Scoring, company targets, branch consolidation |

---

## 4. Market context (Pakistan)

### 4.1 Geography & language

- **Primary:** Pakistan (Punjab, Sindh, KPK, Balochistan — configurable calendars)
- **Secondary:** India, Bangladesh (udhaar culture, similar mandi mechanics)
- **UI:** Roman Urdu + English; amounts **Rs** / PKR; Western digits
- **Voice:** Urdu, Punjabi, Hindko — STT with Roman Urdu confirm sheet

### 4.2 Structural market facts

| Fact | Product consequence |
|------|---------------------|
| 90%+ informal record-keeping | Zero jargon; voice & templates over forms |
| WhatsApp = real CRM | Export ledger cards, receipts, rate broadcasts |
| Harvest-linked credit | `expected_recovery_season` + gentle post-harvest reminders |
| Intermittent rural 3G | **Offline-first:** full data on device; background sync when online |
| Low-end Android | P95 cold start &lt;2s; large touch targets |
| Pesticide dealers must keep **written sale register** | Digital register export = legal + product wedge |
| PTA blocks unregistered phones | IMEI log at buy/sell for mobile vertical |

### 4.3 Digital gap by vertical

| Vertical | Today | Gap Lixar fills |
|----------|-------|-----------------|
| Agri dealer | Paper register + khata notebook + company invoices | One entry → stock + khata + legal export |
| Crop trader | Slips + notebook + WhatsApp rates | Lot margin + deduction transparency |
| Property agent | Excel + voice notes + society receipts | Plot pipeline + installment schedule |
| Mobile shop | Paper ticket + memory | Ticket board + IMEI audit trail |

---

## 5. Competition

### 5.1 Cross-product

| Product | Strength | Weakness vs Lixar |
|---------|----------|-------------------|
| DigiKhata | Khata habit, PK brand | No season, expiry, mandi lot, plot deal, repair ticket |
| Khatabook / OkCredit | Scale (India) | Weak PK payments; not agri-specific |
| Excel / paper | Free, trusted | No reminders, no sync, no stock link |
| Generic POS | Hardware scan | No udhaar culture, no vertical depth |

### 5.2 By vertical

| Vertical | Incumbents | Lixar wedge |
|----------|------------|-------------|
| Agri | Paper register, company order books, desktop agri ERP | Mobile pesticide register + FEFO + farmer khata |
| Crop | Arthi notebooks, rate WhatsApp groups | Lot accounting + slip photo + season P&L |
| Property | Society portals (partial), Zameen (listings only) | Installment CRM + file/plot lifecycle |
| Mobile | Generic POS, paper jobs | DIRBS log + repair BOM + used-phone aging |

---

## 6. Differentiation thesis

1. **Relationship-first khata** — party = farmer / mill / buyer / customer, not row #47  
2. **Season-aware** — Kharif/Rabi, spray windows, harvest recovery  
3. **One vertical per business** — agri, mandi, property, or mobile at creation; new vertical = new business ([06](06-personas-and-workspace.md))  
4. **Voice + OCR first** — on-device light models → structured confirm; full assistant on server  
5. **Pakistan fintech rails** — Raast, JazzCash, Easypaisa on balance  
6. **Compliance as feature** — pesticide register, IMEI log (not legal advice)  
7. **Offline-first** — khata/stock + **local voice drafts**; **AI chat** needs internet (Laravel)  

---

## 7. Positioning

**Tagline (internal):** *Your Business Command Center*  
**Urdu options:** *Dukaan ka control room* · *Fasal se plot tak — sab hisaab ek jagah*

**Reference UX qualities:**

| Reference | Borrow |
|-----------|--------|
| WhatsApp | Lists, timelines, share sheets |
| Stripe | Calm money states, clear status |
| Notion | Workspaces, optional depth |
| Revolut | Instant feedback on payment in |

**Positioning statement:**

For **agri dealers, crop traders, plot dealers, and mobile shop owners in Pakistan** who run money in registers and WhatsApp, **Lixar** is the **mobile-first business OS** that records, reminds, and predicts — unlike generic POS or khata-only apps, built for **seasonal udhaar, batch stock, commodity slips, plot installments, and repair tickets** with **Urdu voice entry**.

**Messaging pillars:**

1. **Yaad rakhega** — udhaar, installments, repair advance survive the busy season  
2. **Season samjhta hai** — Kharif/Rabi, expiry, mandi rate discipline  
3. **Aapki zubaan** — *"2 litre spray udhaar"*, *"40 maund gehun"*, *"plot token 50 hazar"*  

---

## 8. Success metrics

### 8.1 North star

**Weekly Active Businesses (WAB):** business with ≥1 meaningful event (ledger, invoice, stock, payment) on **3+ days** in a week.

### 8.2 Supporting metrics

| Category | Metric | Target direction |
|----------|--------|------------------|
| Activation | Time to first ledger entry | &lt; 3 minutes |
| Retention | D7 / D30 by vertical | Agri highest first |
| Recovery | % overdue collected within 7d of reminder | Up |
| Revenue | ARPU subscription + payment take rate | Sustainable |
| Trust | Support tickets / fraud per 1k MAU | Down |
| Performance | P95 cold start; offline sync latency | &lt;2s / &lt;5s |

### 8.3 Anti-metrics

- Notification volume (uninstall driver)
- Feature count without depth
- DAU from promotional pings only

---

## 9. Lixar repo alignment

| Asset | Path | Role |
|-------|------|------|
| UI prototype | `DOCs/project/Lixar Khata.html` | Visual source of truth |
| Sample data | `DOCs/project/data.jsx` | Domain language — update to agri samples |
| Mobile app | `Mobile/` | Flutter, Riverpod, Hive, GoRouter |
| Backend | Laravel + Inertia | API, admin, web dashboard |
| Flavors | `Mobile/lib/src/flavors.dart` | Optional per-vertical builds |

---

[← Index](README.md) · **Next:** [02 — Agri Inputs (deep dive)](02-vertical-agri-inputs.md)
