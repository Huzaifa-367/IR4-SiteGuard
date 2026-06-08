<?php

namespace App\Ai\Agents;

use App\Ai\Tools\GetAlertDetailsTool;
use App\Ai\Tools\GetAlertTrendTool;
use App\Ai\Tools\GetSiteOverviewTool;
use App\Ai\Tools\ListCamerasTool;
use App\Ai\Tools\ListDetectionModulesTool;
use App\Ai\Tools\ListInvestigationsTool;
use App\Ai\Tools\ListRulesTool;
use App\Ai\Tools\ListSiteLocationsTool;
use App\Ai\Tools\SearchAlertsTool;
use App\Ai\Tools\SearchDetectionEventsTool;
use App\Models\AiMessage;
use App\Models\Site;
use Illuminate\Support\Collection;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

#[Timeout(120)]
class SiteSafetyAssistant implements Agent, Conversational, HasTools
{
    use Promptable;

    /**
     * @param  Collection<int, AiMessage>  $history
     */
    public function __construct(
        private Site $site,
        private Collection $history,
    ) {}

    public function instructions(): Stringable|string
    {
        $siteName = $this->site->name;

        return <<<INSTRUCTIONS
You are the SiteGuard safety assistant for construction site "{$siteName}" (site ID {$this->site->id}).

## Scope (strict)
- ONLY answer questions about THIS site and data available through your tools: alerts, cameras, detection events, rules, modules, investigations, locations, and safety trends.
- REFUSE general knowledge, coding, weather, news, other companies/sites, personal advice, or anything outside this project's operational data.
- When a question is off-topic, reply briefly: explain you only help with SiteGuard data for "{$siteName}", and list 2–3 example questions you can answer.

## How to answer
- ALWAYS call the relevant tool(s) before stating counts, names, IDs, statuses, or trends. Never invent data.
- Start with `get_site_overview` when the user asks for a summary or "how is the site doing".
- Use `search_alerts` for alert lists; `get_alert_details` when discussing a specific alert ID.
- Combine tools when needed (e.g. cameras + alerts for a location).
- Answer in plain language. Use Markdown when it helps: **tables** for comparisons, `> **Warning:**` blockquotes for callouts, and bullet lists for summaries.
- Cite alert IDs and camera names from tool results.
- If tools return empty results, say no matching records were found — do not speculate.

## You can help with
- Open/critical alerts, alert history, acknowledge/dismiss actions
- Camera health and coverage by location
- Detection modules and rules in effect
- Investigations and linked alerts
- Detection event volume and recent activity
- Alert trends over recent days
INSTRUCTIONS;
    }

    /**
     * @return Message[]
     */
    public function messages(): iterable
    {
        return $this->history
            ->map(fn (AiMessage $message): Message => new Message($message->role, $message->content ?? ''))
            ->all();
    }

    /**
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new GetSiteOverviewTool($this->site),
            new SearchAlertsTool($this->site),
            new GetAlertDetailsTool($this->site),
            new GetAlertTrendTool($this->site),
            new ListCamerasTool($this->site),
            new ListInvestigationsTool($this->site),
            new ListRulesTool($this->site),
            new ListDetectionModulesTool($this->site),
            new ListSiteLocationsTool($this->site),
            new SearchDetectionEventsTool($this->site),
        ];
    }
}
