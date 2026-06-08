# 06 — Personas, Workspace & Tenancy

[← Index](README.md) · [05 Mobile](05-vertical-mobile-repair.md) · **Next:** [07 UX](07-experience-and-ux.md)

---

## 1. Core tenancy rule (non-negotiable)

| Rule | Meaning |
|------|---------|
| **One user → many businesses** | Same login (phone) can own or work in multiple businesses |
| **One business → exactly one vertical** | Each business is **either** agri, crop, property, **or** mobile — never mixed |
| **Another vertical = new business** | Agri shop + mobile shop = **two businesses**, not one business with two modes |
| **Hard data separation** | Parties, khata, stock, tickets, plots — **all** rows scoped by `business_id`; no shared ledger across businesses |
| **Vertical is fixed at creation** | Chosen at business setup; change only via support migration, not self-serve toggle |

```text
User (one phone login)
  ├── Business A  →  vertical: agri_inputs     (Rashid Agro Shop)
  ├── Business B  →  vertical: mobile          (Rashid Mobile Center)
  └── Business C  →  vertical: crop_trade      (Rashid Mandi)
        ↑ separate databases in practice — same app, strict tenant wall
```

**Why:** Mixing farmer udhaar with repair tickets in one tenant causes UX confusion, wrong reports, and compliance risk (e.g. pesticide register polluted with phone SKUs). Clean vertical templates per business keep onboarding and home screen correct.

**Three identity layers:**

```text
Platform (Lixar staff)     →  platform_users  →  /admin  — see [12](12-super-admin-platform.md)
Shop user (phone OTP)      →  users           →  Flutter / web owner app
Business membership        →  business_users  →  role per business (partner, cashier, …)
```

---

## 2. Persona summary

| P | Persona | Vertical (`business.vertical`) | Deep doc |
|---|---------|-------------------------------|----------|
| 1 | Agri input dealer | `agri_inputs` | [02](02-vertical-agri-inputs.md) |
| 2 | Crop trader | `crop_trade` | [03](03-vertical-crop-trading.md) |
| 3 | Property agent | `property` | [04](04-vertical-property-plots.md) |
| 4 | Mobile shop | `mobile` | [05](05-vertical-mobile-repair.md) |
| 5 | **Multi-business / multi-partner** | Own businesses + partner on others | §3, §5 |
| — | **Lixar Super Admin** *(platform)* | All tenants — **not** a shop persona | [12](12-super-admin-platform.md) |

**Persona 5 example:** Rashid owns an agri dealership **and** a mobile counter — he has **two businesses** in Lixar, switches between them in the app; staff in each business never sees the other business’s data.

---

## 3. Workspace model

### 3.1 Structure

```text
User
  └── BusinessUser (role, is_creator, status) — one row per (user, business)
        └── Business
              ├── created_by_user_id
              ├── vertical: agri_inputs | crop_trade | property | mobile
              ├── Partners[]   → BusinessUser where role = partner
              ├── Staff[]      → BusinessUser where role ≠ partner
              ├── Branch[]
              └── subscription_plan
```

**Removed concept:** `verticals_enabled: []` on one business — **not allowed**.

### 3.2 Data isolation guarantees

| Layer | Enforcement |
|-------|-------------|
| **API** | Every request requires `business_id`; JWT lists allowed business IDs only |
| **Database** | `business_id` on all tenant tables; FK + indexes; no cross-tenant joins in app code |
| **Mobile local (Hive)** | **Source of truth for UI reads**; keyed by `business_id`; swap on business switch |
| **Sync** | Device **pulls** server deltas + **pushes** outbox when online; bootstrap on first login |
| **Reports / exports** | Single business scope only |
| **AI assistant** | Tool-calling **Laravel only**; chat **online**; mobile **light models** (STT/OCR) offline OK for drafts only |
| **Search** | Never global across businesses |

**Branch isolation (within one business):** Optional `branch_id` on rows — still **same vertical**, same catalog rules (e.g. only agri SKUs).

### 3.3 Onboarding — create business

**Step 1 — Pick vertical (immutable):**

> **"Ye business kis kaam ke liye hai?"**  
> 🌾 Agri — khaad, spray, pesticide  
> 🌾 Mandi — fasal khareed / bech (crop trade)  
> 🏠 Property — plots, installments  
> 📱 Mobile — repair, parts, phones  

**Step 2 — Business name, branch (optional), sample data for that vertical only.**

**No** “add another vertical to this business” — instead:

> **"Dusra kaam add karein? Naya business banayein."**  
> → Creates new `Business` with new `vertical` + empty tenant data.

### 3.4 Business switcher (multi-business user)

| UI element | Behavior |
|------------|----------|
| Header / profile | Current business name + vertical badge (e.g. "Agri") |
| Switcher sheet | List businesses — badge: Creator / Partner / Staff + vertical |
| On switch | Reload home shell for that vertical; swap local cache; new API context |
| Create new | "Naya business" → vertical picker → new tenant |

Prototype reference: `showBizSwitcher` — extend to show **vertical type** per business, not in-business vertical tabs.

### 3.5 UI shell per business (one vertical)

Each `business.vertical` loads **one** template:

| `business.vertical` | Home emphasis | FAB |
|---------------------|---------------|-----|
| `agri_inputs` | Season, farmers receivable, low stock | Sale / udhaar |
| `crop_trade` | Rates, open lots, payables | Weight slip |
| `property` | Installments due, plot pipeline | Record payment |
| `mobile` | Tickets, ready queue | New ticket |

No vertical tabs inside a single business.

---

## 4. Persona → module priority

Matrix applies **per business** based on its single `vertical`:

| Module | Agri | Crop | Property | Mobile |
|--------|:----:|:----:|:--------:|:------:|
| Khata / Ledger | ●●● | ●●● | ●●● | ●●● |
| Accounts (cash/bank) | ●●● | ●●● | ●●● | ●●● |
| Billing | ●●● | ●●● | ●● | ●●● |
| Inventory | ●●● | ● | ● | ●●● |
| Cashflow | ●●● | ●●● | ●● | ●● |
| Season / commodity | ●●● | ●●● | — | — |
| Repair tickets | — | — | — | ●●● |
| Staff | ●● | ●● | ● | ●● |
| AI Assistant | ●● | ●● | ● | ●● |

Modules not relevant to a vertical are **hidden**, not disabled — crop business never loads plot installment screens.

---

## 5. Partners, creator & team roles

A **business** is not owned by one phone number alone — it can have **multiple partners** (co-owners) plus **staff** with limited roles.

### 5.1 Membership types

| Type | How they join | Scope |
|------|---------------|--------|
| **Creator** | Creates the business at signup | First member; `is_creator: true` on `BusinessUser` |
| **Partner** | Invited by creator or another partner | Full business governance + operations |
| **Staff** | Invited by partner (or creator) | Role-based: admin, cashier, technician, etc. |

```text
Business "Rashid Agro"
  ├── Ali (creator)      — partner + is_creator
  ├── Rashid (partner)   — invited by Ali
  ├── Hassan (partner)   — invited by Rashid
  └── Imran (cashier)    — staff only
```

### 5.2 What a partner can do

Partners are **co-owners of the business tenant** — not employees.

| Action | Partner | Staff (e.g. cashier) |
|--------|:-------:|:--------------------:|
| Khata, sales, stock, tickets (operational data) | ✓ | Per staff role |
| Edit business name, logo, settings | ✓ | — |
| Manage branches | ✓ | — |
| Invite / remove **partners** | ✓* | — |
| Invite / remove **staff** | ✓ | — |
| **Remove creator** from business | — | — |
| Remove another **partner** | ✓* | — |
| Subscription / billing (plan) | ✓ | — |
| Delete entire business | ✓** | — |
| Export all data | ✓ | — |

\*Cannot remove the **creator** row or the **last** partner — see §5.5–5.6.  
\*\*Delete business: require **all partners** to confirm OR last remaining partner only — product policy below.

**Creator vs partner:** After invite, **creator and invited partners share almost the same permission set** except:

| Creator only | Invited partner |
|--------------|-----------------|
| Historical `created_by_user_id` on `Business` (never changes) | — |
| "Founder" badge in team list (cosmetic) | — |
| **Cannot be removed** by any partner | Can remove other partners (not creator) |
| May **leave** voluntarily only if ≥1 other active partner | May leave if not last partner |

The **creator is permanent** for the life of the business — partners manage the shop together but cannot lock out the person who created the tenant.

### 5.3 User access across businesses

One **User** (phone login) can access:

| Source | Appears in switcher as |
|--------|------------------------|
| Businesses **they created** | "Meri business" / owned |
| Businesses where they were **added as partner** | "Partner" badge |
| Businesses where they are **staff only** | "Staff · Cashier" badge |

All use the same `BusinessUser` table — distinguished by `role` + `is_creator`.

```text
User Ali
  ├── Created:  Ali Agro (agri)     — creator + partner
  ├── Partner: Hassan Mobile        — invited by Hassan
  └── Staff:    City Mandi          — cashier only (no partner powers)
```

### 5.4 Invite & accept flow (partners)

```text
1. Partner A opens Settings → Team → "Partner add karein"
2. Enter phone (+92) + optional name
3. System sends invite (SMS / WhatsApp / in-app if user exists)
4. Partner B accepts → BusinessUser { role: partner, status: active }
5. Audit log: invited_by, accepted_at
```

**Pending invite:**

```yaml
business_invite:
  business_id: uuid
  phone: "+92300..."
  role: partner | admin | cashier | ...
  invited_by_user_id: uuid
  token: secure
  status: pending | accepted | expired | revoked
  expires_at: 7 days
```

### 5.5 Remove partner or staff

**Creator cannot be removed by partners**

- Team list shows creator with **Founder** badge — **no** "Remove" action for other members.
- API: `DELETE .../team/{user_id}` returns **403** if target `is_creator: true` and caller is not that user.
- `created_by_user_id` on `Business` stays forever for audit.

**Creator leaving voluntarily (optional product):**

```text
1. Creator → Settings → Team → "Business chhor dein"
2. Blocked if no other active partner exists
3. If ≥1 partner remains: confirm → creator BusinessUser → status: removed
4. Creator loses switcher access; business continues under remaining partners
```

**Remove another partner (not creator):**

```text
1. Partner A → Team → Rashid → "Business se hataein"
2. Warning + optional PIN
3. Rashid's BusinessUser → status: removed
4. Rashid can be re-invited later
```

Cannot remove **self** if last partner (see safeguards).

**Removed user:**

- Loses access to **this business only**  
- Their own other businesses unaffected  
- Can be **re-invited** as partner or staff later  

### 5.6 Safeguards (required)

| Rule | Reason |
|------|--------|
| **≥1 active partner** must remain | Business never orphaned |
| Cannot remove **last partner** | Block with message: pehle kisi aur partner ko add karein |
| **Creator immune** from partner-initiated removal | Founder always retains tenant unless they leave themselves |
| All partner/staff removals → **audit_log** | Dispute resolution |
| Optional: re-auth (PIN) before remove partner | Fraud prevention |
| Delete business only if **1 partner left** OR all partners tap confirm | Prevents one angry partner wiping tenant |

### 5.7 Staff roles (non-partners)

Scoped to **(user, business)** — staff in Business A cannot access Business B.

| Role | Typical vertical | Capabilities |
|------|------------------|--------------|
| **Partner** | Any | Full — see §5.2 |
| Admin | Any | All operations; **no** partner/team management |
| Cashier | Agri, mobile | Sales, khata — no export |
| Mandi clerk | Crop | Intake only — no delete |
| Inventory clerk | Agri | Stock only |
| Technician | Mobile | Tickets — no margin view |
| Accountant | Any | Read-only + export |

**Matrix detail:** [08 — Module 11](08-product-modules.md#module-11--team-partners--operations)

### 5.8 Team management screens

| Screen | Who sees it |
|--------|-------------|
| Team list | Partners only |
| Invite partner / staff | Partners only |
| Remove member | Partners only; creator row never shows remove for others |
| Change staff role | Partners only |
| Activity log (team changes) | Partners only |

---

## 6. Shared platform kernel (code reuse, not data sharing)

The **codebase** shares:

- `Party`, `LedgerEntry` (gave/got)
- `Account`, `AccountTransaction`, `AccountTransfer` (cash, MCB, HBL, …)
- Attachments, audit log, offline outbox, RBAC patterns

Each **business instance** gets its **own rows** — agri business Party `Rashid Farmer` is unrelated to mobile business Party `Rashid` (same name allowed, different `business_id`).

Vertical-specific tables only exist where needed:

| Vertical | Extra entities (examples) |
|----------|---------------------------|
| `agri_inputs` | `ProductBatch`, pesticide register |
| `crop_trade` | `Lot`, `WeightSlip` |
| `property` | `PlotUnit`, `Deal`, `InstallmentSchedule` |
| `mobile` | `RepairTicket`, `PartVariant`, `DeviceVariant` |

---

## 7. Edge cases & product decisions

| Scenario | Policy |
|----------|--------|
| Owner wants agri + mobile | Two businesses; business switcher |
| Two brothers run one shop | Both **partners** on same business |
| Partner tries to remove creator | **Blocked** — UI hides action; API 403 |
| Creator is only person left | Cannot leave until another partner joins; can delete business or invite partner |
| Creator wants to exit | Voluntary leave only if ≥1 active partner remains |
| Partner leaves voluntarily | "Leave business" — blocked if last partner |
| Staff works both shops | Two `BusinessUser` rows — different roles |
| Duplicate business names | Allowed — show vertical + role badge in switcher |
| Merge two businesses | **Out of scope** — use export + manual import |
| Change vertical after creation | **Blocked** — new business |
| Dispute: who removed whom | `audit_log` + optional export |
| Holding company dashboard | Rollup across businesses user is partner on (multi-business owners) |

---

## 8. Schema snippet

```yaml
business:
  id: uuid
  name: "Rashid Agro"
  vertical: agri_inputs
  currency: PKR
  created_by_user_id: uuid    # historical creator, never changes
  created_at: ...

business_user:
  user_id: uuid
  business_id: uuid
  role: partner | admin | cashier | technician | accountant | ...
  is_creator: boolean          # true for founder row; immutable; not clearable by partners
  status: active | removed | suspended
  branch_ids: [uuid] | all
  invited_by_user_id: uuid | null
  joined_at: timestamp
  removed_at: timestamp | null
  removed_by_user_id: uuid | null

business_invite:
  id: uuid
  business_id: uuid
  phone: string
  role: partner | admin | cashier | ...
  invited_by_user_id: uuid
  token: string
  status: pending | accepted | expired | revoked
  expires_at: timestamp
```

**Role → permissions (API):**

```text
partner     → permissions: ["*"]  (within business_id)
admin       → operations, no team.manage
cashier     → sales, khata.create, ...
```

**JWT claims:**

```json
{
  "sub": "user-uuid",
  "business_id": "active-business-uuid",
  "vertical": "agri_inputs",
  "membership_role": "partner",
  "is_creator": false,
  "permissions": ["team.manage", "business.settings", "..."],
  "allowed_business_ids": ["uuid-a", "uuid-b"]
}
```

---

[← Index](README.md) · **Next:** [07 — Experience & UX](07-experience-and-ux.md)
