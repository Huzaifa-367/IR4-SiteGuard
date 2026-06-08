# 15 — QR Equipment Monitoring

[← Index](README.md) · **Next:** [16 — HSE incidents & LSR](16-hse-incidents-lsr.md)

**Module key:** `qr_equipment`  
**Hardware:** Zebra ZT411 thermal-transfer printer at SCC; polyester labels 50×50 mm minimum.

---

## 1. Purpose

Register heavy plant and equipment; print weatherproof QR labels; any smartphone on **site WiFi** scans to view record on SCC server — **no native app**, no internet.

UDPM: supports vehicle/equipment compliance workflows; weekly report vehicle violations (manual) reference equipment IDs.

---

## 2. Data model

### 2.1 `equipment_assets`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `equipment_id` | string | R — human ID e.g. `EQ-CRANE-014` |
| `name` | string | R |
| `equipment_type` | enum | `vehicle`, `crane`, `generator`, `compressor`, `plant`, `other` |
| `status` | enum | `active`, `out_of_service`, `retired` |
| `manufacturer` | string | O |
| `model` | string | O |
| `serial_number` | string | O |
| `qr_slug` | string | R — unique, URL-safe UUID or short code |
| `location_note` | string | O |
| `registered_at` | datetime | R |
| `settings` | json | custom fields |

**Unique:** `(site_id, equipment_id)`, `(site_id, qr_slug)`.

### 2.2 `equipment_documents`

| Column | Type | Notes |
|--------|------|-------|
| `equipment_asset_id` | FK | R |
| `document_type` | enum | `manual`, `certificate`, `other` |
| `title` | string | R |
| `storage_key` | string | R — PDF on SCC disk |
| `uploaded_at` | datetime | R |

### 2.3 `equipment_inspections`

| Column | Type | Notes |
|--------|------|-------|
| `equipment_asset_id` | FK | R |
| `inspected_at` | date | R |
| `inspector_name` | string | R |
| `outcome` | enum | `pass`, `fail`, `conditional` |
| `notes` | text | O |
| `next_inspection_due` | date | O |
| `created_by_user_id` | FK | O |

### 2.4 `equipment_maintenance_records`

| Column | Type | Notes |
|--------|------|-------|
| `equipment_asset_id` | FK | R |
| `performed_at` | date | R |
| `maintenance_type` | enum | `preventive`, `corrective`, `inspection` |
| `description` | text | R |
| `performed_by` | string | O |
| `next_service_due` | date | O |

### 2.5 `equipment_qr_scans` (analytics)

| Column | Type | Notes |
|--------|------|-------|
| `equipment_asset_id` | FK | R |
| `scanned_at` | datetime | R |
| `ip_address` | string | O |
| `user_agent` | string | O |

---

## 3. QR URL format

```
https://{scc_internal_host}/equipment/{qr_slug}
```

- Served over site WiFi only (internal DNS or IP).  
- QR encodes full HTTPS URL printed by Zebra driver.  
- **Slug never changes** — record updates keep same label.

### 3.1 Public scan route (unauthenticated read)

```php
// routes/web.php — no auth; rate-limited
Route::get('/equipment/{qr_slug}', [EquipmentScanController::class, 'show'])
    ->middleware(['throttle:equipment-scan']);
```

Returns Inertia page **E01** — mobile-responsive, read-only.

### 3.2 Scan page contents (E01)

| Section | Data |
|---------|------|
| Header | equipment_id, name, type, status badge |
| Manuals | Links to PDFs (`equipment_documents`) |
| Inspections | Last 10 rows + next due |
| Maintenance | History + PM schedule |
| Footer | "Data served from SCC — {site name}" |

Log scan to `equipment_qr_scans`.

---

## 4. Label generation

### 4.1 Dashboard flow (D50)

1. Create `equipment_assets` row.  
2. Upload manuals to `equipment_documents`.  
3. Enter inspection + maintenance history (or import CSV).  
4. Click **Generate QR** → platform renders PNG/SVG → send to Zebra via:  
   - **Option A:** Browser print to ZT411 Ethernet  
   - **Option B:** `POST /sites/{site}/equipment/{id}/print-label` → Laravel queue → ZPL to printer IP  

### 4.2 ZPL template (sketch)

```zpl
^XA
^FO50,50^BQN,2,6^FDQA,{full_url}^FS
^FO50,320^A0N,30,30^FD{equipment_id}^FS
^XZ
```

Media: polyester thermal-transfer, UV-resistant ([IR4 proposal §7.9](../IR4%20Technical%20Proposal_v2.docx.md)).

---

## 5. Admin CRUD (authenticated)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/sites/{site}/equipment` | `equipment.view` |
| POST | `/sites/{site}/equipment` | `equipment.manage` |
| PATCH | `/equipment/{asset}` | `equipment.manage` |
| POST | `/equipment/{asset}/inspections` | `equipment.manage` |
| POST | `/equipment/{asset}/maintenance` | `equipment.manage` |
| POST | `/equipment/{asset}/documents` | `equipment.manage` |
| POST | `/equipment/{asset}/print-label` | `equipment.print` |

---

## 6. Roles

| Role | Access |
|------|--------|
| SCC Operator / Safety Manager | Full CRUD |
| Site Staff | Scan only (E01) — matches IR4 "read-only equipment module" |
| Project Manager | `equipment.view` in dashboard, no edit |

---

## 7. Permissions

| Permission | Allows |
|------------|--------|
| `equipment.view` | List/detail in dashboard |
| `equipment.manage` | CRUD assets, inspections, maintenance, docs |
| `equipment.print` | Send ZPL to printer |

---

## 8. Commissioning

Client must supply before/during Phase 3:

- Equipment inventory list  
- Manuals (PDF)  
- Inspection history  
- PM schedules  

Incomplete data → labels work but E01 shows gaps (IR4 assumption #9).

---

## 9. Vehicle telematics link (optional)

If Teltonika FMC125 deployed ([17 §vi](17-udpm-weekly-report.md)):

- `equipment_assets.external_telematics_id` links GPS asset to QR record.  
- Not required for QR scan flow.

---

[← Index](README.md) · **Next:** [16 — HSE incidents & LSR](16-hse-incidents-lsr.md)
