<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetSiteOverviewTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Get KPIs and summary counts for the current site: alerts, cameras, detection events, investigations, rules, and modules.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->encode($this->data->overview());
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
