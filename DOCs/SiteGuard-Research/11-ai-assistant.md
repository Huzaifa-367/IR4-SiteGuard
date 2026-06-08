# 11 — AI Assistant (Laravel AI SDK)

[← Index](README.md) · [05 Architecture](05-technical-architecture.md) · [07 Data model](07-data-model-and-apis.md)

The assistant uses the official **[Laravel AI SDK](https://laravel.com/docs/ai-sdk)** (`laravel/ai`) — agents, tools, and multi-provider support. Same rule as Lixar POS: **tool-calling runs only in Laravel**; Inertia is a thin client.

**Connectivity:** Internet required (provider API). No on-device LLM. No mobile app.

---

## 1. Purpose

Help HSE and site supervisors **query real safety data** and **propose** follow-up actions — without replacing human judgment on stop-work or discipline.

| Example question | Agent tool |
|------------------|------------|
| "Critical PPE alerts this week?" | `QueryAlerts` |
| "Which cameras are offline?" | `QueryCameraHealth` |
| "Draft investigation for harness violations" | `DraftInvestigation` → confirm in UI |

---

## 2. Package & installation

```bash
composer require laravel/ai
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
php artisan migrate
```

| Item | Location |
|------|----------|
| Provider credentials | `.env` — `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc. ([docs](https://laravel.com/docs/ai-sdk#configuration)) |
| Default models | `config/ai.php` |
| Site kill switch | `settings.ai_enabled` + permission `ai.assistant.use` |

**Do not** use `openai-php/laravel` directly — all LLM access goes through **`laravel/ai`**.

---

## 3. Non-negotiable rules

| Rule | Detail |
|------|--------|
| **`laravel/ai` on server** | Agent + tools in `app/Ai/` |
| **No client tools** | Inertia never calls providers or tools |
| **Site scope** | Agent constructed with `Site` + `User`; every tool checks access ([10](10-users-roles-permissions.md)) |
| **Writes need confirm** | Structured `proposed_actions[]` → user confirm → controller |
| **No auto-execute** | Never auto-acknowledge, dismiss, or change rules |
| **Audit** | `ai_audit_logs` per tool invocation |

```text
Dashboard → POST /sites/{site}/ai/sessions/{id}/messages

SiteSafetyChatService
  1. Auth + ai.assistant.use + site.access
  2. if !settings.ai_enabled → 403
  3. SiteSafetyAgent::make(user: $user, site: $site)
  4. ->prompt($userMessage)   // laravel/ai tool loop
  5. Map structured output → ai_messages + proposed_actions
  6. Return JSON to Inertia

User confirms proposed_action → POST .../ai/actions/execute
```

---

## 4. Agent: `SiteSafetyAgent`

**Path:** `app/Ai/Agents/SiteSafetyAgent.php`

**Interfaces:** `Agent`, `Conversational`, `HasTools`, `HasStructuredOutput`

| Method | Purpose |
|--------|---------|
| `instructions()` | System prompt — advisory only, site name, enabled modules, privacy rules |
| `messages()` | History from `ai_messages` for current `ai_session` |
| `tools()` | Site-scoped tool instances (see §5) |
| `schema()` | Structured reply: `reply`, `proposed_actions[]`, `chart_spec`, `citations[]` |

**Construction:**

```php
$response = SiteSafetyAgent::make(user: $user, site: $site)
    ->prompt($text);

// Or override provider/model per prompt:
$response = $agent->prompt($text, provider: Lab::OpenAI, model: 'gpt-4o');
```

Use `Laravel\Ai\Enums\Lab` for provider selection ([docs](https://laravel.com/docs/ai-sdk#provider-support)).

---

## 5. Tools (`app/Ai/Tools/`)

Each tool implements Laravel AI’s `Tool` contract (description + `handle()`), receives `SiteContext` via agent constructor.

### 5.1 Read tools

| Class | Purpose |
|-------|---------|
| `QueryAlerts` | Filtered alerts |
| `QueryAlertDetail` | One alert + events + media |
| `QueryDetectionEvents` | Raw events (restricted) |
| `QueryCameraHealth` | `health_status`, `last_ingest_at` |
| `QuerySiteOverview` | KPI counts |
| `QueryModuleStats` | Per-module breakdown |
| `QueryZonesRules` | Zones + rules (read-only) |
| `ReportSummary` | Whitelisted report keys |

### 5.2 Propose tools (confirm in UI)

| Class | Proposed action |
|-------|-----------------|
| `DraftAlertComment` | `add_alert_note` |
| `DraftAcknowledgeAlert` | `acknowledge_alert` (if permitted) |
| `DraftInvestigation` | `create_investigation` |
| `DraftExportReport` | `export_report` |

**Never tools:** delete camera, revoke token, change rules, disable module.

### 5.3 Tool sketch

```php
<?php

namespace App\Ai\Tools;

use App\Data\SiteContext;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;

final class QueryAlerts implements Tool
{
    public function __construct(private SiteContext $context) {}

    public function description(): string
    {
        return 'List safety alerts for the current site with optional filters.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'severity' => $schema->string()->enum(['low', 'medium', 'high', 'critical']),
            'status' => $schema->string(),
            'module' => $schema->string(),
        ];
    }

    public function handle(Request $request): string
    {
        // Policy + site_id scope → JSON for model
    }
}
```

Register in agent:

```php
public function tools(): iterable
{
    return [
        new QueryAlerts($this->context),
        new QueryCameraHealth($this->context),
        // …
    ];
}
```

---

## 6. Session & persistence (MySQL)

SiteGuard keeps **site-scoped** threads in application tables ([07 §10](07-data-model-and-apis.md#10-ai-assistant-data)):

| Table | Purpose |
|-------|---------|
| `ai_sessions` | `user_id` + `site_id` |
| `ai_messages` | User/assistant content + `proposed_actions` JSON |
| `ai_audit_logs` | Tool name, input, output, latency |

The SDK may also create `agent_conversations` / `agent_conversation_messages` when published — **optional**; prefer `ai_sessions` for site binding and UX.

---

## 7. HTTP API (dashboard)

Base: `/sites/{site}/ai` — `auth` + `site.access` + `ai.assistant.use`

| Method | Path | Body |
|--------|------|------|
| GET | `/sessions` | List sessions |
| POST | `/sessions` | `{ "title": "optional" }` |
| GET | `/sessions/{sid}/messages` | History |
| POST | `/sessions/{sid}/messages` | `{ "text": "…" }` |
| POST | `/command` | `{ "query": "…" }` — command bar |
| POST | `/actions/execute` | Confirm `proposed_actions` |
| DELETE | `/sessions/{sid}` | Clear thread |

---

## 8. Structured response (Inertia)

```json
{
  "data": {
    "message_id": 1024,
    "reply": "North Tower has 7 open critical alerts this week…",
    "proposed_actions": [
      {
        "type": "create_investigation",
        "title": "Investigation: harness violations 17 May",
        "payload": { "alert_ids": ["uuid"], "summary": "…" }
      }
    ],
    "chart_spec": { "type": "bar", "labels": ["PPE", "Vehicle", "Height"], "values": [4, 0, 3] },
    "citations": [{ "type": "alert_aggregate", "site_id": "uuid" }]
  }
}
```

Defined in `SiteSafetyAgent::schema()` via `JsonSchema` ([structured output](https://laravel.com/docs/ai-sdk#structured-output)).

---

## 9. Voice (optional)

| Path | Detail |
|------|--------|
| Browser Web Speech | Text → normal `prompt()` |
| Audio upload | Laravel AI **transcription** API (`laravel/ai` STT) → text → `prompt()` |

See [transcription docs](https://laravel.com/docs/ai-sdk#transcription).

---

## 10. Configuration & limits

| Source | Key | Notes |
|--------|-----|-------|
| `config/ai.php` | Default text provider/model | OpenAI, Anthropic, Gemini, … |
| `settings` | `ai_enabled` | Global off switch |
| `settings` | `ai_max_messages_per_hour_user` | Rate limit |
| `.env` | `OPENAI_API_KEY`, etc. | Never exposed to browser |

Optional: [provider failover](https://laravel.com/docs/ai-sdk#failover) in `config/ai.php`.

---

## 11. Safety controls

| Control | Detail |
|---------|--------|
| Tool-only facts | Counts must come from tool results |
| Citations | Entity ids in structured output |
| Blocked topics | Worker identity, medical diagnosis |
| PPE/height disclaimer | In `instructions()` |

---

## 12. Dashboard screens

| ID | Screen |
|----|--------|
| A01 | Site AI chat |
| A02 | Command palette |
| A03 | Confirm proposed action |
| A04 | Session history |

[04 — Dashboard UX](04-web-dashboard-ux.md)

---

## 13. References

- [Laravel AI SDK documentation](https://laravel.com/docs/ai-sdk)  
- [Agents & tools](https://laravel.com/docs/ai-sdk#agents)  
- [GitHub: laravel/ai](https://github.com/laravel/ai)

---

[← Index](README.md) · [08 — Product modules](08-product-modules.md#module-14--ai-assistant)
