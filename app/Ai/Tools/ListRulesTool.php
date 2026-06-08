<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListRulesTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List detection rules configured for this site (PPE, zones, dwell time, severity).';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->encode($this->data->listRules(
            activeOnly: $request->boolean('active_only'),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'active_only' => $schema->boolean()->description('Only return active rules.')->required(),
        ];
    }
}
