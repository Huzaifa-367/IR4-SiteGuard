<?php

namespace Database\Seeders\Support;

use App\Models\GasGateway;
use App\Models\RfidReader;
use App\Models\RfidZone;
use App\Models\SensorDevice;
use App\Models\Site;
use App\Models\WorkerRecord;
use Carbon\CarbonInterface;
use Illuminate\Support\Str;

class IotHistoricalDataGenerator
{
    private const int FLUSH_THRESHOLD = 2_000;

    public function __construct(
        private Site $site,
        private float $scale,
        private int $siteSeed,
        private IotWorkCalendar $calendar,
        private IotBulkInserter $bulk,
    ) {}

    /**
     * @param  array<string, WorkerRecord>  $workers
     */
    public function seedGateLifecycle(RfidReader $gateReader, array $workers): void
    {
        $workerList = array_values($workers);
        if ($workerList === []) {
            return;
        }

        $rows = [];
        $onSiteToday = [];

        foreach ($this->calendar->workingDays() as $day) {
            $target = $this->calendar->gateEventsTarget($day);
            $entriesPlanned = (int) max(8, round($target * 0.58));
            $onSiteToday = [];

            for ($i = 0; $i < $entriesPlanned; $i++) {
                $worker = $workerList[$this->calendar->seededInt($day->toDateString()."-w{$i}", 0, count($workerList) - 1)];
                $entryAt = $this->calendar->workTimestamp($day, "entry-{$i}", 5, 9);

                if ($entryAt->isFuture()) {
                    continue;
                }

                $rows[] = [
                    'site_id' => $this->site->id,
                    'tag_epc' => $worker->tag_epc,
                    'worker_record_id' => $worker->id,
                    'direction' => 'entry',
                    'occurred_at' => $entryAt->toDateTimeString(),
                    'gate_reader_id' => $gateReader->id,
                ];
                $onSiteToday[$worker->tag_epc] = $entryAt;

                $shouldExit = $day->isToday()
                    ? ($i < $entriesPlanned - 3)
                    : $this->calendar->deterministicChance($day->toDateString()."-exit-{$worker->tag_epc}", 0.9);

                if ($shouldExit) {
                    $exitAt = $this->calendar->workTimestamp($day, "exit-{$i}", 15, 19);
                    if ($exitAt->isFuture()) {
                        continue;
                    }

                    $rows[] = [
                        'site_id' => $this->site->id,
                        'tag_epc' => $worker->tag_epc,
                        'worker_record_id' => $worker->id,
                        'direction' => 'exit',
                        'occurred_at' => $exitAt->toDateTimeString(),
                        'gate_reader_id' => $gateReader->id,
                    ];
                    unset($onSiteToday[$worker->tag_epc]);
                }
            }

            $this->maybeFlush('gate_entry_exit_log', $rows);
        }

        foreach (IotScenarioCatalog::workers() as $def) {
            if (! isset($workers[$def['tag_epc']]) || ! $def['on_site_default']) {
                continue;
            }

            $worker = $workers[$def['tag_epc']];
            $rows[] = [
                'site_id' => $this->site->id,
                'tag_epc' => $worker->tag_epc,
                'worker_record_id' => $worker->id,
                'direction' => 'entry',
                'occurred_at' => now()->subHours(2)->toDateTimeString(),
                'gate_reader_id' => $gateReader->id,
            ];
        }

        $this->bulk->insert('gate_entry_exit_log', $rows);
    }

    /**
     * @param  array<string, RfidReader>  $readers
     * @param  array<string, WorkerRecord>  $workers
     * @param  array<string, RfidZone>  $zones
     */
    public function seedZoneReadEvents(array $readers, array $workers, array $zones): void
    {
        $zoneReaders = collect($readers)->filter(fn (RfidReader $r): bool => $r->mount_type !== 'gate');
        $workerList = array_values($workers);
        $workerZones = $this->workerZoneMap($workers, $zones);
        $rows = [];

        foreach ($this->calendar->workingDays() as $day) {
            $perReader = $this->calendar->rfidReadsPerReader($day);

            foreach ($zoneReaders as $reader) {
                $batchId = (string) Str::uuid();

                for ($i = 0; $i < $perReader; $i++) {
                    $worker = $workerList[$this->calendar->seededInt($day->toDateString()."{$reader->id}-{$i}", 0, count($workerList) - 1)];
                    $preferredZone = $workerZones[$worker->tag_epc] ?? $reader->rfid_zone_id;
                    $readAt = $this->calendar->workTimestamp($day, "read-{$reader->id}-{$i}", 7, 17);

                    if ($readAt->isFuture()) {
                        continue;
                    }

                    $rows[] = [
                        'site_id' => $this->site->id,
                        'rfid_reader_id' => $reader->id,
                        'rfid_zone_id' => $preferredZone,
                        'tag_epc' => $worker->tag_epc,
                        'worker_record_id' => $worker->id,
                        'rssi' => -42 - ($this->calendar->seededInt($worker->tag_epc.$readAt->timestamp, 0, 28)),
                        'read_at' => $readAt->toDateTimeString(),
                        'batch_id' => $batchId,
                    ];
                }
            }

            $this->maybeFlush('rfid_read_events', $rows);
        }

        $this->bulk->insert('rfid_read_events', $rows);
    }

    /**
     * @param  array<string, GasGateway>  $gateways
     * @return list<array{gateway_id: int, alarm_at: CarbonInterface, cleared_at: CarbonInterface|null, lel: float, severity: string}>
     */
    public function seedGasReadings(array $gateways): array
    {
        $thresholds = config('siteguard.gas_thresholds');
        $rows = [];
        $alarmEvents = [];
        $gatewayList = array_values($gateways);

        $pollInterval = $this->calendar->gasPollIntervalMinutes();

        foreach ($this->calendar->workingDays() as $day) {
            $polls = $this->calendar->gasPollsPerGateway($day);

            foreach ($gatewayList as $gatewayIndex => $gateway) {
                $code = array_search($gateway, $gateways, true) ?: 'gas-gw-'.($gatewayIndex + 1);

                for ($poll = 0; $poll < $polls; $poll++) {
                    $readAt = $day->copy()->setTime(5, 0)->addMinutes($poll * $pollInterval);
                    if ($readAt->isFuture()) {
                        continue;
                    }

                    $lel = 1.8 + ($this->calendar->seededInt($readAt->toDateString().$gateway->id.$poll, 0, 90) / 10);
                    $alarmState = 'normal';
                    $alarmGases = [];

                    $isSpike = $this->calendar->deterministicChance($readAt->toDateString().'-lel-'.$gateway->id, 0.004);
                    if ($isSpike) {
                        $lel = 10 + $this->calendar->seededInt($readAt->toDateString().'-lel-val', 0, 140) / 10;
                        $alarmState = $lel >= ($thresholds['lel_pct']['high'] ?? 20) ? 'high_alarm' : 'low_alarm';
                        $alarmGases = ['lel_pct'];
                        $alarmEvents[] = [
                            'gateway_id' => $gateway->id,
                            'alarm_at' => $readAt->copy(),
                            'cleared_at' => $this->calendar->deterministicChance($readAt->toDateString().'-clear', 0.82)
                                ? $readAt->copy()->addMinutes(15 + $this->calendar->seededInt('clr', 0, 45))
                                : null,
                            'lel' => $lel,
                            'severity' => $lel >= ($thresholds['lel_pct']['high'] ?? 20) ? 'critical' : 'high',
                        ];
                    }

                    $rows[] = [
                        'site_id' => $this->site->id,
                        'gas_gateway_id' => $gateway->id,
                        'lel_pct' => round($lel, 2),
                        'o2_pct' => round(20.6 + ($poll % 6) / 10, 2),
                        'h2s_ppm' => round(0.3 + ($poll % 4) / 2, 2),
                        'co_ppm' => round(1.5 + ($poll % 5), 2),
                        'alarm_state' => $alarmState,
                        'alarm_gases' => json_encode($alarmGases),
                        'poll_type' => $poll % 5 === 0 ? 'manual' : 'scheduled',
                        'detector_serial' => 'BW-'.strtoupper(substr((string) $code, -2)).'-2024',
                        'read_at' => $readAt->toDateTimeString(),
                        'event_id' => (string) Str::uuid(),
                    ];
                }
            }

            $this->maybeFlush('gas_readings', $rows);
        }

        $this->bulk->insert('gas_readings', $rows);

        $gw2 = $gateways['gas-gw-vehicle-02'] ?? $gatewayList[1] ?? null;
        if ($gw2 !== null) {
            $alarmEvents[] = [
                'gateway_id' => $gw2->id,
                'alarm_at' => now()->subDays(3)->setTime(14, 22),
                'cleared_at' => now()->subDays(3)->setTime(15, 10),
                'lel' => 22.4,
                'severity' => 'critical',
            ];
            $alarmEvents[] = [
                'gateway_id' => $gw2->id,
                'alarm_at' => now()->subHours(2),
                'cleared_at' => null,
                'lel' => 11.2,
                'severity' => 'high',
            ];
        }

        return $alarmEvents;
    }

    /**
     * @param  list<array{gateway_id: int, alarm_at: CarbonInterface, cleared_at: CarbonInterface|null, lel: float, severity: string}>  $alarmEvents
     */
    public function seedGasSensorAlarms(array $alarmEvents): void
    {
        if ($alarmEvents === []) {
            return;
        }

        $thresholds = config('siteguard.gas_thresholds');
        $rows = [];

        foreach ($alarmEvents as $event) {
            $rows[] = [
                'site_id' => $this->site->id,
                'source_type' => GasGateway::class,
                'source_id' => $event['gateway_id'],
                'parameter' => 'lel_pct',
                'value' => $event['lel'],
                'threshold' => $event['lel'] >= ($thresholds['lel_pct']['high'] ?? 20)
                    ? $thresholds['lel_pct']['high']
                    : $thresholds['lel_pct']['low'],
                'severity' => $event['severity'],
                'alarm_at' => $event['alarm_at']->toDateTimeString(),
                'cleared_at' => $event['cleared_at']?->toDateTimeString(),
                'alert_id' => null,
            ];
        }

        $this->bulk->insert('sensor_alarms', $rows);
    }

    /**
     * @param  array<string, SensorDevice>  $sensors
     */
    public function seedEnvironmentalReadings(array $sensors): void
    {
        $rows = [];

        $pollInterval = $this->calendar->gasPollIntervalMinutes();

        foreach ($this->calendar->workingDays() as $day) {
            $polls = $this->calendar->gasPollsPerGateway($day);

            foreach ($sensors as $sensor) {
                for ($poll = 0; $poll < $polls; $poll++) {
                    $readAt = $day->copy()->setTime(5, 0)->addMinutes($poll * $pollInterval);
                    if ($readAt->isFuture()) {
                        continue;
                    }

                    $params = $sensor->device_type === 'co2_ndir'
                        ? [['parameter' => 'co2_ppm', 'value' => 410 + ($poll % 25), 'unit' => 'ppm']]
                        : [
                            ['parameter' => 'temp_c', 'value' => 32 + ($this->calendar->seededInt($readAt->toDateString().'t', 0, 14)), 'unit' => 'C'],
                            ['parameter' => 'humidity_pct', 'value' => 40 + ($poll % 20), 'unit' => '%'],
                            ['parameter' => 'wind_speed_mps', 'value' => 1.5 + ($poll % 6), 'unit' => 'm/s'],
                        ];

                    foreach ($params as $row) {
                        $rows[] = [
                            'site_id' => $this->site->id,
                            'sensor_device_id' => $sensor->id,
                            'gas_gateway_id' => null,
                            'parameter' => $row['parameter'],
                            'value' => $row['value'],
                            'unit' => $row['unit'],
                            'quality' => 'good',
                            'assurance_tier' => 'instrumented',
                            'read_at' => $readAt->toDateTimeString(),
                            'event_id' => (string) Str::uuid(),
                        ];
                    }
                }
            }

            $this->maybeFlush('sensor_readings', $rows);
        }

        $this->bulk->insert('sensor_readings', $rows);
    }

    public function seedHeadcountSnapshots(): void
    {
        $rows = [];
        $zoneIds = $this->site->rfidZones()->pluck('id');

        $snapshotsPerDay = max(1, (int) config('siteguard.iot_demo_seed.headcount_snapshots_per_work_day', 3));
        $snapshotHours = [7, 12, 17, 19];

        foreach ($this->calendar->workingDays() as $day) {
            $factor = $this->calendar->headcountFactor($day);
            $baseOnSite = max(8, (int) round(22 * $factor));

            for ($snapshot = 0; $snapshot < $snapshotsPerDay; $snapshot++) {
                $hour = $snapshotHours[$snapshot] ?? 12;
                $recordedAt = $day->copy()->setTime($hour, 0);
                if ($recordedAt->isFuture()) {
                    continue;
                }

                $ramp = match ($hour) {
                    7 => 0.55,
                    12 => 1.0,
                    17 => 0.82,
                    default => 0.35,
                };
                $onSite = max(3, (int) round($baseOnSite * $ramp));
                $byZone = [];

                foreach ($zoneIds as $index => $zoneId) {
                    if ($index === 0) {
                        continue;
                    }
                    $byZone[$zoneId] = max(0, (int) round($onSite * (0.12 + ($index % 4) * 0.09)));
                }

                $rows[] = [
                    'site_id' => $this->site->id,
                    'recorded_at' => $recordedAt->toDateTimeString(),
                    'on_site_count' => $onSite,
                    'by_zone' => json_encode($byZone),
                    'source' => 'gate',
                ];
            }
        }

        $this->bulk->insert('site_headcount_snapshots', $rows);
    }

    /**
     * @param  array<string, WorkerRecord>  $workers
     * @param  array<string, RfidZone>  $zones
     * @return array<int, int> tag_epc => zone_id
     */
    private function workerZoneMap(array $workers, array $zones): array
    {
        $map = [];

        foreach (IotScenarioCatalog::workers() as $def) {
            if (! isset($workers[$def['tag_epc']], $zones[$def['zone_code']])) {
                continue;
            }
            $map[$def['tag_epc']] = $zones[$def['zone_code']]->id;
        }

        return $map;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function maybeFlush(string $table, array &$rows): void
    {
        if (count($rows) < self::FLUSH_THRESHOLD) {
            return;
        }

        $this->bulk->insertChunk($table, $rows);
        $rows = [];
    }
}
