<?php

namespace Database\Seeders;

use App\Models\AiMessage;
use App\Models\AiSession;
use App\Models\Alert;
use App\Models\AlertAction;
use App\Models\Camera;
use App\Models\DetectionEvent;
use App\Models\DetectionModule;
use App\Models\Investigation;
use App\Models\MediaObject;
use App\Models\NotificationChannel;
use App\Models\Rule;
use App\Models\Site;
use App\Models\SiteLocation;
use App\Models\User;
use App\Models\Zone;
use App\Services\Ingest\IngestTokenService;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SiteGuardFullDemoSeeder extends Seeder
{
    private const int HISTORY_DAYS = 14;

    /**
     * Demo camera snapshot assets (under public/).
     *
     * @var array<string, string>
     */
    private const DEMO_SNAPSHOTS = [
        'ppe' => 'alert-snapshots/worker-tracking.png',
        'vehicle_proximity' => 'alert-snapshots/forklift-proximity.png',
        'working_at_height' => 'alert-snapshots/critical-fall-zone.png',
    ];

    public function run(): void
    {
        $modules = DetectionModule::query()->get()->keyBy('key');
        $admin = User::query()->where('email', 'admin@siteguard.test')->first();
        $hse = User::query()->where('email', 'hse@siteguard.test')->first();
        $supervisor = User::query()->where('email', 'supervisor@siteguard.test')->first();

        $sites = [
            [
                'code' => 'DEMO-01',
                'name' => 'Riverside Tower — Demo',
                'timezone' => 'Asia/Dubai',
                'address' => 'Plot 12, Riverside Industrial Zone',
                'map_center_lat' => 25.2048,
                'map_center_lng' => 55.2708,
                'volume' => 1.0,
            ],
            [
                'code' => 'NORTH-02',
                'name' => 'North Tower Phase 2',
                'timezone' => 'Asia/Dubai',
                'address' => 'North Tower construction zone',
                'map_center_lat' => 25.2100,
                'map_center_lng' => 55.2750,
                'volume' => 1.2,
            ],
            [
                'code' => 'WEST-03',
                'name' => 'West Yard Logistics',
                'timezone' => 'Asia/Riyadh',
                'address' => 'West yard, heavy equipment zone',
                'map_center_lat' => 24.7136,
                'map_center_lng' => 46.6753,
                'volume' => 0.85,
            ],
        ];

        foreach ($sites as $siteData) {
            $this->seedSite($siteData, $modules, $admin, $hse, $supervisor);
        }
    }

    /**
     * @param  Collection<string, DetectionModule>  $modules
     */
    private function seedSite(
        array $siteData,
        $modules,
        ?User $admin,
        ?User $hse,
        ?User $supervisor,
    ): void {
        $site = Site::query()->updateOrCreate(
            ['code' => $siteData['code']],
            [
                'name' => $siteData['name'],
                'timezone' => $siteData['timezone'],
                'address' => $siteData['address'],
                'status' => 'active',
                'map_center_lat' => $siteData['map_center_lat'],
                'map_center_lng' => $siteData['map_center_lng'],
            ],
        );

        $this->clearSiteHistory($site);

        $moduleSync = [];
        foreach ($modules as $module) {
            $moduleSync[$module->id] = [
                'is_enabled' => true,
                'settings' => json_encode($this->defaultModuleSettings($module->key)),
            ];
        }
        $site->detectionModules()->sync($moduleSync);

        if ($hse !== null) {
            $site->users()->syncWithoutDetaching([$hse->id => ['is_primary' => false]]);
        }
        if ($supervisor !== null && $siteData['code'] === 'DEMO-01') {
            $site->users()->syncWithoutDetaching([$supervisor->id => ['is_primary' => true]]);
        }

        $entrance = SiteLocation::query()->firstOrCreate(
            ['site_id' => $site->id, 'code' => 'ENTRANCE'],
            ['name' => 'Main entrance', 'sort_order' => 1],
        );
        SiteLocation::query()->firstOrCreate(
            ['site_id' => $site->id, 'code' => 'YARD'],
            ['name' => 'Equipment yard', 'sort_order' => 2, 'parent_id' => $entrance->id],
        );

        NotificationChannel::query()->firstOrCreate(
            ['site_id' => $site->id, 'type' => 'email'],
            [
                'config' => ['recipients' => ['hse@siteguard.test']],
                'min_severity' => 'high',
                'is_active' => true,
            ],
        );

        $ppe = $modules->get('ppe');
        $vehicle = $modules->get('vehicle_proximity');
        $height = $modules->get('working_at_height');

        $cameras = [];
        if ($ppe !== null) {
            $cameras[] = $this->seedCamera($site, $ppe, $entrance, 'GATE-01', 'Main gate — PPE', 'online', 3);
        }
        if ($vehicle !== null) {
            $cameras[] = $this->seedCamera($site, $vehicle, $entrance, 'YARD-01', 'Yard — vehicles', 'online', 5);
        }
        if ($height !== null) {
            $health = $siteData['code'] === 'WEST-03' ? 'offline' : 'degraded';
            $ingestMinutes = $siteData['code'] === 'WEST-03' ? 60 * 26 : 120;
            $cameras[] = $this->seedCamera($site, $height, $entrance, 'SCAF-01', 'Scaffold level 3', $health, $ingestMinutes);
        }

        $alerts = [];
        foreach ($cameras as $camera) {
            $alerts = array_merge(
                $alerts,
                $this->seedRulesZonesAndHistory($site, $camera, $admin, (float) $siteData['volume']),
            );
        }

        if ($admin !== null && isset($cameras[0])) {
            $token = $cameras[0]->ingestToken;
            if ($token === null) {
                app(IngestTokenService::class)->issueForCamera($cameras[0], $admin, 'Demo token');
            }
        }

        if (count($alerts) > 0 && $hse !== null) {
            $investigation = Investigation::query()->firstOrCreate(
                [
                    'site_id' => $site->id,
                    'title' => 'Q2 harness compliance review — '.$site->code,
                ],
                [
                    'description' => 'Demo investigation linking critical alerts for supervisor review.',
                    'status' => 'open',
                    'opened_by_user_id' => $hse->id,
                    'assigned_user_id' => $supervisor?->id ?? $hse->id,
                    'opened_at' => now()->subDays(4)->setHour(9),
                ],
            );
            $investigation->alerts()->syncWithoutDetaching(
                collect($alerts)
                    ->where('severity', 'critical')
                    ->take(2)
                    ->pluck('id')
                    ->all(),
            );
        }

        if ($admin !== null) {
            $session = AiSession::query()->firstOrCreate(
                [
                    'site_id' => $site->id,
                    'user_id' => $admin->id,
                    'title' => 'Safety summary — '.$site->name,
                ],
                ['last_message_at' => now()->subHours(3)],
            );
            if ($session->messages()->count() === 0) {
                AiMessage::query()->create([
                    'ai_session_id' => $session->id,
                    'role' => 'user',
                    'content' => 'Summarize open alerts and camera health for this site.',
                ]);
                AiMessage::query()->create([
                    'ai_session_id' => $session->id,
                    'role' => 'assistant',
                    'content' => sprintf(
                        '%s has %d open alerts and %d cameras registered. Check the Alerts inbox for items requiring acknowledgement.',
                        $site->name,
                        Alert::query()->where('site_id', $site->id)->where('status', 'open')->count(),
                        $site->cameras()->count(),
                    ),
                    'citations' => [
                        ['type' => 'alerts', 'label' => 'Alerts inbox'],
                        ['type' => 'cameras', 'label' => 'Camera registry'],
                    ],
                ]);
            }
        }
    }

    private function clearSiteHistory(Site $site): void
    {
        $alertIds = Alert::query()->where('site_id', $site->id)->pluck('id');
        AlertAction::query()->whereIn('alert_id', $alertIds)->delete();
        Alert::query()->where('site_id', $site->id)->delete();
        DetectionEvent::query()->where('site_id', $site->id)->delete();
        MediaObject::query()->where('site_id', $site->id)->delete();
    }

    private function seedCamera(
        Site $site,
        DetectionModule $module,
        SiteLocation $location,
        string $code,
        string $name,
        string $health,
        int $lastIngestMinutesAgo,
    ): Camera {
        return Camera::query()->updateOrCreate(
            ['site_id' => $site->id, 'code' => $code],
            [
                'detection_module_id' => $module->id,
                'site_location_id' => $location->id,
                'name' => $name,
                'location_label' => $location->name,
                'is_active' => true,
                'health_status' => $health,
                'last_ingest_at' => $health === 'online'
                    ? now()->subMinutes($lastIngestMinutesAgo)
                    : now()->subMinutes($lastIngestMinutesAgo),
            ],
        );
    }

    /**
     * @return array<int, Alert>
     */
    private function seedRulesZonesAndHistory(
        Site $site,
        Camera $camera,
        ?User $admin,
        float $volumeMultiplier,
    ): array {
        $camera->load('detectionModule');
        $moduleKey = $camera->detectionModule?->key ?? 'ppe';

        $matchKey = match ($moduleKey) {
            'ppe' => 'no_helmet',
            'vehicle_proximity' => 'person_vehicle_close',
            'working_at_height' => 'no_harness',
            default => 'unknown',
        };

        $rule = Rule::query()->firstOrCreate(
            [
                'site_id' => $site->id,
                'code' => strtoupper($moduleKey).'-001',
            ],
            [
                'detection_module_id' => $camera->detection_module_id,
                'name' => 'Auto rule — '.($camera->detectionModule?->name ?? $moduleKey),
                'severity' => 'high',
                'definition' => ['match' => $matchKey, 'min_confidence' => 0.8],
                'cooldown_sec' => 120,
                'is_active' => true,
            ],
        );

        $zone = Zone::query()->firstOrCreate(
            ['camera_id' => $camera->id, 'name' => 'Primary zone'],
            [
                'site_id' => $site->id,
                'polygon' => [
                    ['x' => 0.15, 'y' => 0.15],
                    ['x' => 0.85, 'y' => 0.15],
                    ['x' => 0.85, 'y' => 0.85],
                    ['x' => 0.15, 'y' => 0.85],
                ],
                'zone_type' => 'monitored',
                'is_active' => true,
            ],
        );
        $zone->rules()->syncWithoutDetaching([$rule->id]);

        $alerts = [];
        $siteSeed = crc32($site->code.$camera->code);

        for ($dayOffset = self::HISTORY_DAYS; $dayOffset >= 0; $dayOffset--) {
            $eventsToday = (int) round((3 + ($siteSeed % 4)) * $volumeMultiplier);
            if ($dayOffset === 0) {
                $eventsToday += 2;
            }
            if (in_array($dayOffset, [6, 13], true)) {
                $eventsToday += 3;
            }

            for ($eventIndex = 0; $eventIndex < $eventsToday; $eventIndex++) {
                $hour = 7 + (($siteSeed + $dayOffset + $eventIndex) % 12);
                $minute = ($eventIndex * 17 + $dayOffset * 7) % 60;
                $capturedAt = now()
                    ->subDays($dayOffset)
                    ->setTime($hour, $minute, 0);

                $createsAlert = ($siteSeed + $dayOffset + $eventIndex) % 100 < 72;
                $severity = $this->pickSeverity($siteSeed, $dayOffset, $eventIndex);
                $status = $createsAlert
                    ? $this->pickStatus($siteSeed, $dayOffset, $eventIndex, $dayOffset <= 1)
                    : null;

                $useDemoSnapshot = $createsAlert && $dayOffset <= 2;
                $event = $this->createDetectionEvent(
                    $site,
                    $camera,
                    $zone,
                    $matchKey,
                    $capturedAt,
                    $dayOffset,
                    $eventIndex,
                    $useDemoSnapshot ? (self::DEMO_SNAPSHOTS[$moduleKey] ?? null) : null,
                );

                if (! $createsAlert) {
                    continue;
                }

                $alert = Alert::query()->create([
                    'site_id' => $site->id,
                    'camera_id' => $camera->id,
                    'detection_module_id' => $camera->detection_module_id,
                    'rule_id' => $rule->id,
                    'severity' => $severity,
                    'status' => $status,
                    'title' => $rule->name.' @ '.$camera->name,
                    'first_detection_event_id' => $event->id,
                    'last_detection_event_id' => $event->id,
                    'occurrence_count' => 1 + ($eventIndex % 3),
                    'opened_at' => $capturedAt,
                    'closed_at' => in_array($status, ['dismissed', 'closed'], true)
                        ? $capturedAt->copy()->addHours(2 + ($eventIndex % 5))
                        : null,
                    'created_at' => $capturedAt,
                    'updated_at' => $capturedAt,
                ]);

                if ($status === 'acknowledged' && $admin !== null) {
                    $ackAt = $capturedAt->copy()->addMinutes(8 + ($eventIndex % 35));
                    AlertAction::query()->create([
                        'alert_id' => $alert->id,
                        'user_id' => $admin->id,
                        'action' => 'acknowledge',
                        'created_at' => $ackAt,
                        'updated_at' => $ackAt,
                    ]);
                }

                if ($status === 'dismissed' && $admin !== null) {
                    $dismissAt = $capturedAt->copy()->addMinutes(20 + ($eventIndex % 40));
                    $isFalsePositive = ($siteSeed + $dayOffset) % 3 !== 0;
                    AlertAction::query()->create([
                        'alert_id' => $alert->id,
                        'user_id' => $admin->id,
                        'action' => 'dismiss',
                        'reason_code' => $isFalsePositive ? 'false_positive' : 'duplicate',
                        'note' => $isFalsePositive ? 'False positive — demo seed' : 'Duplicate detection',
                        'created_at' => $dismissAt,
                        'updated_at' => $dismissAt,
                    ]);
                }

                if ($dayOffset <= 2 && in_array($status, ['open'], true)) {
                    $alerts[] = $alert;
                }
            }
        }

        return $alerts;
    }

    private function pickSeverity(int $siteSeed, int $dayOffset, int $eventIndex): string
    {
        $roll = ($siteSeed + $dayOffset * 3 + $eventIndex) % 10;

        if ($roll <= 1) {
            return 'critical';
        }

        if ($roll <= 4) {
            return 'high';
        }

        if ($roll <= 7) {
            return 'medium';
        }

        return 'low';
    }

    private function pickStatus(int $siteSeed, int $dayOffset, int $eventIndex, bool $preferOpen): string
    {
        if ($preferOpen && ($siteSeed + $eventIndex) % 3 !== 2) {
            return 'open';
        }

        $roll = ($siteSeed + $dayOffset + $eventIndex) % 10;

        if ($roll <= 4) {
            return 'open';
        }

        if ($roll <= 7) {
            return 'acknowledged';
        }

        return 'dismissed';
    }

    private function createDetectionEvent(
        Site $site,
        Camera $camera,
        Zone $zone,
        string $matchKey,
        CarbonInterface $capturedAt,
        int $dayOffset,
        int $eventIndex,
        ?string $publicSnapshotPath = null,
    ): DetectionEvent {
        $ingestId = sprintf(
            'demo-%d-%d-%d-%s',
            $site->id,
            $camera->id,
            $dayOffset,
            $eventIndex,
        );

        $media = MediaObject::query()->create([
            'site_id' => $site->id,
            'camera_id' => $camera->id,
            'storage_key' => $publicSnapshotPath ?? sprintf('demo/sites/%d/events/%s.jpg', $site->id, $ingestId),
            'media_type' => 'snapshot',
            'content_type' => $publicSnapshotPath !== null ? 'image/png' : 'image/jpeg',
            'captured_at' => $capturedAt,
            'created_at' => $capturedAt,
            'updated_at' => $capturedAt,
        ]);

        return DetectionEvent::query()->create([
            'site_id' => $site->id,
            'camera_id' => $camera->id,
            'detection_module_id' => $camera->detection_module_id,
            'ingest_event_id' => (string) Str::uuid(),
            'event_id' => (string) Str::uuid(),
            'captured_at' => $capturedAt,
            'received_at' => $capturedAt,
            'classes' => [['key' => $matchKey, 'confidence' => 0.82 + ($eventIndex % 10) / 100]],
            'bbox' => ['x' => 0.4, 'y' => 0.3, 'w' => 0.2, 'h' => 0.35],
            'zone_ids' => [$zone->id],
            'snapshot_media_id' => $media->id,
            'created_at' => $capturedAt,
            'updated_at' => $capturedAt,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultModuleSettings(string $key): array
    {
        return match ($key) {
            'ppe' => ['no_helmet_min_confidence' => 0.8, 'grace_sec' => 5],
            'vehicle_proximity' => ['critical_distance_m' => 2.0],
            'working_at_height' => ['harness_required_above_m' => 2],
            default => [],
        };
    }
}
