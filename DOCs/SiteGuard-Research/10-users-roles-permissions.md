# 10 — Users, Roles & Permissions (Laravel)

[← Index](README.md) · [11 AI Assistant](11-ai-assistant.md) · **Next:** [05 Technical architecture](05-technical-architecture.md)

**Stack:** Laravel 11 · [spatie/laravel-permission](https://github.com/spatie/laravel-permission) · Session auth for Inertia dashboard · Sanctum or custom token for ingest (machines).

---

## 1. Design goals

| Goal | Approach |
|------|----------|
| **One fixed full-access role** | `super_admin` — system role, always every permission, cannot be deleted or stripped |
| **Everything else dynamic** | Admins create **roles** in the UI and tick **permissions** from the catalog |
| Fine-grained access | Permissions on routes, policies, and Inertia gates |
| Multi-site | `site_user` pivot + optional `sites.access_all` on a role |
| Audit | `activity_log` + `alert_actions` — who changed what |
| No worker logins | Only office / HSE staff |

---

## 2. Fixed vs dynamic (summary)

| Artifact | Fixed or dynamic | Who manages |
|----------|------------------|-------------|
| **Role `super_admin`** | **Fixed** — seeded once, `is_system = true` | Cannot delete; permissions auto-sync to full catalog |
| **All other roles** | **Dynamic** — CRUD in dashboard | Users with `roles.manage` |
| **Permission catalog** | **Seeded** on deploy/migrate (not user-created) | Developers add new permissions in migrations |
| **User → role assignment** | **Dynamic** | Users with `users.manage` |
| **User → site assignment** | **Dynamic** | Users with `users.manage` (unless role has `sites.access_all`) |

```text
┌─────────────────────────────────────────────────────────────┐
│  Permission catalog (migrations)                             │
│  sites.view · cameras.create · roles.manage · …            │
└───────────────────────────┬─────────────────────────────────┘
                            │ assigned via UI
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  super_admin          HSE Manager          Site Viewer
  (FIXED, all perms)   (dynamic role)       (dynamic role)
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │ users.manage
                            ▼
                      User accounts
```

---

## 3. Packages & setup

```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

**Config:** `config/permission.php` — cache enabled in production; teams feature **disabled** (single project).

**User model:**

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;

    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'site_user');
    }

    public function canAccessSite(int $siteId): bool
    {
        if ($this->hasRole('super_admin') || $this->can('sites.access_all')) {
            return true;
        }
        return $this->sites()->whereKey($siteId)->exists();
    }
}
```

---

## 4. System role — `super_admin` (fixed)

| Property | Rule |
|----------|------|
| `roles.name` | `super_admin` |
| `roles.is_system` | `true` |
| Permissions | **Always** all rows in `permissions` — re-sync on `php artisan permission:cache-reset` / app boot listener |
| Delete role | **Forbidden** |
| Rename role | **Forbidden** |
| Remove from user | Allowed only if another `super_admin` remains |
| Site pivot | **Not required** — sees all sites |
| UI | Shown with lock icon; permission checkboxes disabled (“Full access”) |

**Gate::before** (recommended):

```php
Gate::before(function (User $user, string $ability) {
    if ($user->hasRole('super_admin')) {
        return true;
    }
    return null;
});
```

**Bootstrap:** First install creates one user `admin@siteguard.local` with `super_admin`. At least one `super_admin` must always exist.

---

## 5. Dynamic roles

### 5.1 Creating and editing roles

| Action | Permission | Rules |
|--------|------------|-------|
| List roles | `roles.view` | |
| Create role | `roles.manage` | Name unique; `is_system = false` |
| Edit role permissions | `roles.manage` | Cannot edit `super_admin` |
| Delete role | `roles.manage` | Cannot delete `super_admin`; cannot delete role if users still assigned (or force reassign) |
| Duplicate role | `roles.manage` | “Copy from HSE Manager” — clones permission set |

### 5.2 Role templates (optional seed, not fixed roles)

On first install, seed **suggested** dynamic roles users may edit or delete:

| Template name | Typical permissions (starting point) |
|---------------|-----------------------------------|
| HSE Manager | `sites.view`, `sites.update`, `modules.configure`, `cameras.*`, `zones.manage`, `rules.manage`, `alerts.*`, `investigations.manage`, `reports.export`, `ai.assistant.use` |
| Site Supervisor | `sites.view`, `cameras.view`, `cameras.update`, `zones.manage`, `alerts.view`, `alerts.acknowledge`, `investigations.manage` |
| Viewer | `sites.view`, `cameras.view`, `alerts.view`, `reports.export` |
| **SCC Operator** (IR4) | `alerts.*`, `rfid.view`, `gas.view`, `environmental.view`, `cameras.view`, `lsr.actions_update`, `hse_incidents.view` |
| **Safety Manager** (IR4) | SCC Operator + `workers.manage`, `hse_incidents.classify`, `udpm.approve`, `equipment.manage` |
| **Project Manager** (IR4) | `udpm.view`, `rfid.view`, `reports.export` — read-only |
| **SA Representative** (IR4) | View-only subset + `is_sa_readonly` |

These are **normal** `roles` rows (`is_system = false`) — operators may rename, change permissions, or delete them.

### 5.3 `roles` table extensions

| Column | Type | Notes |
|--------|------|-------|
| `name` | `string` | Unique |
| `guard_name` | `string` | `web` |
| `is_system` | `bool` | Only `super_admin` = true |
| `description` | `text` | O — shown in admin UI |
| `sites.access_all` | via permission | Not a column — assign permission to role |

---

## 6. Permission catalog (seeded, assignable)

Naming: `{resource}.{action}` — lowercase, dot-separated. **Users do not invent permissions** — new features ship new permissions via migration + seeder.

### 6.1 Sites & locations

| Permission | Allows |
|------------|--------|
| `sites.view` | List/view sites user may access |
| `sites.create` | Create site |
| `sites.update` | Edit site metadata, shifts, map |
| `sites.delete` | Archive/delete site |
| `sites.access_all` | Bypass `site_user` — all sites (use sparingly) |
| `locations.manage` | CRUD `site_locations` tree |

### 6.2 Detection modules & cameras

| Permission | Allows |
|------------|--------|
| `modules.view` | See enabled modules per site |
| `modules.configure` | Enable/disable module, edit module `settings` JSON |
| `cameras.view` | List cameras |
| `cameras.create` | Add camera (site + module + location) |
| `cameras.update` | RTSP, location, zones, angles, settings |
| `cameras.delete` | Remove / deactivate camera |

### 6.3 Zones & rules

| Permission | Allows |
|------------|--------|
| `zones.manage` | Draw/edit polygons |
| `rules.view` | View rule catalog |
| `rules.manage` | Create/edit rules, attach to zones |

### 6.4 Alerts & investigations

| Permission | Allows |
|------------|--------|
| `alerts.view` | Alert inbox & detail |
| `alerts.acknowledge` | Acknowledge open alert |
| `alerts.dismiss` | Dismiss / false positive |
| `alerts.assign` | Assign to user |
| `investigations.manage` | Create/close investigations |

### 6.5 AI assistant

| Permission | Allows |
|------------|--------|
| `ai.assistant.use` | Chat, command bar, confirmed proposed actions |
| `ai.assistant.admin` | View `ai_audit_logs`, site AI prefs |

Requires `settings.ai_enabled = true` globally.

### 6.6 Users, roles & system

| Permission | Allows |
|------------|--------|
| `users.view` | List users |
| `users.manage` | Create/edit users, assign roles & sites |
| `roles.view` | List roles & permission matrix |
| `roles.manage` | Create/edit/delete **dynamic** roles |
| `reports.export` | PDF/CSV compliance export |
| `api_tokens.manage` | Python ingest tokens |
| `settings.manage` | Global retention, notifications, `ai_enabled` |
| `integrations.manage` | Webhooks, API keys for site provisioning |

### 6.7 RFID & workers

| Permission | Allows |
|------------|--------|
| `rfid.view` | RFID map, headcount (aggregated) |
| `rfid_zones.manage` | Zones, readers, geofence rules |
| `workers.view` | Worker names, gate log |
| `workers.manage` | CRUD workers, tags, device approval |
| `gate_log.view` | Entry/exit audit |
| `evacuation.generate` | Evacuation report |
| `portable_devices.manage` | Device approval register |

### 6.8 Gas, environmental, equipment

| Permission | Allows |
|------------|--------|
| `gas.view` | Live gas dashboard |
| `gas_thresholds.manage` | Site gas limits |
| `environmental.view` | CO₂ + weather dashboards |
| `sensors.manage` | Sensor devices, Modbus maps |
| `equipment.view` | Equipment registry |
| `equipment.manage` | CRUD, inspections, maintenance |
| `equipment.print` | Zebra label print |

### 6.9 HSE, LSR, UDPM

| Permission | Allows |
|------------|--------|
| `hse_incidents.view` | Incident list |
| `hse_incidents.classify` | Classification form |
| `lsr.view` | LSR log |
| `lsr.log_manual` | Manual LSR entry |
| `lsr.actions_update` | Add actions_taken |
| `vehicle_violations.log` | UDPM §vii manual |
| `udpm.view` | Report preview/history |
| `udpm.generate` | Regenerate report |
| `udpm.approve` | Approve weekly report |
| `udpm.export` | PDF/CSV download |

### 6.10 SA representative constraint

Role flag `is_sa_readonly = true` (column on `roles`):

- Grants view permissions only  
- **Denies** `reports.export`, `udpm.export`, bulk media download  
- All page views logged to `security_audit_log`

---

## 7. Users & site assignment

### 7.1 `site_user` pivot

| Column | Notes |
|--------|-------|
| `user_id` | |
| `site_id` | |
| `is_primary` | Default site in header switcher |

**Rules:**

- User with `sites.access_all` or `super_admin` → pivot optional.
- Any other role → **≥1 site** required at save time (`users.manage` validation).
- User may hold **multiple dynamic roles** only if you enable Spatie multi-role; recommended: **one role per user** for clarity (enforce in `UserController`).

### 7.2 Middleware

```php
// EnsureSiteAccess.php
public function handle(Request $request, Closure $next): Response
{
    $site = $request->route('site');
    if (!$request->user()->canAccessSite($site->id)) {
        abort(403);
    }
    return $next($request);
}
```

### 7.3 Policies

```php
public function update(User $user, Camera $camera): bool
{
    return $user->can('cameras.update')
        && $user->canAccessSite($camera->site_id);
}
```

---

## 8. Route protection (Inertia)

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('roles', RoleController::class)
        ->middleware('permission:roles.view|roles.manage');

    Route::post('/sites/{site}/cameras', [CameraController::class, 'store'])
        ->middleware(['site.access', 'permission:cameras.create']);
});
```

**Inertia shared props:**

```php
'auth' => [
    'user' => $user,
    'permissions' => $user->getAllPermissions()->pluck('name'),
    'roles' => $user->getRoleNames(),
    'is_super_admin' => $user->hasRole('super_admin'),
    'site_ids' => $user->can('sites.access_all')
        ? Site::pluck('id')
        : $user->sites()->pluck('sites.id'),
],
```

**Vue:**

```js
export function can(permission) {
  const auth = usePage().props.auth;
  if (auth.is_super_admin) return true;
  return auth.permissions.includes(permission);
}
```

---

## 9. Administration screens

| Screen | Permission | Actions |
|--------|------------|---------|
| U01 Users list | `users.view` | Search, filter by role |
| U02 Create user | `users.manage` | Name, email, **pick role**, assign sites |
| U03 Edit user | `users.manage` | Change role, sites, deactivate |
| U05 Roles & permissions | `roles.view` / `roles.manage` | Create role, permission checklist, duplicate, delete |

**Deactivate:** `users.is_active = false` — cannot login; audit attribution preserved.

**Protect super_admin:** Cannot remove last `super_admin`; non–super-admins cannot assign `super_admin` unless they are `super_admin`.

---

## 10. Machine users (Python) — not Spatie roles

Ingest tokens are **not** `User` rows — one per camera — see [07 §3.5](07-data-model-and-apis.md#35-ingest_api_tokens-python).

Dashboard users never share tokens with Python.

---

## 11. Seeders

```php
// PermissionsCatalogSeeder — run on every deploy
foreach ($this->permissionList() as $name) {
    Permission::findOrCreate($name, 'web');
}

// SystemRoleSeeder — once
$super = Role::findOrCreate('super_admin', 'web');
$super->update(['is_system' => true, 'description' => 'Full system access (fixed)']);
$super->syncPermissions(Permission::all());

// Optional templates — editable/deletable
$this->seedRoleTemplate('HSE Manager', [/* permission names */]);
```

When a **new permission** is added in a release, migration runs seeder; `super_admin` sync picks it up automatically; dynamic roles keep their explicit set until an admin edits them.

---

## 12. Audit & compliance

| Event | Logged |
|-------|--------|
| Role created / permissions changed | `activity_log` — before/after permission array |
| User role or site assignment changed | `activity_log` |
| Login / failed login | Auth log |
| Alert acknowledge/dismiss | `alert_actions.user_id` |
| Camera/zone/location change | `activity_log` |

---

[← Index](README.md) · **Next:** [05 — Technical architecture](05-technical-architecture.md)
