<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchAlertsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Search safety alerts for this site. Filter by status (open, acknowledged, dismissed, closed), severity (critical, high, medium, low), text search, and how many days back to look.';
    }

    public function handle(Request $request): Stringable|string
    {
        $status = $request->string('status')->toString();
        $severity = $request->string('severity')->toString();
        $search = $request->string('search')->toString();

        return $this->encode($this->data->searchAlerts(
            status: $status !== '' ? $status : null,
            severity: $severity !== '' ? $severity : null,
            search: $search !== '' ? $search : null,
            days: max(1, $request->integer('days') ?: 14),
            limit: max(1, $request->integer('limit') ?: 25),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('Status filter, or empty string for all.')->required(),
            'severity' => $schema->string()->description('Severity filter, or empty string for all.')->required(),
            'search' => $schema->string()->description('Text search, or empty string for none.')->required(),
            'days' => $schema->integer()->description('Days back to search (default 14).')->required(),
            'limit' => $schema->integer()->description('Max rows (default 25).')->required(),
        ];
    }
}
