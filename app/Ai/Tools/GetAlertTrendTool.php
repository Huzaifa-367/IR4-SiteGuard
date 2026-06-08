<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetAlertTrendTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Get daily alert counts by severity over recent days for trend and pattern questions.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->encode($this->data->alertTrend(
            days: max(1, $request->integer('days') ?: 14),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'days' => $schema->integer()->description('Number of days (default 14, max 30).')->required(),
        ];
    }
}
