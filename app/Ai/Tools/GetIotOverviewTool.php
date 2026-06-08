<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetIotOverviewTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Cross-module IoT summary for this site: RFID headcount and zones, gas alarms, field device health, equipment counts, HSE/LSR open items, UDPM reports, and deployment approvals.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->encode($this->iot->summary());
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
