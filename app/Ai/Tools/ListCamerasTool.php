<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListCamerasTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List cameras on this site with health status (online, offline, degraded), location, and detection module.';
    }

    public function handle(Request $request): Stringable|string
    {
        $healthStatus = $request->string('health_status')->toString();

        return $this->encode($this->data->listCameras(
            healthStatus: $healthStatus !== '' ? $healthStatus : null,
            activeOnly: $request->boolean('active_only'),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'health_status' => $schema->string()->description('Filter: online, offline, degraded, or empty for all.')->required(),
            'active_only' => $schema->boolean()->description('Only include active cameras.')->required(),
        ];
    }
}
