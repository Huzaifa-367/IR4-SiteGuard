<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchLsrViolationsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Search Life Saving Rules (LSR) violations and vehicle violations. Filter by detection mode, LSR category, missing corrective actions, and time window.';
    }

    public function handle(Request $request): Stringable|string
    {
        $detectionMode = $request->string('detection_mode')->toString();
        $category = $request->string('category')->toString();

        return $this->encode($this->iot->lsrViolations(
            detectionMode: $detectionMode !== '' ? $detectionMode : null,
            category: $category !== '' ? $category : null,
            missingActionsOnly: $request->boolean('missing_actions_only'),
            includeVehicleViolations: $request->boolean('include_vehicle_violations', true),
            days: max(1, $request->integer('days') ?: 90),
            limit: max(1, $request->integer('limit') ?: 25),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'detection_mode' => $schema->string()->description('Detection mode filter, or empty string for all.')->required(),
            'category' => $schema->string()->description('LSR category filter, or empty string for all.')->required(),
            'missing_actions_only' => $schema->boolean()->description('Only violations without corrective actions recorded.')->required(),
            'include_vehicle_violations' => $schema->boolean()->description('Include vehicle violation log entries (default true).')->required(),
            'days' => $schema->integer()->description('Days back to search (default 90).')->required(),
            'limit' => $schema->integer()->description('Max rows (default 25).')->required(),
        ];
    }
}
