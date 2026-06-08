<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchGasEnvironmentalTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Query gas detection and environmental sensors: summary KPIs, latest readings, active alarms, alarm history, and sensor inventory.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->encode($this->iot->gasEnvironmental(
            domain: $request->string('domain')->toString(),
            days: max(1, $request->integer('days') ?: 7),
            limit: max(1, $request->integer('limit') ?: 25),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'domain' => $schema->string()->description(
                'Data area: summary, latest_readings, active_alarms, alarm_history, environmental_sensors.',
            )->required(),
            'days' => $schema->integer()->description('Days back for alarm_history (default 7).')->required(),
            'limit' => $schema->integer()->description('Max rows (default 25).')->required(),
        ];
    }
}
