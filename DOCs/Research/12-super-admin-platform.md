# 12 — Super Admin (Platform Operations)

[← Index](README.md) · [11 Data Model](11-data-model-and-apis.md) · [08 Module 17](08-product-modules.md#module-17--super-admin-platform)

**Audience:** Lixar internal team (ops, support, billing, engineering) — **not** shop owners.

> **Not the same as** business `**admin`** staff role ([06 §5.7](06-personas-and-workspace.md#57-staff-roles-non-partners)) or **Module 16** tenant super-app modules ([08](08-product-modules.md#module-16--super-app-expansion)).

---

## Table of contents

1. [Purpose & identity layers](#1-purpose--identity-layers)
2. [Architecture](#2-architecture)
3. [Authentication & sessions](#3-authentication--sessions)
4. [Roles & permission matrix](#4-roles--permission-matrix)
5. [Platform dashboard](#5-platform-dashboard)
6. [Business (tenant) management](#6-business-tenant-management)
7. [Shop user management](#7-shop-user-management)
8. [Subscriptions & billing op](#8-subscriptions--billing-ops)
9. [Support impersonation](#9-support-impersonation)
10. [Feature flags & system settings](#10-feature-flags--system-settings)
11. [Platform audit & compliance](#11-platform-audit--compliance)
12. [Content, seeds & broadcasts](#12-content-seeds--broadcasts)
13. [Incidents & operations runbooks](#13-incidents--operations-runbooks)
14. [Data model reference](#14-data-model-reference)
15. [API reference](#15-api-reference)
16. [Screens & UX](#16-screens--ux)
17. [Laravel implementation notes](#17-laravel-implementation-notes)

---

## 1. Purpose & identity layers

Operate the **Lixar SaaS platform**: onboard tenants, enforce billing, support shops, run migrations, and control global behavior.


| Layer                 | Table            | App surface         | Token                                              |
| --------------------- | ---------------- | ------------------- | -------------------------------------------------- |
| **Platform operator** | `platform_users` | Inertia `/admin`    | Session + optional `X-Platform-Token` (automation) |
| **Shop user**         | `users`          | Flutter / owner web | JWT (`sub`, `allowed_business_ids[]`)              |
| **Business member**   | `business_users` | Same as shop user   | JWT + `business_id` + `membership_role`            |


```text
                    ┌─────────────────────┐
                    │  Super Admin Web    │
                    │  admin.lixar.pk       │
                    └──────────┬──────────┘
                               │ /api/v1/platform/*
                               ▼
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│ Flutter POS  │────▶│  Laravel API        │◀────│ Webhooks     │
│ JWT tenant   │     │  TenantMiddleware   │     │ Raast, etc.  │
└──────────────┘     │  + business.status  │     └──────────────┘
                     └─────────────────────┘
```

**Hard rules**

- Mobile app **never** exposes super-admin UI or platform routes.
- Platform staff **never** receive a normal shop JWT with wildcard `business_id`.
- Removing a business **creator** is **only** via partner governance — platform can suspend the **business**, not delete the founder row without legal process.
- All tenant data access in support mode goes through `**support_sessions`** (audited).

---

## 2. Architecture

### 2.1 Route groups (Laravel)


| Group          | Prefix                       | Middleware                              | Purpose        |
| -------------- | ---------------------------- | --------------------------------------- | -------------- |
| Tenant API     | `/api/v1/businesses/{bid}/…` | `auth:jwt`, `tenant`, `business.active` | Shop app       |
| Platform API   | `/api/v1/platform/…`         | `auth:platform`, `platform.active`      | Admin SPA JSON |
| Platform pages | `/admin/…`                   | `auth:platform`, Inertia                | Admin UI       |
| Webhooks       | `/webhooks/…`                | signature verify                        | External       |
| Health         | `/health`                    | none                                    | Monitoring     |


### 2.2 `business.active` middleware

On every tenant request:

```text
1. Resolve business_id from route or JWT
2. Load business.status
3. If suspended → 403 { code: "BUSINESS_SUSPENDED", message_ur: "..." }
4. If pending_deletion → 403 except GET export endpoints (grace window)
5. If support_session header present → validate token, attach support_session_id to audit context
```

### 2.3 Data access boundaries


| Data                   | Default platform list view | Full row access                    |
| ---------------------- | -------------------------- | ---------------------------------- |
| Business metadata      | ✓                          | ✓                                  |
| User phone / name      | ✓ masked partial optional  | ✓ with `users.view_pii` permission |
| Party names / balances | ✗                          | Support session only               |
| Ledger lines           | ✗                          | Support session only               |
| Platform audit         | ✓                          | ✓                                  |


---

## 3. Authentication & sessions

### 3.1 Login flow

```text
1. POST /platform/auth/login { email, password }
2. If invalid → 401 (generic message, no user enumeration)
3. If valid + 2FA enabled → 428 { requires_totp: true }
4. POST /platform/auth/totp { totp_code } OR step 1 includes totp_code
5. Create platform_user_sessions row; Set-Session cookie (httpOnly, secure, sameSite=lax)
6. Return platform_user + role + permissions[]
```

### 3.2 Session security


| Control             | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Session lifetime    | 8h idle, 24h absolute                                               |
| Concurrent sessions | Allowed; list & revoke in PA10                                      |
| Password policy     | Min 12 chars; breach list check (HIBP API)                          |
| 2FA                 | TOTP required for `super_admin`, `support`, `billing` in production |
| IP allowlist        | Optional per `platform_users.allowed_ips[]`                         |
| Failed logins       | Lock account 15 min after 10 failures / hour                        |


### 3.3 Automation tokens (`platform_api_tokens`)

For CI/scripts (Stripe sync, metrics export) — **not** for human browsers.


| Column       | Notes                                              |
| ------------ | -------------------------------------------------- |
| `name`       | `stripe-webhook-processor`                         |
| `token_hash` | Bearer token shown once at create                  |
| `scopes[]`   | `billing.read`, `metrics.read` — never `*` in prod |
| `expires_at` | Required                                           |


---

## 4. Roles & permission matrix

Base role sets **permissions**. `platform_users.permissions[]` can add/remove (super_admin only).

### 4.1 Permission keys

```text
platform.users.manage          # CRUD platform_users
businesses.list                # List/search tenants
businesses.view                # Detail metadata
businesses.suspend             # status → suspended
businesses.delete              # Soft-delete tenant
businesses.feature_flags       # PUT flags
businesses.migrate_vertical    # Dangerous migration
businesses.extend_trial
businesses.view_pii            # Unmasked phones in lists
users.list
users.view
users.disable
users.force_logout
subscriptions.manage           # Plans + per-tenant subscription
subscriptions.export
support.impersonate            # Create support_sessions
support.impersonate_write      # Allow POST in impersonation mode
audit.view
system.settings
content.seed                   # Catalog seeds
content.broadcast              # Push banners
metrics.export
```

### 4.2 Role → default permissions


| Permission                   | super_admin | support | billing | content | readonly |
| ---------------------------- | ----------- | ------- | ------- | ------- | -------- |
| platform.users.manage        | ✓           | —       | —       | —       | —        |
| businesses.list / view       | ✓           | ✓       | ✓       | ✓       | ✓        |
| businesses.suspend           | ✓           | ✓*      | —       | —       | —        |
| businesses.delete            | ✓           | —       | —       | —       | —        |
| businesses.feature_flags     | ✓           | —       | —       | ✓       | —        |
| businesses.migrate_vertical  | ✓           | —       | —       | —       | —        |
| businesses.extend_trial      | ✓           | —       | ✓       | —       | —        |
| businesses.view_pii          | ✓           | ✓       | —       | —       | —        |
| users.list / view            | ✓           | ✓       | ✓       | —       | ✓        |
| users.disable / force_logout | ✓           | ✓       | —       | —       | —        |
| subscriptions.manage         | ✓           | —       | ✓       | —       | —        |
| support.impersonate          | ✓           | ✓       | —       | —       | —        |
| support.impersonate_write    | ✓           | —       | —       | —       | —        |
| audit.view                   | ✓           | ✓       | ✓       | ✓       | ✓        |
| system.settings              | ✓           | —       | —       | —       | —        |
| content.seed / broadcast     | ✓           | —       | —       | ✓       | —        |
| metrics.export               | ✓           | —       | ✓       | —       | ✓        |


Support may suspend only with `suspended_reason` + ticket ID required in UI.

---

## 5. Platform dashboard

### 5.1 KPI cards (PA02)


| KPI                     | Definition                                                     | Source                   |
| ----------------------- | -------------------------------------------------------------- | ------------------------ |
| **Active businesses**   | `status = active`                                              | `businesses`             |
| **Suspended**           | `status = suspended`                                           | `businesses`             |
| **MAU**                 | Distinct `users` with `last_login_at` in 30d                   | `users`                  |
| **New businesses (7d)** | `created_at` window                                            | `businesses`             |
| **Trials ending (7d)**  | `subscription.status = trialing` AND `current_period_end` soon | `business_subscriptions` |
| **MRR (PKR)**           | Sum active paid plans                                          | computed                 |
| **Sync failures (24h)** | `outbox_events` or sync log `status=conflict` count            | metrics table            |
| **AI errors (24h)**     | `ai_audit_logs` with error flag                                | `ai_audit_logs`          |


### 5.2 Charts


| Chart                              | Granularity        |
| ---------------------------------- | ------------------ |
| Signups by vertical                | Daily, stacked bar |
| Active users                       | Weekly line        |
| Churn (suspended + cancelled subs) | Monthly            |


### 5.3 Activity feed (platform)

Last 50 `platform_audit_logs` + critical system events (webhook failures).

---

## 6. Business (tenant) management

### 6.1 List filters (PA03)


| Filter        | Parameter                                         |
| ------------- | ------------------------------------------------- |
| Search        | Name, creator phone, `business.id`                |
| Vertical      | `agri_inputs`, `crop_trade`, `property`, `mobile` |
| Status        | `active`, `suspended`, `pending_deletion`         |
| Plan          | `starter`, `pro`, `trial`                         |
| Region        | `region_code`                                     |
| Created       | Date range                                        |
| Last activity | No login 30d (churn risk)                         |


### 6.2 Business detail tabs (PA04)


| Tab              | Contents                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| **Overview**     | Name, vertical, status, creator, created, last sync, party count, storage      |
| **Team**         | `business_users` read-only list — roles, status, **cannot** edit partners here |
| **Subscription** | Plan, period, Stripe id, extend trial button                                   |
| **Usage**        | Ledger entries 30d, AI messages, storage MB                                    |
| **Flags**        | Toggle `business_feature_flags`                                                |
| **Notes**        | Internal `business_notes` (support only)                                       |
| **Audit**        | Tenant `audit_logs` + `platform_audit_logs` for this `business_id`             |
| **Danger**       | Suspend, schedule deletion, migrate vertical                                   |


### 6.3 Business lifecycle

```text
active ──suspend──▶ suspended ──unsuspend──▶ active
   │                    │
   │                    └──▶ (optional) pending_deletion
   └──schedule delete──▶ pending_deletion ──purge job──▶ (anonymized archive)
```


| Status             | Shop app                     | Sync          |
| ------------------ | ---------------------------- | ------------- |
| `active`           | Normal                       | Normal        |
| `suspended`        | 403 on API; banner if cached | Reject writes |
| `pending_deletion` | Read-only export 30d         | Reject all    |


### 6.4 Suspend workflow

```text
1. Support opens business → Danger → Suspend
2. Required: reason enum + free text + optional Zendesk ticket #
3. PATCH /platform/businesses/{bid} { status: "suspended", suspended_reason, suspended_at }
4. platform_audit_log row
5. Optional: push notify partners "Account temporarily disabled — contact support"
6. All JWTs for that business_id fail business.active on next request
```

**Suspend reason enums:** `payment_overdue`, `abuse`, `legal_request`, `security_incident`, `other`

### 6.5 Soft delete workflow

```text
1. super_admin only
2. Type business name to confirm
3. status → pending_deletion; scheduled_purge_at = now + 30 days
4. Email creator (if configured)
5. Nightly job: after purge date, anonymize PII, retain aggregates for billing disputes
```

### 6.6 Vertical migration (super_admin)

```text
1. Export tenant package (JSON): parties, ledger, vertical-specific tables
2. Create NEW business with target vertical (empty)
3. Run migration script (eng-maintained) — never automatic for production without review
4. Link old → new in business_notes
5. Creator manually switches in app (or support instructs)
```

---

## 7. Shop user management

### 7.1 User list (PA05)


| Column shown     | Notes                                  |
| ---------------- | -------------------------------------- |
| Phone            | Mask `+92300***4567` unless `view_pii` |
| Name             |                                        |
| Businesses count | Links to memberships                   |
| Last login       |                                        |
| Status           | active / disabled                      |
| Devices          | Count                                  |


### 7.2 User detail (PA06)

- Memberships table: business name, vertical, role, `is_creator`, status  
- Devices: platform, last seen, push token present  
- Recent platform actions affecting this user (audit)

### 7.3 Disable user

```text
users.status = disabled
→ OTP login rejected
→ Existing JWTs invalidated on next request (token version bump users.token_version)
```

### 7.4 Force logout

Revoke all `user_devices`; increment `users.token_version`.

### 7.5 Phone dispute / merge (super_admin)

Rare: two phones claimed same business. Manual merge requires eng script + audit — **not** self-serve UI in v1 (document procedure only).

---

## 8. Subscriptions & billing ops

### 8.1 Plans (PA07)


| Plan code    | Typical limits             | PKR/mo (indicative) |
| ------------ | -------------------------- | ------------------- |
| `trial`      | 1 branch, 2 staff, 14 days | 0                   |
| `starter`    | 1 branch, 5 staff          | TBD                 |
| `pro`        | 3 branches, 20 staff, AI   | TBD                 |
| `enterprise` | Custom                     | Sales               |


`**subscription_plans.limits` json:**

```json
{
  "max_branches": 3,
  "max_staff": 20,
  "max_parties": null,
  "ai_messages_per_day": 100,
  "whatsapp_bsp": true,
  "storage_mb": 5000
}
```

### 8.2 Per-business subscription


| Field                      | Platform can edit                             |
| -------------------------- | --------------------------------------------- |
| `plan_code`                | billing, super_admin                          |
| `status`                   | `trialing`, `active`, `past_due`, `cancelled` |
| `current_period_end`       | extend trial                                  |
| `external_subscription_id` | Stripe subscription id                        |


### 8.3 Enforcement hooks (tenant API)

When limit exceeded:


| Limit                 | Behavior                                     |
| --------------------- | -------------------------------------------- |
| `max_staff`           | Block new `business_invites`                 |
| `max_branches`        | Block branch create                          |
| `ai_messages_per_day` | 429 on AI endpoint                           |
| `past_due`            | Banner + grace 7d then auto-suspend optional |


### 8.4 Billing export

CSV: business_id, name, plan, MRR, status, creator phone, vertical — `subscriptions.export` permission.

---

## 9. Support impersonation

### 9.1 Session creation

```http
POST /api/v1/platform/support-sessions
{
  "business_id": "uuid",
  "reason": "Ticket #4521 — sync stuck",
  "ticket_ref": "ZD-4521",
  "mode": "read_only"   // or "read_write" if support.impersonate_write
}
```

**Response:**

```json
{
  "data": {
    "support_session_id": "uuid",
    "impersonation_token": "eyJ...",
    "expires_at": "2026-05-17T15:20:00+05:00",
    "viewer_url": "https://app.lixar.pk/support-view?token=..."
  }
}
```

### 9.2 Impersonation JWT claims

```json
{
  "typ": "support",
  "support_session_id": "uuid",
  "platform_user_id": "uuid",
  "business_id": "uuid",
  "mode": "read_only",
  "exp": 1715952000
}
```

Tenant API accepts:

```http
Authorization: Bearer {impersonation_token}
X-Lixar-Support-Session: {support_session_id}
```

Every write logs:

- `audit_logs` with `actor_type: support`, `support_session_id`  
- Duplicate row in `platform_audit_logs`

### 9.3 UI banner (owner web / future mobile)

```text
┌────────────────────────────────────────────────────────────┐
│ ⚠ Lixar support is helping with this account (read-only)   │
│ Session #4521 · Expires in 8 min · [End session]           │
└────────────────────────────────────────────────────────────┘
```

### 9.4 Mode matrix


| Action                     | read_only | read_write |
| -------------------------- | --------- | ---------- |
| GET parties, ledger, stock | ✓         | ✓          |
| POST ledger / payment      | ✗         | ✓*         |
| Invite partner             | ✗         | ✗          |
| Delete business            | ✗         | ✗          |
| Change subscription        | ✗         | ✗          |


read_write still blocks partner/team/billing mutations.

### 9.5 Session end

- Auto-expire at `expires_at`  
- Manual **End session** in banner or admin UI  
- `DELETE /platform/support-sessions/{sid}`

---

## 10. Feature flags & system settings

### 10.1 Global `system_settings`


| Key                             | Type     | Default | Description                      |
| ------------------------------- | -------- | ------- | -------------------------------- |
| `maintenance_mode`              | bool     | false   | All tenant APIs 503 with message |
| `maintenance_allowlist_ips`     | string[] | []      | Bypass for Lixar office          |
| `min_app_version_android`       | string   | `1.0.0` | Force upgrade below              |
| `min_app_version_ios`           | string   | `1.0.0` |                                  |
| `ai_enabled_globally`           | bool     | true    | Kill all AI                      |
| `otp_rate_limit_per_phone_hour` | int      | 5       |                                  |
| `otp_rate_limit_per_ip_hour`    | int      | 20      |                                  |
| `sync_max_batch_size`           | int      | 100     |                                  |
| `support_session_ttl_minutes`   | int      | 15      |                                  |
| `trial_duration_days`           | int      | 14      | New businesses                   |
| `default_locale`                | string   | `ur-PK` |                                  |
| `incident_banner_message`       | string   | null    | Shown in app home                |
| `incident_banner_severity`      | enum     | null    | `info`, `warning`, `critical`    |


### 10.2 Per-business `business_feature_flags`


| `flag_key`              | Default      | Effect when false                                                          |
| ----------------------- | ------------ | -------------------------------------------------------------------------- |
| `ai_assistant`          | true         | Hide AI; API 403                                                           |
| `whatsapp_bsp`          | false        | Manual share only                                                          |
| `multi_branch`          | true         | Single branch only                                                         |
| `offline_writes`        | true         | When false: block offline **writes** only; reads still from last Hive sync |
| `voice_entry`           | true         | Mic disabled                                                               |
| `raast_payments`        | true         | No QR generation                                                           |
| `partner_invites`       | true         | Block new partners                                                         |
| `export_pdf`            | true         | Block statements                                                           |
| `crop_vertical_modules` | per vertical | N/A — vertical fixed at create                                             |
| `beta_features`         | false        | Experimental UI                                                            |


---

## 11. Platform audit & compliance

### 11.1 `platform_audit_logs` actions (catalog)


| Action                                    | Trigger            |
| ----------------------------------------- | ------------------ |
| `platform_user.login`                     | Successful login   |
| `platform_user.login_failed`              | Failed attempt     |
| `business.suspend` / `business.unsuspend` | Status change      |
| `business.delete_scheduled`               | pending_deletion   |
| `business.feature_flags.update`           | PUT flags          |
| `business.trial_extended`                 | days added         |
| `business.migrate_vertical`               | Migration started  |
| `user.disable` / `user.enable`            |                    |
| `user.force_logout`                       |                    |
| `subscription.update`                     | Plan/status change |
| `support_session.create` / `.end`         |                    |
| `system_setting.update`                   |                    |
| `platform_user.create` / `.update`        |                    |


### 11.2 Retention


| Log type              | Retention                                   |
| --------------------- | ------------------------------------------- |
| `platform_audit_logs` | 7 years (configurable)                      |
| `support_sessions`    | 2 years                                     |
| Tenant `audit_logs`   | Tenant-owned; platform can view via support |


### 11.3 PII access policy

- Support role: impersonation only for ledger/farmer data  
- Export of all parties CSV: **super_admin** + legal approval  
- Audit review: monthly sample of `support_session` durations & actions

---

## 12. Content, seeds & broadcasts

### 12.1 Catalog seeds (`content.seed`)


| Seed pack                   | Vertical | Action                             |
| --------------------------- | -------- | ---------------------------------- |
| `unit_definitions_pakistan` | agri     | POST presets to business or global |
| `device_catalog_2026_q1`    | mobile   | Brands/models (no wipe of custom)  |
| `commodity_defaults_punjab` | crop     | Commodity + maund kg               |


**Rule:** Seeds **add** — never delete tenant custom rows without explicit super_admin wipe flag.

### 12.2 Broadcasts (`platform_broadcasts`)


| Field                   | Notes                                             |
| ----------------------- | ------------------------------------------------- |
| `title`                 | Roman Urdu + English                              |
| `body`                  |                                                   |
| `target`                | `all` | `vertical:agri_inputs` | `business_ids[]` |
| `severity`              | `info`, `warning`                                 |
| `starts_at` / `ends_at` |                                                   |
| `dismissible`           | bool                                              |


Shown on tenant home until dismissed (per user device localStorage + server ack).

---

## 13. Incidents & operations runbooks

### 13.1 Global AI outage

```text
1. Set system_settings.ai_enabled_globally = false
2. Set incident_banner severity=critical
3. Monitor error rate drop
4. Root-cause LLM provider
5. Re-enable gradually
```

### 13.2 Sync storm (bad client release)

```text
1. Identify version via user_agent in sync logs
2. Set business_feature_flags.offline_writes = false for all OR per vertical (reads still cached)
3. Raise min_app_version_android
4. Hotfix release
```

### 13.3 Abusive tenant

```text
1. Suspend business (reason: abuse)
2. Preserve audit_logs
3. Legal escalation if fraud
```

---

## 14. Data model reference

Full columns: [11 — §3.4](11-data-model-and-apis.md#34-platform-super-admin-no-business_id).

### 14.1 Entity summary


| Entity                     | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `platform_users`           | Internal staff accounts                   |
| `platform_user_sessions`   | Login sessions (revoke list)              |
| `platform_api_tokens`      | Automation bearer tokens                  |
| `platform_audit_logs`      | Immutable admin audit                     |
| `support_sessions`         | Impersonation                             |
| `subscription_plans`       | Plan catalog                              |
| `business_subscriptions`   | Tenant billing (existing; platform edits) |
| `system_settings`          | Global key/value                          |
| `business_feature_flags`   | Per-tenant toggles                        |
| `business_notes`           | Internal support notes                    |
| `platform_broadcasts`      | In-app banners                            |
| `business_usage_snapshots` | Daily aggregates for dashboard            |


### 14.2 `business_notes`


| Column             | Type   | R/O | Notes            |
| ------------------ | ------ | --- | ---------------- |
| `business_id`      | `uuid` | R   |                  |
| `platform_user_id` | `uuid` | R   | Author           |
| `body`             | `text` | R   | Markdown         |
| `is_pinned`        | `bool` | O   | Show top of PA04 |


---

## 15. API reference

Complete endpoint list: [11 — §14.18](11-data-model-and-apis.md#1418-platform-super-admin).

### 15.1 Example: suspend business

```http
PATCH /api/v1/platform/businesses/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "status": "suspended",
  "suspended_reason": "payment_overdue",
  "suspended_note": "Invoice #INV-992 overdue 45 days",
  "ticket_ref": "ZD-8821"
}
```

### 15.2 Example: extend trial

```http
POST /api/v1/platform/businesses/{bid}/extend-trial
{ "days": 14, "note": "Agreed on WhatsApp sales call" }
```

### 15.3 Error codes (platform)


| Code                      | HTTP | Meaning                      |
| ------------------------- | ---- | ---------------------------- |
| `PLATFORM_UNAUTHORIZED`   | 401  | Not logged in                |
| `PLATFORM_FORBIDDEN`      | 403  | Missing permission           |
| `BUSINESS_SUSPENDED`      | 403  | Tenant middleware (shop app) |
| `SUPPORT_SESSION_EXPIRED` | 401  | Impersonation token expired  |
| `TOTP_REQUIRED`           | 428  | 2FA step needed              |


---

## 16. Screens & UX


| ID   | Screen             | Key components                                       |
| ---- | ------------------ | ---------------------------------------------------- |
| PA01 | Login + 2FA        | Email, password, TOTP, forgot password (email reset) |
| PA02 | Dashboard          | KPI cards, charts, activity feed                     |
| PA03 | Businesses list    | Filters, export CSV, bulk suspend (super_admin)      |
| PA04 | Business detail    | Tabs §6.2, sticky status badge                       |
| PA05 | Users list         | Phone search prominent                               |
| PA06 | User detail        | Memberships, force logout                            |
| PA07 | Subscription plans | CRUD plans, limit editor JSON                        |
| PA08 | System settings    | Grouped: App, AI, OTP, Incidents                     |
| PA09 | Platform audit log | Filter by user, action, date                         |
| PA10 | Platform users     | Invite platform user, assign role, revoke sessions   |
| PA11 | Support sessions   | Active sessions map, force end                       |
| PA12 | Broadcasts         | Create/target banner                                 |
| PA13 | Business notes     | Thread on PA04                                       |


**Design:** Use distinct **slate/indigo** admin theme — not emerald shop branding — so operators never confuse with tenant app.

---

## 17. Laravel implementation notes

### 17.1 Packages

- **Inertiajs/inertia-laravel** + Vue 3 or React  
- **spatie/laravel-permission** optional — or native `PlatformGate` policies  
- **laravel/fortify** patterns for platform password reset (separate guard)

### 17.2 Policies

```php
// app/Policies/Platform/BusinessPolicy.php
public function suspend(PlatformUser $user, Business $business): bool
{
    return $user->hasPermission('businesses.suspend');
}
```

### 17.3 Jobs


| Job                            | Trigger      |
| ------------------------------ | ------------ |
| `PurgeDeletedBusinessJob`      | Daily        |
| `SnapshotBusinessUsageJob`     | Daily        |
| `ExpireSupportSessionsJob`     | Every minute |
| `EnforceSubscriptionLimitsJob` | Hourly       |


### 17.4 Observability

- Tag logs: `platform_user_id`, `support_session_id`  
- Metric: `platform.support_sessions.active`  
- Alert: >10 suspensions/hour (possible compromise)

---

[← Index](README.md) · [11 Data Model](11-data-model-and-apis.md)