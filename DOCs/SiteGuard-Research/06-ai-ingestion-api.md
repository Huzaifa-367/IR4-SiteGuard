# 06 — AI Ingestion API (Python → Laravel)

[← Index](README.md) · **Linked:** [03 — Sites, modules & cameras](03-sites-modules-cameras.md) · **Next:** [07 Data model](07-data-model-and-apis.md)

**Audience:** Python developers (separate repository).  
**Implementer:** `POST /api/ingest/camera` only.

**Design:** One **POST** per camera. Laravel already has site, module, zones, rules, and RTSP ([03](03-sites-modules-cameras.md)). Python sends **`camera_id`**, a **minimal `payload`** (detection fields + **snapshot**), and the **camera ingest token**.

---

## 0. Simple flow ([03](03-sites-modules-cameras.md))

```text
  LARAVEL                                      PYTHON
  ───────                                      ──────
  1. Create camera (+ zones, RTSP)
  2. Issue ingest token               ──►     3. CAMERA_ID + TOKEN + RTSP in env
                                             4. Infer frame → POST once per event
                                                { camera_id, payload }
```

| In Laravel already | Python sends only |
|--------------------|-------------------|
| Site, module, location, zones, rules, thresholds | `camera_id` + minimal `payload` below |
| Ingest token | `Authorization: Bearer …` |

**POST only.** No config GET, heartbeat, or presign routes.

---

## 1. Endpoint

```http
POST /api/ingest/camera
Authorization: Bearer {camera_ingest_token}
Content-Type: application/json
```

---

## 2. Token (one per camera)

| Rule | Detail |
|------|--------|
| Scope | Token works for **one** `camera_id` only |
| Issue | On camera create or rotate on **D23** — [07 §3.5](07-data-model-and-apis.md#35-ingest_api_tokens-python) |

```bash
SITEGUARD_CAMERA_ID=550e8400-e29b-41d4-a716-446655440000
SITEGUARD_INGEST_TOKEN=sgcam_xxxxxxxxxxxxxxxx
SITEGUARD_RTSP_URL=rtsp://…
```

---

## 3. Request body (minimal)

**One POST = one frame / one ingest event** — shared **snapshot** for all `detections` on that frame.

```json
{
  "camera_id": "550e8400-e29b-41d4-a716-446655440000",
  "payload": {
    "event_id": "660e8400-e29b-41d4-a716-446655440001",
    "captured_at": "2026-05-17T14:32:00.120Z",
    "snapshot": "/9j/4AAQSkZJRgABAQAAAQ…",
    "detections": [
      {
        "classes": [
          { "key": "no_helmet", "confidence": 0.91 }
        ],
        "bbox": { "x": 0.42, "y": 0.18, "w": 0.12, "h": 0.28 }
      }
    ]
  }
}
```

### 3.1 Required fields

| Field | Level | Type | Notes |
|-------|-------|------|-------|
| `camera_id` | root | UUID | Must match token’s camera |
| `payload` | root | object | |
| `event_id` | payload | UUID | Idempotency key for this POST |
| `captured_at` | payload | ISO 8601 UTC | Frame time |
| `snapshot` | payload | string | **Base64-encoded JPEG** (frame evidence) |
| `detections` | payload | array | ≥ 1 item |
| `classes` | each detection | array | ≥ 1 `{ "key", "confidence" }` |
| `bbox` | each detection | object | Normalized `x`, `y`, `w`, `h` (0–1) |

### 3.2 Not in the payload (Laravel resolves)

| Omit — server has it | Source |
|----------------------|--------|
| `site_id`, `detection_module` | `cameras` row |
| `zone_ids` | Computed from `bbox` + camera zones |
| `model_name` / `model_version` | Site/camera settings or defaults |
| `rtsp_url`, location name | `cameras` + `site_locations` |
| `health`, `stream_ok`, `fps` | `last_ingest_at` updated on each successful POST |
| Separate snapshot per detection | One `payload.snapshot` per POST |

### 3.3 Optional (only when rule needs it)

| Field | Level | When |
|-------|-------|------|
| `distance_m` | detection | **Vehicle proximity** module only — [02 §3](02-detection-capabilities.md#3-vehicle-proximity) |

No other optional fields in the standard contract.

### 3.4 Snapshot rules

| Rule | Value |
|------|--------|
| Format | JPEG (preferred) or PNG |
| Encoding | Base64 string in `payload.snapshot` |
| Content | Same frame used for inference |
| Max size | 5 MB decoded (configurable) |

---

## 4. Laravel processing

```text
POST /api/ingest/camera
  → Validate token ↔ camera_id
  → Load camera, site, module, zones, rules
  → Decode snapshot → media_objects
  → Map bbox → zone_ids
  → Insert detection_events (link snapshot)
  → EvaluateRulesJob → alerts
  → Update cameras.last_ingest_at, health_status = online
```

---

## 5. Validation & errors

| Check | HTTP | Code |
|-------|------|------|
| Invalid / revoked token | 401 | — |
| `camera_id` ≠ token camera | 403 | `CAMERA_TOKEN_MISMATCH` |
| Camera missing / inactive | 400 | `CAMERA_NOT_FOUND` |
| Module disabled | 403 | `MODULE_DISABLED` |
| Missing `snapshot` or `detections` | 422 | `VALIDATION_ERROR` |
| Empty `detections` | 422 | `DETECTIONS_REQUIRED` |
| Invalid base64 / image | 422 | `INVALID_SNAPSHOT` |
| Duplicate `event_id` | 200 | `duplicate: 1` |

---

## 6. Response

```json
{
  "ok": true,
  "camera_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_id": "660e8400-e29b-41d4-a716-446655440001",
  "accepted": 1,
  "duplicate": 0,
  "alerts_created": 1
}
```

---

## 7. Rate limits

| Limit | Default |
|-------|---------|
| POSTs per minute per camera | 60 |
| `detections` per POST | 20 |
| Max JSON body | 6 MB |

---

## 8. Python example

```python
import os, uuid, requests, base64
from datetime import datetime, timezone

CAMERA_ID = os.environ["SITEGUARD_CAMERA_ID"]
TOKEN = os.environ["SITEGUARD_INGEST_TOKEN"]
URL = os.environ.get("SITEGUARD_INGEST_URL", "https://host/api/ingest/camera")

cap = open_rtsp(os.environ["SITEGUARD_RTSP_URL"])

while True:
    frame = cap.read()
    results = model.infer(frame)
    if not results:
        continue

    jpeg = encode_jpeg(frame)
    body = {
        "camera_id": CAMERA_ID,
        "payload": {
            "event_id": str(uuid.uuid4()),
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "snapshot": base64.b64encode(jpeg).decode("ascii"),
            "detections": [
                {
                    "classes": r.classes,
                    "bbox": r.bbox,
                }
                for r in results
            ],
        },
    }
    requests.post(
        URL,
        json=body,
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=30,
    ).raise_for_status()
```

**When to POST:** Only when there is at least one detection to report (no empty heartbeat POSTs).

---

## 9. Out of scope for this API

| Not supported | Use |
|-------------|-----|
| Extra ingest routes | This POST only |
| Create camera / site | [03](03-sites-modules-cameras.md) dashboard |
| Site- or module-wide token | **One token per camera** |

---

[← Index](README.md) · [03 Sites & cameras](03-sites-modules-cameras.md) · **Next:** [07 — Data model](07-data-model-and-apis.md)
