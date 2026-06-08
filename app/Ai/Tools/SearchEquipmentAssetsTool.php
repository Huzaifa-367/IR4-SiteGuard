<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchEquipmentAssetsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Search registered equipment assets: cranes, vehicles, lifts, etc. Filter by type, status, or text search on name/ID/serial.';
    }

    public function handle(Request $request): Stringable|string
    {
        $search = $request->string('search')->toString();
        $equipmentType = $request->string('equipment_type')->toString();
        $status = $request->string('status')->toString();

        return $this->encode($this->iot->equipmentAssets(
            search: $search !== '' ? $search : null,
            equipmentType: $equipmentType !== '' ? $equipmentType : null,
            status: $status !== '' ? $status : null,
            limit: max(1, $request->integer('limit') ?: 25),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'search' => $schema->string()->description('Text search on name, equipment ID, or serial — or empty string.')->required(),
            'equipment_type' => $schema->string()->description('Equipment type filter, or empty string for all.')->required(),
            'status' => $schema->string()->description('Status filter (e.g. active, out_of_service), or empty string for all.')->required(),
            'limit' => $schema->integer()->description('Max rows (default 25).')->required(),
        ];
    }
}
