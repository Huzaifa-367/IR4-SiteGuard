# 08 — Product Modules (1–17)

[← Index](README.md) · [07 UX](07-experience-and-ux.md) · **Next:** [09 Technical](09-technical-and-platform.md)

Each module: **Purpose · Vertical relevance · Scope · Key entities**

Vertical docs: [02 Agri](02-vertical-agri-inputs.md) · [03 Crop](03-vertical-crop-trading.md) · [04 Property](04-vertical-property-plots.md) · [05 Mobile](05-vertical-mobile-repair.md)

---

## Module 1 — Auth & identity

**Purpose:** Fast trusted login, multi-device, staff access.

| Capability | Detail |
|------------|--------|
| Phone OTP signup | Primary; WhatsApp OTP optional |
| Google / Apple | Social sign-in |
| Multi-business | One user, many businesses |
| Partner invite accept | `business_invite` → `BusinessUser` |
| Staff PIN / biometric | Quick staff switch on shared device |
| Device trust | Approval flow for new devices |

**Flow:** Phone → OTP → create business (user becomes **creator** + **partner**) → JWT.

**Repo:** `auth_service.dart`, `session_provider.dart`, Laravel Fortify.

---

## Module 2 — Business workspace

**Purpose:** Tenant isolation, branches, RBAC.

**Tenancy:** One `Business` = **one** `vertical` (immutable). User may own many businesses; data never crosses `business_id`. See [06](06-personas-and-workspace.md).

```text
User → BusinessUser (partner | staff roles) → Business
                          → Partners (team.manage)
                          → Branch → Staff
```

**Partners:** Multiple per business; creator + invited partners share governance. See [06 §5](06-personas-and-workspace.md#5-partners-creator--team-roles).

**Edge cases:** User removed mid-session → force logout; partner removed → revoke JWT for that `business_id`; last partner cannot leave without delete or invite replacement.

---

## Module 3 — Smart dashboard

**Purpose:** Mission control — not static reports.

**Layers:** Alerts → Today → Insights → Actions. See [07](07-experience-and-ux.md).

**Vertical widgets:**

| Vertical | Widget |
|----------|--------|
| Agri | Season banner, working capital gap |
| Crop | Rate board snapshot, open lots |
| Property | Installments due |
| Mobile | Ready tickets |

---

## Module 4 — Khata / ledger *(emotional core)*

**Purpose:** *"Mujh se kon kitna lekar baitha hai?"*

### Philosophy

**Relationship-first** — party = financial + trust + behavior profile.

| Party tag | Balance + |
|-----------|-----------|
| Customer | They owe you |
| Supplier | You owe them |

### Entry types

- `gave` — udhaar / you gave value  
- `got` — payment received  

**Timeline UI** — WhatsApp-style cards, voice notes, photos (not table-first).

### Voice examples

| Vertical | Utterance |
|----------|-----------|
| Agri | *"Rashid ko 2 litre karate udhaar"* |
| Crop | *"40 maund gehun rate 9500"* |
| Property | *"Plot 12 token 50 hazar"* |
| Mobile | *"A12 screen 4500 advance 2000"* |

### Recovery engine

| Tone | Use |
|------|-----|
| Friendly | Post-harvest |
| Professional | Invoice ref |
| Strict | Chronic overdue |

**Risk tiers:** Green / Amber / Red — reminder cadence.

### Flows

- **A:** FAB quick udhaar  
- **B:** Party settle partial  
- **C:** PDF statement → WhatsApp  

### Scope

- Parties, gave/got, timeline, attachments  
- WhatsApp share (image/PDF) + BSP reminders when configured  
- Voice entry: **on-device light STT + slots** (offline OK) → confirm; optional server refine when online  
- OCR bills: on-device hints + Laravel/Go for hard scans  
- ML risk scoring server-side when history exists  
- `ReminderSchedule` automation  

**Entities:** `Party`, `LedgerEntry`, `LedgerAttachment`, `ReminderSchedule`

---

## Module 5 — Accounts

**Purpose:** Track **where** money lives — cash drawer, bank accounts (MCB, HBL, UBL, …), mobile wallets — separate from **who** owes on khata.

### Account types

| Type | Examples |
|------|----------|
| `cash` | Counter cash, petty cash |
| `bank` | MCB business account, HBL current |
| `wallet` | JazzCash merchant, Easypaisa |
| `other` | Custom |

### Core flows

- **In / out log** — every payment, expense, transfer posts `account_transaction` with `direction` + `balance_after`  
- **Payments** — require `account_id` (which account received or paid)  
- **Transfers** — Cash → MCB, MCB → HBL; one API creates paired out/in rows  
- **Opening balance** — set at account create; adjustments partner-only  

### UX

- Home chip: total cash vs total bank  
- Account detail: statement-style timeline (in green / out red)  
- Record payment: pick party + **account** + amount  
- Transfer sheet: from → to → amount → confirm  

**Entities:** `Account`, `AccountTransaction`, `AccountTransfer`

**Schema & APIs:** [11 §6](11-data-model-and-apis.md#6-accounts-billing-payments--cashflow) (`accounts`, `account_transactions`, `account_transfers`)

---

## Module 6 — Cashflow

**Purpose:** Every rupee has source, destination, reason — **rolled up from accounts**.

- Daily open/close drawer on **cash account** (`cash_sessions.account_id`)  
- Expenses debit selected **account** (replaces vague “paid from cash”)  
- Categories: operational, supplier, personal (`is_personal`)  
- River chart 7d/30d/90d per account or all accounts (`CASHFLOW_30` prototype)  
- Links: `got` with `account_id` = cash in; pure udhaar `gave` = no account line until collected  
- Bank feed reconciliation (optional) → match to `account_transactions`  

---

## Module 7 — Inventory

**Purpose:** Four inventory modes — see table.

| Mode | Vertical |
|------|----------|
| Agri SKU | Pesticide, khaad — batch/expiry FEFO |
| Commodity lot | Crop — open lots |
| Plot unit | Property — status pipeline |
| Device + parts | Mobile — IMEI, BOM, variants |

**Agri:** FEFO, company targets, season tags.  
**Units:** Base stock in `kg`/`L`/`piece`; **purchase units** (bori 50 kg, carton) and **sale units** (full bori, 5/10/20 kg loose) with `factor_to_base` — see [02 §6](02-vertical-agri-inputs.md#6-units-pricing--margins).  
**Stock ↔ ledger:** Udhaar sale −`base_qty` +balance.

**Scope:** Agri in/out + low stock; crop lots; plot registry; repair BOM + variant stock; optional open-bag tracking per SKU.

---

## Module 8 — Billing

**Purpose:** Trustworthy slips — agri bill, weight slip, milestone receipt, repair invoice.

| Vertical | Document |
|----------|----------|
| Agri | SKU lines, optional batch |
| Crop | Weight slip + deductions |
| Property | Installment receipt |
| Mobile | Ticket → invoice |

**States:** draft → pending → paid | partial | overdue

**Payments:** Pick **account** + Raast QR on invoice; webhook credits `settlement_account_id` → `payment` + account in.

---

## Module 9 — Payments & fintech

| Rail | Notes |
|------|-------|
| Raast | Primary instant collection |
| JazzCash / Easypaisa | Wallet rails |
| Bank transfer | Manual + feed reconciliation |
| Card | Where merchant has acquirer |

**Reconciliation:** webhook → `payment` → `account_transaction` in → allocate invoice/party → `got` on khata → push.

**Embedded lending:** Cashflow + recovery score; supplier BNPL — **licensed partners only**.

---

## Module 10 — Reporting

**Philosophy:** Explain · predict · recommend.

| Report | Vertical |
|--------|----------|
| Aging | All |
| Account statement | All — per Cash / MCB / HBL |
| Cash vs bank summary | All |
| Season P&L | Agri, crop |
| Lot margin | Crop |
| Installment aging | Property |
| Ticket margin | Mobile |
| Pesticide register | Agri |

**AI narrative:** Numbers from DB only — no invented figures.

**Export:** PDF A4 + thermal 80mm, CSV accountant.

---

## Module 11 — Team, partners & operations

### Partners & team (governance)

| Capability | Detail |
|------------|--------|
| Creator on business create | Automatic `is_creator` |
| Invite partner (phone) | SMS / WhatsApp / in-app; deep links |
| Invite staff (role) | Scoped `BusinessUser` |
| Remove partner / staff | Not creator; PIN confirm optional |
| Team audit log | Export for disputes |

**Partner permissions:** Full business data + settings + `team.manage` (invite/remove partners & staff; **cannot** remove creator).

### Staff operations

- Profiles, attendance (optional GPS), salary advances on khata  
- Sales per staff, drawer variance  
- Payroll: base + commission − advances  

### Permission matrix (summary)

| Permission | Partner | Admin | Cashier |
|------------|:-------:|:-----:|:-------:|
| Operations (khata, stock, …) | ✓ | ✓ | Limited |
| Business settings | ✓ | — | — |
| team.manage (invite/remove) | ✓ | — | — |
| Remove creator | — | — | — |
| Delete business | ✓* | — | — |

\*Requires not last partner; confirm dialog.

---

## Module 12 — AI assistant

**Connectivity:** **Assistant chat requires internet.** **Light models on mobile** (STT, OCR, slot-fill) run on-device — including offline draft → confirm → save/outbox. **No client-side tool-calling.**

**Modes:** Chat (server), voice (local STT first, optional server refine), proposed actions with confirm.

**Architecture (Laravel owns the brain):**

```text
Flutter (light models, any connectivity)
  Mic / camera → on-device STT or OCR → slot parser → Confirm sheet → REST or outbox

Flutter / web (assistant, online)
  → POST .../ai/sessions/{id}/messages

Laravel AiAssistantService
  → tool_router (server) → query_ledger | query_stock | report_summary | draft_reminder | …
  → LLM provider (keys server-side only)
  → { reply, proposed_actions?, chart_spec? }

App
  → show reply; Confirm → normal REST — app never executes server tools locally
```

**Never:** auto-send money, auto-delete, write without confirm; never run **tool_router** on device.

**Memory:** Per-tenant patterns in Postgres; user reset via API.

**Command bar:** Online → Laravel; offline → hide or show “connect for full AI”.

**Offline UX:** Voice quick-entry still works via light models; **chat assistant** hidden with *"Poora AI ke liye internet chahiye"*.

Detail: [09 §3.1](09-technical-and-platform.md#31-mobile-light-models) · [09 §9](09-technical-and-platform.md#9-ai-pipeline-laravel-only-tool-calling).

---

## Module 13 — Notifications

| Tier | Channel | Examples |
|------|---------|----------|
| Critical | Push | Overdue, sync fail, security |
| Important | Batched 2×/day | Low stock |
| Passive | Weekly | Summary |

WhatsApp → **customers** for reminders, not owner spam.

---

## Module 14 — Offline-first

**Product rule:** Shop data is **always readable offline** from the phone’s local database. The device **keeps that data synced** whenever it has network — not only when the user opens a screen.

### Local-first reads

- All khata, party search, stock, accounts, and billing screens read from **Hive** (per `business_id`).
- No full-screen “no internet” block for core workflows after **first bootstrap**.
- Show **“Last updated …”** when stale; never an empty list solely because the network dropped.

### Device sync (push + pull)

| Direction | When |
|-----------|------|
| **Pull** (server → Hive) | App launch, foreground, connectivity restored, periodic background (~15 min), after push ack, pull-to-refresh |
| **Push** (outbox → server) | After every local write; retried with backoff when online |

**Bootstrap:** After login, full download for active business before home screen — then user can work offline immediately.

**Synced data:** parties, ledger, payments, accounts, account transactions/transfers, stock, products, branches, invoices, vertical entities (lots, tickets, …). See [09 §8.2](09-technical-and-platform.md#82-synced-entity-catalog).

### Offline writes

- Save locally → Hive + **outbox** → UI shows success.
- `SyncCoordinator` uploads when online; user sees **Pending (n)** if queue not empty.

| Conflict | Resolution |
|----------|------------|
| Edit edit | LWW or owner merge UI |
| Stock negative | Server reject |

### Not offline

- **AI assistant chat** (Module 12) — online only.
- First OTP login; uncached attachment files; live external checks (mandi rate, IMEI).

### UX states

`Synced` · `Updating…` · `Offline — last sync 2h ago` · `Pending (n) uploads`

### Implementation

- `HiveService` — typed boxes per entity  
- `SyncCoordinator` — push batch + per-entity pull cursors  
- `OutboxRepository` — durable queue  

Detail: [09 §8 — Offline-first & sync](09-technical-and-platform.md#8-offline-first--sync) · API: [11 §14.14](11-data-model-and-apis.md#1414-sync)

---

## Module 15 — Trust & security

- PIN, biometric, session revoke  
- Fraud signals, velocity limits on credit  
- `audit_log` on all mutations  
- Pakistan: SMS/WhatsApp consent, PTA/SBP awareness  

---

## Module 16 — Super-app expansion

Optional modules for mature tenants (commerce, logistics, procurement, banking) — same account, separate entitlements.

> **Not** the same as **Module 17 — Super Admin** (Lixar platform operators).

---

## Module 17 — Super Admin (platform)

**Purpose:** Internal **Lixar** console to run the SaaS — manage tenants, billing, support, and system config.

| Area | Capability |
|------|------------|
| **Dashboard** | Businesses by vertical, MAU, trials, incident metrics |
| **Tenants** | Search businesses; suspend; feature flags; trial extension |
| **Users** | Find shop login by phone; disable; force logout |
| **Billing** | Plans, per-business subscription overrides |
| **Support** | Impersonation sessions (audited, short TTL) |
| **System** | Maintenance mode, min app version, global AI kill-switch |

**Rules:**

- **Web only** (Inertia `/admin`) — never in Flutter consumer app  
- **`platform_users`** table — separate from shop `users`  
- API prefix `/api/v1/platform` — **platform guard**, not business JWT  
- Cannot remove business **creator**; cannot bypass partner RBAC except via audited impersonation  

**Entities:** `PlatformUser`, `PlatformAuditLog`, `SupportSession`, `SubscriptionPlan`, `SystemSetting`, `BusinessFeatureFlag`

**Deep dive:** [12 — Super Admin Platform](12-super-admin-platform.md) · Schema/API: [11 §3.4](11-data-model-and-apis.md#34-platform-super-admin-no-business_id), [§14.18](11-data-model-and-apis.md#1418-platform-super-admin)

---

[← Index](README.md) · **Next:** [09 — Technical & Platform](09-technical-and-platform.md)
