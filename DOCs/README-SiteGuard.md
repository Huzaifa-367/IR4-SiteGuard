# Documentation index

| Folder | Product |
|--------|---------|
| [Research/](Research/README.md) | **Lixar POS** — Flutter + Laravel khata (Pakistan) |
| [SiteGuard-Research/](SiteGuard-Research/README.md) | **SiteGuard AI** — Single Laravel project; Python ingest; PPE / vehicle / height |

**SiteGuard stack:** Laravel + **MySQL** (dashboard + `POST /api/ingest/camera` + **AI assistant** via `laravel/ai`) · Python (vision per camera, separate repo) · **Single project, full spec**

**Ingest contract:** One token per camera → `POST { camera_id, payload: { event_id, captured_at, snapshot, detections[] } }` — see [06 — AI ingestion API](SiteGuard-Research/06-ai-ingestion-api.md).

These products are independent — do not share schemas or code.
