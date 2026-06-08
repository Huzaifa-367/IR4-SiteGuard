<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListFieldDevicesTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List field IoT devices: edge compute nodes, RFID readers, gas gateways, and environmental sensor devices. Filter by type and health status.';
    }

    public function handle(Request $request): Stringable|string
    {
        $deviceType = $request->string('device_type')->toString();
        $healthStatus = $request->string('health_status')->toString();

        return $this->encode($this->iot->fieldDevices(
            deviceType: $deviceType !== '' ? $deviceType : null,
            healthStatus: $healthStatus !== '' ? $healthStatus : null,
            limit: max(1, $request->integer('limit') ?: 40),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'device_type' => $schema->string()->description('edge, rfid, gas, sensor, or empty for all.')->required(),
            'health_status' => $schema->string()->description('healthy, degraded, offline, or empty for all.')->required(),
            'limit' => $schema->integer()->description('Max rows (default 40).')->required(),
        ];
    }
}
