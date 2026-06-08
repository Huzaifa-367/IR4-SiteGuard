# 17 — UDPM-GM-0058 Weekly Report (Section 6.5)

[← Index](README.md) · **Linked:** [13 RFID](13-rfid-ssms.md) · [14 Gas](14-gas-co2-environmental.md) · [16 HSE/LSR](16-hse-incidents-lsr.md) · **Next:** [18 — Saudi Aramco compliance](18-saudi-aramco-compliance.md)

**Standard:** Saudi Aramco UDPM-GM-0058 Safety Command Center — **Section 6.5 weekly report**.  
**Output:** PDF + CSV archive on SCC server; optional email to distribution list on SCC LAN mail relay only.

---

## 1. Report entity

### 1.1 `udpm_weekly_reports`

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `week_start` | date | R — Sunday or configurable |
| `week_end` | date | R |
| `status` | enum | `draft`, `generated`, `approved`, `exported` |
| `generated_at` | datetime | RO |
| `generated_by_user_id` | FK | O — null if cron |
| `approved_by_user_id` | FK | O |
| `pdf_storage_key` | string | O |
| `csv_storage_key` | string | O |
| `payload` | json | R — full structured data §2 |
| `compliance_summary` | json | per-item status |

### 1.2 Schedule

```php
// routes/console.php
Schedule::job(new GenerateUdpmWeeklyReportJob)->weeklyOn(0, '6:00'); // site timezone
```

Per-site `sites.settings.udpm_report_day` override.

---

## 2. Section 6.5 field mapping

| # | Required item | Status | Data sources | Laravel aggregation |
|---|---------------|--------|--------------|---------------------|
| **i** | Daily safety observations | **Automated** | PPE alerts (`detection_module = ppe`) | Daily count by violation type, camera, snapshot refs |
| **ii** | HSE accidents and incidents | **Auto + manual** | `hse_incidents`, fall/stationary alerts | Classified incidents + pending drafts list |
| **iii** | LSR violations & actions taken | **Auto + manual** | `lsr_violation_logs` | All rows; flag missing `actions_taken` |
| **iv** | Weather conditions | **Automated** | `sensor_readings` weather params | Daily avg/min/max temp, humidity, wind |
| **v** | Site manpower | **Automated** | `gate_entry_exit_log`, `site_headcount_snapshots` | Daily peak + weekly avg on-site |
| **vi** | Total vehicles monitored | **Automated*** | `equipment_assets` + telematics | Count assets type=vehicle with active telematics *see §3 |
| **vii** | Vehicle violations & actions | **Manual** | `vehicle_violation_logs` | Officer form entries |
| **viii** | Environmental data | **Automated** | `sensor_readings` non-weather | Per Phase 2 parameter map |
| **ix** | Gas monitoring (LEL, H₂S, O₂, CO) | **Automated** | `gas_readings` / gas ingest | Per-vehicle min/max/avg; alarm events |
| **x** | CO₂ monitoring | **Automated** | `sensor_readings` `co2_ppm` | Per-vehicle weekly summary |

**Summary:** 6 fully automated · 2 manual workflows · 2 partial (vehicle)*.

---

## 3. Payload schema (`udpm_weekly_reports.payload`)

```json
{
  "site": { "name": "Central TCF", "code": "CTCF", "week_label": "2026-W23" },
  "sections": {
    "i_daily_safety_observations": {
      "days": [
        {
          "date": "2026-06-02",
          "ppe_violations": [
            { "type": "no_helmet", "count": 12, "cameras": ["vehicle-01-ptz"], "snapshot_ids": [] }
          ]
        }
      ]
    },
    "ii_hse_incidents": {
      "classified": [],
      "pending_classification": []
    },
    "iii_lsr_violations": {
      "automated": [],
      "manual": [],
      "missing_actions_count": 0
    },
    "iv_weather": { "daily": [] },
    "v_manpower": { "daily_peak": [], "weekly_avg": 87 },
    "vi_vehicles_monitored": { "count": 14, "source": "telematics_fmc125" },
    "vii_vehicle_violations": { "entries": [] },
    "viii_environmental": { "parameters": [] },
    "ix_gas": { "by_vehicle": [], "alarms": [] },
    "x_co2": { "by_vehicle": [] }
  },
  "compliance_matrix": {
    "i": "automated",
    "ii": "auto_plus_manual",
    "iii": "auto_plus_manual",
    "iv": "automated",
    "v": "automated",
    "vi": "automated",
    "vii": "manual",
    "viii": "automated",
    "ix": "automated",
    "x": "automated"
  }
}
```

---

## 4. `vehicle_violation_logs` (manual §vii)

| Column | Type | Notes |
|--------|------|-------|
| `site_id` | FK | R |
| `occurred_at` | datetime | R |
| `vehicle_description` | string | R |
| `equipment_asset_id` | FK | O — link to QR registry |
| `violation_type` | string | R |
| `description` | text | R |
| `actions_taken` | text | R |
| `logged_by_user_id` | FK | R |
| `camera_id` | FK | O — if observed on CCTV |

**Route:** `POST /sites/{site}/vehicle-violations` · `vehicle_violations.log`

---

## 5. Vehicle telematics (§vi)

IR4 proposal references **Teltonika FMC125** for total vehicles monitored.

### 5.1 Optional integration

| Component | Detail |
|-----------|--------|
| `telematics_devices` | FMC125 IMEI, linked `equipment_asset_id` |
| Ingest | `POST /api/ingest/telematics` — GPS, speed, ignition |
| Weekly count | Distinct active vehicles with ping in week |

If not deployed: §vi falls back to **count of registered `equipment_assets` where type=vehicle** — document in report footer.

---

## 6. PDF template sections

1. Cover — site, week, generation timestamp, approver signature block  
2. Executive summary — open incidents, LSR count, gas alarms  
3. §i–§x tables per UDPM layout  
4. Appendix — snapshot thumbnails (PPE), gas trend charts  
5. Compliance matrix — green/amber per item  

Use Laravel Blade → PDF (e.g. `spatie/laravel-pdf` or `dompdf`) — render on SCC only.

---

## 7. Dashboard (D54)

| Feature | Detail |
|---------|--------|
| Preview | Render draft from last 7 days anytime |
| Approve | Safety Manager `udpm.approve` |
| Export | PDF + CSV download |
| History | List past `udpm_weekly_reports` |
| Validation | Block approve if `missing_actions_count > 0` (configurable warn vs block) |

---

## 8. Permissions

| Permission | Allows |
|------------|--------|
| `udpm.view` | Preview and history |
| `udpm.generate` | Manual regenerate |
| `udpm.approve` | Approve and lock report |
| `udpm.export` | Download PDF/CSV |
| `vehicle_violations.log` | Manual §vii entries |

---

## 9. Jobs

```text
GenerateUdpmWeeklyReportJob(site_id, week_start, week_end)
  → Aggregate each section via dedicated query classes
  → Store payload + render PDF
  → Notify Safety Manager on SCC LAN email
```

Query classes (implement under `App\Reports\Udpm\`):

- `DailySafetyObservationsQuery`  
- `HseIncidentsQuery`  
- `LsrViolationsQuery`  
- `WeatherConditionsQuery`  
- `ManpowerQuery`  
- `GasMonitoringQuery`  
- `Co2MonitoringQuery`  
- `EnvironmentalDataQuery`  
- `VehiclesMonitoredQuery`  
- `VehicleViolationsQuery`  

---

[← Index](README.md) · **Next:** [18 — Saudi Aramco compliance](18-saudi-aramco-compliance.md)
