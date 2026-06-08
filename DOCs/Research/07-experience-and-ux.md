# 07 — Experience Philosophy & UX System

[← Index](README.md) · [06 Personas](06-personas-and-workspace.md) · **Next:** [08 Modules](08-product-modules.md)

**Prototype reference:** `DOCs/project/theme.jsx`, `Lixar Khata.html`

---

## 1. Experience principles

### 1.1 Reduce anxiety

Owners fear: losses, uncollected udhaar, stock mismatch, staff theft.

| Tactic | Implementation |
|--------|----------------|
| Calm debt UI | Amber warn, not full-screen red |
| Net summary | **You'll receive** / **You'll pay** (crop: Hamain lena/dena) |
| Max 3 CTAs | Home dashboard |
| Progressive disclosure | Total overdue → top 3 → full list |

### 1.2 Replace manual thinking

Insight cards — max **5** active, each with **one action**, verifiable data only.

```ts
type Insight = {
  tone: 'warn' | 'pos' | 'info';
  title: string;
  body: string;
  action?: { label: string; deepLink: string };
};
```

**Vertical examples:**

- Agri: *"Cotton spray 10 din — Karate 8 litre bachi"*
- Crop: *"Wheat margin 4% kam — rate check"*
- Property: *"Block B — 2 installments due"*
- Mobile: *"5 phones ready — WhatsApp bhejein"*

### 1.3 Minimize typing

**Input hierarchy:**

1. Voice → confirm sheet  
2. Template chips (Udhaar / Paisa mila)  
3. Recent party / SKU  
4. Barcode / OCR  
5. Numeric keypad  
6. Free text  

### 1.4 Trust & forgiveness

- Audit: who, when, device on every change  
- Edit = audit log, not silent overwrite  
- Undo snackbar 10s after save  
- 30-day restore for owner deletes  

### 1.5 Cultural fit

- `gave` / `got` labels with Urdu helper text  
- WhatsApp ledger card image  
- Quiet hours 22:00–08:00; optional Jummah / Ramadan quiet  

---

## 2. Smart dashboard (Module 3 UX)

### Layer 1 — Critical alerts

Overdue, negative cashflow projection, low stock, staff absence.

**Priority score (draft):**

```text
score = amount_norm*0.4 + days_overdue*0.3 + stockout_risk*0.2 + user_pin*0.1
```

### Layer 2 — Today

Revenue, expenses, cash balance, collections. Feed types: `sale | expense | payment` (see `ACTIVITY` in prototype).

### Layer 3 — Insights

Rule-based insights by default; ML scoring when ≥30 days of tenant data exist.

### Layer 4 — Action cards

Send reminder · Restock · Recover — one primary button each.

### Business health score (0–100)

| Factor | Weight |
|--------|--------|
| Recovery efficiency | 25% |
| Cashflow stability | 25% |
| Stock turnover | 20% |
| Expense discipline | 15% |
| Growth | 15% |

---

## 3. Design system

### 3.1 Visual

- **Dark mode** default, emerald accent (`palette: emerald`)  
- Touch targets ≥ 48dp  
- Card radius ~22px  
- WCAG AA contrast  

### 3.2 Color semantics

| Token | Use |
|-------|-----|
| `pos` / green | Money in, receivable |
| `neg` / red | Payable, overdue |
| `warn` | Low stock, caution |
| `accent` | CTA, active chip |

### 3.3 Typography

- Tabular / mono for amounts: `Rs 18,200`  
- KPI 22–28sp  
- `easy_localization`: en, ur Roman; future ur-Arab  

### 3.4 Motion

- Press feedback &lt;100ms  
- Spring sheets (`flutter_animate`)  
- Balance animate on payment; confetti only on milestones  

---

## 4. Navigation & FAB

| Screen | FAB |
|--------|-----|
| Home (agri) | Add entry |
| Khata | Add entry |
| Inventory | Scanner |
| Invoice | New invoice |
| Mobile home | New ticket |

### AI command bar

Raycast-style command bar: **online** → Laravel AI/command → filtered khata or deep link (disabled offline). **Khata, parties, stock, accounts** always load from **local Hive** — usable with no internet after sync ([09 §8](09-technical-and-platform.md#8-offline-first--sync)). Quick mic on FAB uses **on-device** STT when offline (see [09 §3.1](09-technical-and-platform.md#31-mobile-light-models)). Account picker on every cash/bank payment (see [Module 5 — Accounts](08-product-modules.md#module-5--accounts)).

### Contextual FAB

Per vertical shell — see [06](06-personas-and-workspace.md).

---

## 5. Flutter component map

| Prototype | Flutter |
|-----------|---------|
| `Pressable` | `AppButton` |
| `ScreenHeader` | `AppTopBar` |
| `TextInput` | `AppTextField` |
| `PartyCard` | `features/khata/` |
| Toast | `show_toast.dart` |

---

[← Index](README.md) · **Next:** [08 — Product Modules](08-product-modules.md)
