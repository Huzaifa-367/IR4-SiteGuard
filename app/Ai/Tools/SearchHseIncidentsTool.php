<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchHseIncidentsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Search HSE incidents: filter by status, severity, incident type, and time window. Returns zone, camera, linked alerts, and classification info.';
    }

    public function handle(Request $request): Stringable|string
    {
        $status = $request->string('status')->toString();
        $severity = $request->string('severity')->toString();
        $incidentType = $request->string('incident_type')->toString();

        return $this->encode($this->iot->hseIncidents(
            status: $status !== '' ? $status : null,
            severity: $severity !== '' ? $severity : null,
            incidentType: $incidentType !== '' ? $incidentType : null,
            days: max(1, $request->integer('days') ?: 90),
            limit: max(1, $request->integer('limit') ?: 25),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('e.g. pending_classification, classified — or empty for all.')->required(),
            'severity' => $schema->string()->description('Severity filter, or empty string for all.')->required(),
            'incident_type' => $schema->string()->description('Incident type filter, or empty string for all.')->required(),
            'days' => $schema->integer()->description('Days back to search (default 90).')->required(),
            'limit' => $schema->integer()->description('Max rows (default 25).')->required(),
        ];
    }
}
