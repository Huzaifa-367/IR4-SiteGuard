<?php

namespace Tests\Feature\Api;

use App\Jobs\EvaluateRfidRulesJob;
use App\Models\EdgeDevice;
use App\Models\GasGateway;
use App\Models\RfidReader;
use App\Models\RfidTagLastSeen;
use App\Models\RfidZone;
use App\Models\Rule;
use App\Models\Site;
use App\Models\WorkerRecord;
use App\Services\Ingest\IngestTokenService;
use App\Support\DefaultSiteRules;
use Database\Seeders\DetectionModuleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class IotIngestExtendedTest extends TestCase
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

    public function test_gate_exit_decrements_on_site_headcount(): void
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

        $this->postJson(route('api.ingest.rfid'), [
            'reader_id' => $reader->id,
            'payload' => [
                'batch_id' => (string) Str::uuid(),
                'read_at' => now()->toIso8601String(),
                'events' => [
                    ['epc' => 'E2801160600002040000ABCDEF', 'direction' => 'entry', 'read_at' => now()->toIso8601String()],
                ],
            ],
        ], ['Authorization' => 'Bearer '.$token])->assertStatus(202);

        $this->postJson(route('api.ingest.rfid'), [
            'reader_id' => $reader->id,
            'payload' => [
                'batch_id' => (string) Str::uuid(),
                'read_at' => now()->toIso8601String(),
                'events' => [
                    ['epc' => 'E2801160600002040000ABCDEF', 'direction' => 'exit', 'read_at' => now()->toIso8601String()],
                ],
            ],
        ], ['Authorization' => 'Bearer '.$token])->assertStatus(202);

        $this->assertFalse(
            RfidTagLastSeen::query()
                ->where('site_id', $this->site->id)
                ->where('tag_epc', 'E2801160600002040000ABCDEF')
                ->where('is_on_site', true)
                ->exists()
        );
    }

    public function test_rfid_unauthorized_zone_creates_alert_and_lsr_log(): void
    {
        DefaultSiteRules::seedFor($this->site);

        $zone = RfidZone::query()->create([
            'site_id' => $this->site->id,
            'name' => 'Restricted area',
            'code' => 'restricted-a',
            'zone_type' => 'restricted',
            'authorized_worker_ids' => [],
        ]);

        $reader = RfidReader::query()->create([
            'site_id' => $this->site->id,
            'rfid_zone_id' => $zone->id,
            'name' => 'Zone reader',
            'code' => 'reader-restricted',
            'mount_type' => 'pole',
        ]);

        WorkerRecord::query()->create([
            'site_id' => $this->site->id,
            'tag_epc' => 'E2801160600002040000BAD001',
            'full_name' => 'Unauthorized Worker',
            'contractor' => 'Contractor B',
            'role' => 'Laborer',
            'is_active' => true,
        ]);

        $batchId = (string) Str::uuid();
        $token = app(IngestTokenService::class)->issueFor($reader)['plain_text'];

        $this->postJson(route('api.ingest.rfid'), [
            'reader_id' => $reader->id,
            'payload' => [
                'batch_id' => $batchId,
                'read_at' => now()->toIso8601String(),
                'events' => [
                    ['epc' => 'E2801160600002040000BAD001', 'read_at' => now()->toIso8601String()],
                ],
            ],
        ], ['Authorization' => 'Bearer '.$token])->assertStatus(202);

        (new EvaluateRfidRulesJob($reader->id, $batchId))->handle();

        $rule = Rule::query()->where('site_id', $this->site->id)->where('code', 'RFID-001')->first();

        $this->assertNotNull($rule);
        $this->assertDatabaseHas('alerts', [
            'site_id' => $this->site->id,
            'rule_id' => $rule->id,
            'status' => 'open',
        ]);
        $this->assertDatabaseHas('lsr_violation_logs', [
            'site_id' => $this->site->id,
            'lsr_category' => 'LSR-RZ-001',
            'detection_mode' => 'automated',
        ]);
    }

    public function test_gas_threshold_breach_creates_sensor_alarm_and_alert(): void
    {
        DefaultSiteRules::seedFor($this->site);

        $edge = EdgeDevice::query()->create([
            'site_id' => $this->site->id,
            'name' => 'Vehicle edge',
            'code' => 'edge-01',
            'mount_type' => 'vehicle',
        ]);

        $gateway = GasGateway::query()->create([
            'site_id' => $this->site->id,
            'edge_device_id' => $edge->id,
            'name' => 'Gas GW',
            'code' => 'gas-01',
        ]);

        $token = app(IngestTokenService::class)->issueFor($gateway)['plain_text'];
        $eventId = (string) Str::uuid();

        $this->postJson(route('api.ingest.gas'), [
            'gas_gateway_id' => $gateway->id,
            'payload' => [
                'event_id' => $eventId,
                'read_at' => now()->toIso8601String(),
                'readings' => [
                    'lel_pct' => 25,
                    'o2_pct' => 20.9,
                    'h2s_ppm' => 0,
                    'co_ppm' => 0,
                ],
                'alarm_state' => 'high_alarm',
                'alarm_gases' => ['lel'],
                'poll_type' => 'scheduled',
            ],
        ], ['Authorization' => 'Bearer '.$token])->assertStatus(202);

        $this->assertDatabaseHas('sensor_alarms', [
            'site_id' => $this->site->id,
            'parameter' => 'lel_pct',
        ]);

        $this->assertDatabaseHas('alerts', [
            'site_id' => $this->site->id,
            'status' => 'open',
        ]);
    }
}
