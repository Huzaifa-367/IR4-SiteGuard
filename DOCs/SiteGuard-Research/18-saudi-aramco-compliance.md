# 18 — Saudi Aramco Compliance & On-Premise Deployment

[← Index](README.md) · **Reference:** [IR4 Technical Proposal](../IR4%20Technical%20Proposal_v2.docx.md) §§2–4, 11

**Deployment model for IR4:** Two **fully independent** SCC installations (Central TCF & South TCF) — each with own PowerEdge R360, database, and site boundary. Not multi-site in one Laravel DB unless operator explicitly chooses consolidation (IR4 default: **one Laravel install per physical SCC site**).

---

## 1. Governance Instructions (GI) matrix

| GI | Requirement | SiteGuard implementation |
|----|-------------|--------------------------|
| **CCTV Governance** | Placement, signage, retention, access | Camera registry; 12–13 day edge retention + long-term violation snapshots on SCC; signage checklist in commissioning; role-based video access |
| **Data Leakage Prevention** | No data leaves site | On-prem MySQL + disk; no cloud storage; VPN terminates at SCC; block outbound internet on server |
| **Classification GI** | Sensitive photos/video handling | RBAC on media export; `sa_representative` role read-only no export |
| **Photography & Filming GI** | Pre-deployment approval | `deployment_approvals` workflow — Phase 2 gate before cameras on site |
| **Portable Devices GI** | Device approval register | `worker_records.portable_devices` + `portable_device_approved` — [13](13-rfid-ssms.md) |
| **Physical Protection Standard** | Encryption, audit, network | AES-256 at rest; VPN in transit; `activity_log` + login audit; session timeout |

---

## 2. On-premise architecture requirements

### 2.1 Per-site stack

| Component | Spec |
|-----------|------|
| Server | Dell PowerEdge R360 or equivalent |
| Database | MySQL 8 on same host |
| Redis | Local — queues, cache, Reverb |
| Media | `storage/app/` local disk or MinIO on LAN — **no S3 public cloud** |
| AI assistant | **Optional / disabled by default** on air-gapped SCC — `settings.ai_enabled = false`; LLM requires outbound internet incompatible with strict DLP unless local model added later |

### 2.2 Network zones

```text
SCC_LAN (10.0.1.0/24)
  ├── Server, workstation, 55" display, gate RFID, switch, RUTX11 VPN endpoint
  └── NO default route to internet

FIELD_VPN (10.0.2.0/24 virtual)
  └── Vehicle Jetson via RUT200 4G → RUTX11

SITE_WIFI (client VLAN)
  └── Pi Zero gas gateways → HTTPS to SCC_LAN server IP only
```

### 2.3 Encryption

| Layer | Method |
|-------|--------|
| At rest | LUKS or BitLocker on server volume; Laravel `encrypted` cast on RTSP URLs, tokens |
| 4G field | IPSec/OpenVPN AES-256 — Teltonika profiles |
| HTTPS internal | TLS 1.2+ self-signed or org CA on SCC |

---

## 3. `deployment_approvals` (Phase 2 gate)

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `approval_type` | enum | `photography_filming`, `cctv_gi`, `portable_devices`, `cctv_placement_plan` |
| `status` | enum | `pending`, `submitted`, `approved`, `rejected` |
| `submitted_at` | datetime | O |
| `approved_at` | datetime | O |
| `document_storage_key` | string | O — uploaded SA forms |
| `notes` | text | O |

**Rule:** `sites.settings.commissioning_gate` must be `approved` before `cameras.is_active` can be set true in bulk.

---

## 4. Audit logging

Extend Spatie `activity_log` + custom `security_audit_log`:

| Event | Logged |
|-------|--------|
| User login/logout | yes |
| Media export/download | yes |
| Worker record view (PII) | yes |
| UDPM report export | yes |
| Role/permission change | yes |
| Ingest token issue/revoke | yes |
| Equipment record view (scan) | optional |

SA representative role: all reads logged; **no** `reports.export` or bulk media export.

---

## 5. Roles (IR4 templates)

Seed **dynamic** roles (editable) — [10](10-users-roles-permissions.md):

| Role | Permissions summary |
|------|---------------------|
| **SCC Operator** | Full ops: alerts, RFID view, gas, cameras, incidents, LSR actions |
| **Safety Manager** | Operator + classify incidents, approve UDPM, manage workers |
| **Project Manager** | `udpm.view`, `reports.export`, headcount summary — read-only |
| **Site Staff** | Equipment scan only (public E01) |
| **SA Representative** | Read-only dashboards, `workers.view`, no export — `sa_representative.readonly` flag on role |

---

## 6. Data retention

| Data type | Default retention | Config key |
|-----------|-------------------|------------|
| PPE snapshots | 90 days SCC | `retention_days` |
| Edge rolling video | 12–13 days | edge agent config |
| RFID read events | 90 days | `retention.rfid_days` |
| Sensor/gas readings | 1 year | `retention.sensor_days` |
| UDPM reports | 7 years | `retention.udpm_years` |
| Gate entry/exit | 1 year | `retention.gate_log_days` |

End-of-project: secure wipe job per SA data handling — export pack then `php artisan site:wipe`.

---

## 7. Signage & commissioning checklist

| Item | Phase |
|------|-------|
| CCTV surveillance signage at entries | Phase 3 |
| AI analytics notice | Phase 3 |
| RFID personnel tracking notice | Phase 3 |
| Device inventory for Portable Devices GI | Phase 1–2 |
| Camera placement plan submission | Phase 2 |
| 4G signal survey (RSRP, RSRQ, SINR) | Phase 2 |
| Environmental sensor Modbus audit | Phase 2 |
| Site WiFi coverage for gas path | Phase 2 |

Store completion in `sites.settings.commissioning_checklist` JSON.

---

## 8. Brownfield SCC constraints

- SCC adjacent to main gate per site  
- Peak workforce 50–100 — scale RFID tags + worker records  
- Single active work front — 3 vehicles + 4 poles; document commercial variation for expansion  
- PPE violations **anonymous** in vision module; identity only via RFID/HSE workflows  

---

## 9. AI assistant on air-gapped SCC

| Mode | Config |
|------|--------|
| **Disabled (IR4 default)** | `settings.ai_enabled = false` |
| **Future local LLM** | `config/ai.php` provider on LAN — out of IR4 scope |

Dashboard and UDPM reporting must not depend on AI assistant.

---

## 10. Application config flags

```json
// sites.settings
{
  "data_residency": "on_premise_only",
  "outbound_internet_blocked": true,
  "ppe_anonymous_violations": true,
  "commissioning_status": "draft",
  "udpm_report_day": 0,
  "video_retention_edge_days": 13
}
```

---

[← Index](README.md)
