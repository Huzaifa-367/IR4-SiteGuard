<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchDetectionEventsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Search recent raw detection events ingested from cameras on this site.';
    }

    public function handle(Request $request): Stringable|string
    {
        $moduleKey = $request->string('module_key')->toString();
        $cameraId = $request->integer('camera_id');

        return $this->encode($this->data->searchDetectionEvents(
            days: max(1, $request->integer('days') ?: 7),
            cameraId: $cameraId > 0 ? $cameraId : null,
            moduleKey: $moduleKey !== '' ? $moduleKey : null,
            limit: max(1, $request->integer('limit') ?: 30),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'days' => $schema->integer()->description('Days back to search (default 7).')->required(),
            'camera_id' => $schema->integer()->description('Camera ID filter, or 0 for all cameras.')->required(),
            'module_key' => $schema->string()->description('Module key filter, or empty string for all.')->required(),
            'limit' => $schema->integer()->description('Maximum events (default 30).')->required(),
        ];
    }
}
