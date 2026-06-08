# 02 — Detection Capabilities

[← Index](README.md) · **Next:** [03 Sites, modules & cameras](03-sites-modules-cameras.md)

Three **detection modules** (`ppe`, `vehicle_proximity`, `working_at_height`) share one Laravel install. Each site enables modules independently; **each module has many cameras** (locations/angles). Python **POSTs per camera** — one token, one `camera_id`, minimal `payload` + snapshot — [06](06-ai-ingestion-api.md). See [03](03-sites-modules-cameras.md).

---

## 1. Shared concepts

| Concept | Definition |
|---------|------------|
| **Class** | Model label e.g. `no_helmet`, `person`, `forklift` |
| **Confidence** | 0.0–1.0 from model |
| **BBox** | Normalized `[x, y, w, h]` relative to frame |
| **Track ID** | Optional — not in minimal ingest payload; server may correlate by bbox proximity (future) |
| **Zone** | Polygon; rule applies only if bbox center inside zone |
| **Dwell** | Alert only if condition persists ≥ N seconds |
| **Cooldown** | Suppress repeat alerts for same track + rule for M minutes |

---

## 2. PPE detection

### 2.1 Detectable classes (default taxonomy)

| Class key | Description |
|-----------|-------------|
| `person` | Human detected |
| `helmet` | Hard hat visible |
| `no_helmet` | Head visible, no helmet |
| `vest` | High-vis vest |
| `no_vest` | Torso visible, no vest |
| `gloves` | Optional |
| `no_gloves` | Optional |
| `boots` | Optional — often hard at distance |
| `safety_glasses` | Optional |
| `ear_protection` | Optional |

Site config enables which classes are **mandatory** per zone.

### 2.2 Typical rules

| Rule ID | Condition | Default severity |
|---------|-----------|------------------|
| `PPE-001` | `no_helmet` in `hard_hat_required` zone | **critical** |
| `PPE-002` | `no_vest` in `machinery_yard` zone | **high** |
| `PPE-003` | `person` in zone without any mandatory PPE satisfied | **high** |
| `PPE-004` | Group ≥3 with same violation (cluster) | **medium** |

### 2.3 False positive mitigations

- Require minimum bbox area (% of frame)  
- Ignore backs of heads if helmet ambiguous — configurable  
- “Grace period” 5 s before alert (worker putting on helmet)  
- Whitelist zones: canteen, site office (PPE optional)

### 2.4 Evidence

- **Required** `payload.snapshot` (base64 JPEG) on each ingest POST — [06 §3](06-ai-ingestion-api.md#3-request-body-minimal)  
- Overlay bbox + labels on dashboard from stored snapshot  

---

## 3. Vehicle proximity

### 3.1 Detectable classes

| Class key | Description |
|-----------|-------------|
| `person` | Pedestrian |
| `forklift` | Forklift / telehandler |
| `truck` | HGV, dump truck |
| `excavator` | Tracked/wheeled excavator |
| `loader` | Front loader |
| `vehicle_other` | Generic moving vehicle |
| `static_vehicle` | Parked — often excluded from motion rules |

### 3.2 Geometry

| Metric | How computed |
|--------|----------------|
| **Pixel distance** | Center-to-center or bbox edge distance (calibrated per camera) |
| **Real distance (m)** | Homography / camera calibration matrix per site |
| **Time to collision** | Optional if speed vector estimated |

**Ingest payload** may include optional `distance_m` on a detection (vehicle module only) — [06 §3.3](06-ai-ingestion-api.md#33-optional-only-when-rule-needs-it).

### 3.3 Typical rules

| Rule ID | Condition | Default severity |
|---------|-----------|------------------|
| `VEH-001` | `person` within **3 m** of `forklift` while `forklift.speed > 0` | **critical** |
| `VEH-002` | `person` inside `vehicle_exclusion_polygon` | **critical** |
| `VEH-003` | `person` within **5 m** of `truck` in reverse gear (class `truck_reversing` or tag) | **high** |
| `VEH-004` | Two persons behind moving vehicle (blind spot) | **high** |

### 3.4 Zone types

| Zone | Use |
|------|-----|
| `pedestrian_only` | No vehicles allowed |
| `vehicle_route` | Pedestrians discouraged — stricter proximity |
| `loading_bay` | Dynamic: alert when person + forklift overlap |

### 3.5 Equipment telematics (integrations)

- RSS/API feed from forklift telematics (speed, equipment ID) enriches proximity events  
- **Advisory only** — alerts and dashboard; no automatic machine stop from SiteGuard  

---

## 4. Working at height

### 4.1 Detectable classes / states

| Class key | Description |
|-----------|-------------|
| `person` | Worker |
| `harness_visible` | Harness straps detected |
| `no_harness` | Elevated worker, no visible harness |
| `scaffold` | Scaffold structure |
| `ladder` | Ladder detected |
| `platform` | MEWP / scaffold platform |
| `open_edge` | Unprotected leading edge (model or zone) |
| `guardrail_missing` | Missing mid-rail / top-rail (visual) |
| `elevation_estimated` | Tag: `above_2m` from zone or monocular heuristic |

### 4.2 Typical rules

| Rule ID | Condition | Default severity |
|---------|-----------|------------------|
| `HGT-001` | `no_harness` + `elevation_estimated >= 2m` in `work_at_height` zone | **critical** |
| `HGT-002` | `person` on `ladder` with angle outside safe range (zone/camera settings; not in minimal ingest) | **high** |
| `HGT-003` | `person` beyond guardrail in `roof_edge` zone | **critical** |
| `HGT-004` | `scaffold` zone occupied without `harness_visible` when policy requires | **high** |
| `HGT-005` | Suspended load path with `person` underneath (crane zone + object class) | **critical** |

### 4.3 Calibration notes

Height-from-single-camera is **error-prone**; prefer:

- Zone tag `height_band: 2-4m | 4m+` set by surveyor  
- MEWP register: when equipment ID seen, apply harness rule  
- Combine with turnstile / work-at-height permit data via Laravel API when integrated  

### 4.4 Human-in-the-loop

- All height alerts default **requires acknowledgment** before auto-close  
- Dashboard prompts: “Confirm harness not visible” vs false positive  

---

## 5. Cross-domain scenarios

| Scenario | Domains | Behavior |
|----------|---------|----------|
| Worker on scaffold near moving crane | Height + vehicle | Two events; dashboard may **correlate** into one incident |
| Visitor without PPE in yard | PPE + vehicle | PPE alert first; vehicle if enters lane |
| Night shift | All | IR / low-light model variant; higher confidence threshold |

---

## 6. Model versioning

Model name/version are **not** sent in the minimal ingest payload — configure on the camera or site in Laravel ([07](07-data-model-and-apis.md)); stored on `detection_events` for audit.

Dashboard shows model on alert (“which model fired?”).

**Ingest payload:** [06 §3](06-ai-ingestion-api.md#3-request-body-minimal) — `event_id`, `captured_at`, `snapshot`, `detections[]` only.

---

[← Index](README.md) · **Next:** [03 — Sites, modules & cameras](03-sites-modules-cameras.md)
