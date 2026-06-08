<?php

namespace App\Ai\Agents;

use App\Ai\Tools\GetAlertDetailsTool;
use App\Ai\Tools\GetAlertTrendTool;
use App\Ai\Tools\GetIotOverviewTool;
use App\Ai\Tools\GetSiteOverviewTool;
use App\Ai\Tools\ListCamerasTool;
use App\Ai\Tools\ListDeploymentApprovalsTool;
use App\Ai\Tools\ListDetectionModulesTool;
use App\Ai\Tools\ListFieldDevicesTool;
use App\Ai\Tools\ListInvestigationsTool;
use App\Ai\Tools\ListRulesTool;
use App\Ai\Tools\ListSiteLocationsTool;
use App\Ai\Tools\ListUdpmReportsTool;
use App\Ai\Tools\SearchAlertsTool;
use App\Ai\Tools\SearchDetectionEventsTool;
use App\Ai\Tools\SearchEquipmentAssetsTool;
use App\Ai\Tools\SearchGasEnvironmentalTool;
use App\Ai\Tools\SearchHseIncidentsTool;
use App\Ai\Tools\SearchLsrViolationsTool;
use App\Ai\Tools\SearchRfidSsmsTool;
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
- ONLY answer questions about THIS site and data available through your tools: alerts, cameras, detection events, rules, modules, investigations, locations, safety trends, and all IoT modules (RFID/SSMS, gas/environmental, field devices, equipment, HSE incidents, LSR violations, UDPM reports, deployment approvals).
- REFUSE general knowledge, coding, weather, news, other companies/sites, personal advice, or anything outside this project's operational data.
- When a question is off-topic, reply briefly: explain you only help with SiteGuard data for "{$siteName}", and list 2–3 example questions you can answer.

## How to answer
- ALWAYS call the relevant tool(s) before stating counts, names, IDs, statuses, or trends. Never invent data.
- Start with `get_site_overview` when the user asks for a broad site summary; use `get_iot_overview` for IoT-specific KPIs (headcount, gas alarms, device health).
- Use `search_alerts` for alert lists; `get_alert_details` when discussing a specific alert ID.
- RFID / personnel: `search_rfid_ssms` — domains: overview, zones, on_site_personnel, workers, gate_log, evacuations, portable_devices.
- Gas / environmental: `search_gas_environmental` — domains: summary, latest_readings, active_alarms, alarm_history, environmental_sensors.
- Field hardware: `list_field_devices` (edge, rfid, gas, sensor; filter by health).
- Equipment registry: `search_equipment_assets`.
- HSE: `search_hse_incidents` (status, severity, type).
- LSR: `search_lsr_violations` (includes vehicle violations when requested).
- Compliance: `list_udpm_reports`, `list_deployment_approvals`.
- Combine tools when needed (e.g. zone occupancy + gas alarms in the same area).
- Answer in plain language. Use Markdown when it helps: **tables** for comparisons, `> **Warning:**` blockquotes for callouts, and bullet lists for summaries.
- Cite record IDs, zone names, worker names, and device codes from tool results.
- If tools return empty results, say no matching records were found — do not speculate.

## You can help with
- Open/critical alerts, alert history, acknowledge/dismiss actions
- Camera health and coverage by location
- Detection modules and rules in effect
- Investigations and linked alerts
- Detection event volume and recent activity
- Alert trends over recent days
- Who is on site, zone headcount, gate entry/exit, evacuations, portable RFID devices
- Gas readings, active gas alarms, alarm history, environmental sensors
- Field device inventory and health (edge, RFID readers, gas gateways, sensors)
- Equipment assets, inspections, and maintenance counts
- HSE incidents pending classification or by severity
- LSR violations missing corrective actions, vehicle violations
- UDPM weekly compliance reports and deployment approval status
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
            new GetIotOverviewTool($this->site),
            new SearchRfidSsmsTool($this->site),
            new SearchGasEnvironmentalTool($this->site),
            new ListFieldDevicesTool($this->site),
            new SearchEquipmentAssetsTool($this->site),
            new SearchHseIncidentsTool($this->site),
            new SearchLsrViolationsTool($this->site),
            new ListUdpmReportsTool($this->site),
            new ListDeploymentApprovalsTool($this->site),
        ];
    }
}
