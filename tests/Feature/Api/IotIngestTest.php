<?php

namespace Tests\Feature\Api;

use App\Models\EdgeDevice;
use App\Models\GasGateway;
use App\Models\RfidReader;
use App\Models\RfidTagLastSeen;
use App\Models\RfidZone;
use App\Models\SensorDevice;
use App\Models\Site;
use App\Models\WorkerRecord;
use App\Services\Ingest\IngestTokenService;
use Database\Seeders\DetectionModuleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class IotIngestTest extends TestCase
{
    use RefreshDatabase;

    private Site $site;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DetectionModuleSeeder::class);

        $this->site = Site::query()->create([
            'name' => 'Central TCF',
            'code' => 'CTCF',
            'timezone' => 'Asia/Riyadh',
            'status' => 'active',
            'settings' => config('siteguard.site_defaults'),
        ]);
    }

    public function test_gate_rfid_entry_increments_on_site_headcount(): void
    {
        $zone = RfidZone::query()->create([
            'site_id' => $this->site->id,
            'name' => 'Main gate',
            'code' => 'gate',
            'zone_type' => 'gate',
        ]);

        $reader = RfidReader::query()->create([
            'site_id' => $this->site->id,
            'rfid_zone_id' => $zone->id,
            'name' => 'Gate reader',
            'code' => 'gate-main',
            'mount_type' => 'gate',
        ]);

        WorkerRecord::query()->create([
            'site_id' => $this->site->id,
            'tag_epc' => 'E2801160600002040000ABCDEF',
            'full_name' => 'Test Worker',
            'contractor' => 'Contractor A',
            'role' => 'Welder',
            'is_active' => true,
        ]);

        $token = app(IngestTokenService::class)->issueFor($reader)['plain_text'];
        $batchId = (string) Str::uuid();

        $response = $this->postJson(route('api.ingest.rfid'), [
            'reader_id' => $reader->id,
            'payload' => [
                'batch_id' => $batchId,
                'read_at' => now()->toIso8601String(),
                'events' => [
                    [
                        'epc' => 'E2801160600002040000ABCDEF',
                        'direction' => 'entry',
                        'read_at' => now()->toIso8601String(),
                    ],
                ],
            ],
        ], ['Authorization' => 'Bearer '.$token]);

        $response->assertStatus(202)->assertJson(['status' => 'accepted', 'events_accepted' => 1]);

        $this->assertDatabaseHas('gate_entry_exit_log', [
            'site_id' => $this->site->id,
            'direction' => 'entry',
        ]);

        $this->assertTrue(
            RfidTagLastSeen::query()
                ->where('site_id', $this->site->id)
                ->where('tag_epc', 'E2801160600002040000ABCDEF')
                ->where('is_on_site', true)
                ->exists()
        );
    }

    public function test_gas_ingest_persists_reading_and_rejects_token_mismatch(): void
    {
        $edge = EdgeDevice::query()->create([
            'site_id' => $this->site->id,
            'name' => 'Vehicle 1 edge',
            'code' => 'edge-vehicle-01',
            'mount_type' => 'vehicle',
        ]);

        $gateway = GasGateway::query()->create([
            'site_id' => $this->site->id,
            'edge_device_id' => $edge->id,
            'name' => 'Gas GW 1',
            'code' => 'gas-gw-01',
        ]);

        $otherGateway = GasGateway::query()->create([
            'site_id' => $this->site->id,
            'edge_device_id' => $edge->id,
            'name' => 'Gas GW 2',
            'code' => 'gas-gw-02',
        ]);

        $token = app(IngestTokenService::class)->issueFor($gateway)['plain_text'];
        $eventId = (string) Str::uuid();

        $this->postJson(route('api.ingest.gas'), [
            'gas_gateway_id' => $otherGateway->id,
            'payload' => $this->gasPayload($eventId),
        ], ['Authorization' => 'Bearer '.$token])
            ->assertStatus(422);

        $this->postJson(route('api.ingest.gas'), [
            'gas_gateway_id' => $gateway->id,
            'payload' => $this->gasPayload($eventId),
        ], ['Authorization' => 'Bearer '.$token])
            ->assertStatus(202)
            ->assertJson(['status' => 'accepted']);

        $this->assertDatabaseHas('gas_readings', [
            'gas_gateway_id' => $gateway->id,
            'event_id' => $eventId,
        ]);

        $this->postJson(route('api.ingest.gas'), [
            'gas_gateway_id' => $gateway->id,
            'payload' => $this->gasPayload($eventId),
        ], ['Authorization' => 'Bearer '.$token])
            ->assertStatus(200)
            ->assertJson(['status' => 'duplicate']);
    }

    public function test_sensor_ingest_persists_instrumented_readings(): void
    {
        $edge = EdgeDevice::query()->create([
            'site_id' => $this->site->id,
            'name' => 'Vehicle 1 edge',
            'code' => 'edge-vehicle-01',
            'mount_type' => 'vehicle',
        ]);

        $device = SensorDevice::query()->create([
            'site_id' => $this->site->id,
            'edge_device_id' => $edge->id,
            'device_type' => 'co2_ndir',
            'name' => 'CO2 sensor',
            'code' => 'co2-01',
        ]);

        $token = app(IngestTokenService::class)->issueFor($device)['plain_text'];
        $eventId = (string) Str::uuid();

        $this->postJson(route('api.ingest.sensor'), [
            'sensor_device_id' => $device->id,
            'payload' => [
                'event_id' => $eventId,
                'read_at' => now()->toIso8601String(),
                'readings' => [
                    ['parameter' => 'co2_ppm', 'value' => 412.5, 'unit' => 'ppm', 'quality' => 'good'],
                ],
            ],
        ], ['Authorization' => 'Bearer '.$token])
            ->assertStatus(202);

        $this->assertDatabaseHas('sensor_readings', [
            'sensor_device_id' => $device->id,
            'parameter' => 'co2_ppm',
            'assurance_tier' => 'instrumented',
        ]);
    }

    public function test_edge_heartbeat_updates_device_health(): void
    {
        $edge = EdgeDevice::query()->create([
            'site_id' => $this->site->id,
            'name' => 'Vehicle 1 edge',
            'code' => 'edge-vehicle-01',
            'mount_type' => 'vehicle',
        ]);

        $token = app(IngestTokenService::class)->issueFor($edge)['plain_text'];

        $this->postJson(route('api.ingest.edge.heartbeat'), [
            'edge_device_id' => $edge->id,
            'payload' => [
                'event_id' => (string) Str::uuid(),
                'reported_at' => now()->toIso8601String(),
                'vpn_up' => true,
                'software_version' => '1.0.0',
            ],
        ], ['Authorization' => 'Bearer '.$token])
            ->assertStatus(202);

        $edge->refresh();

        $this->assertSame('online', $edge->health_status);
        $this->assertSame('1.0.0', $edge->software_version);
    }

    /**
     * @return array<string, mixed>
     */
    private function gasPayload(string $eventId): array
    {
        return [
            'event_id' => $eventId,
            'read_at' => now()->toIso8601String(),
            'readings' => [
                'lel_pct' => 0,
                'o2_pct' => 20.9,
                'h2s_ppm' => 0,
                'co_ppm' => 0,
            ],
            'alarm_state' => 'normal',
            'alarm_gases' => [],
            'poll_type' => 'scheduled',
        ];
    }
}
