<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchRfidSsmsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Query RFID / site safety management: overview KPIs, zone occupancy, who is on site, registered workers, gate entry/exit log, evacuation reports, and portable RFID devices.';
    }

    public function handle(Request $request): Stringable|string
    {
        $search = $request->string('search')->toString();

        return $this->encode($this->iot->rfidSsms(
            domain: $request->string('domain')->toString(),
            search: $search !== '' ? $search : null,
            days: max(1, $request->integer('days') ?: 7),
            limit: max(1, $request->integer('limit') ?: 25),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'domain' => $schema->string()->description(
                'Data area: overview, zones, on_site_personnel, workers, gate_log, evacuations, portable_devices.',
            )->required(),
            'search' => $schema->string()->description('Worker name/badge search (workers domain only), or empty string.')->required(),
            'days' => $schema->integer()->description('Days back for gate_log (default 7).')->required(),
            'limit' => $schema->integer()->description('Max rows (default 25).')->required(),
        ];
    }
}
