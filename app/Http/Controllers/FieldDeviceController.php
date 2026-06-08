<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreEdgeDeviceRequest;
use App\Http\Requests\StoreGasGatewayRequest;
use App\Http\Requests\StoreRfidReaderRequest;
use App\Http\Requests\StoreSensorDeviceRequest;
use App\Models\EdgeDevice;
use App\Models\GasGateway;
use App\Models\RfidReader;
use App\Models\RfidZone;
use App\Models\SensorDevice;
use App\Services\Ingest\IngestTokenService;
use App\Support\IotAnalytics;
use App\Support\SiteGuardEnums;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class FieldDeviceController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:rfid.view|gas.view|environmental.view', only: [
                'overview', 'edgeDevices', 'rfidReaders', 'gasGateways', 'sensorDevices', 'show',
            ]),
            new Middleware('permission:rfid_zones.manage|sensors.manage', only: ['storeEdge', 'storeRfidReader', 'storeGasGateway', 'storeSensorDevice']),
            new Middleware('permission:api_tokens.manage', only: ['issueToken']),
        ];
    }

    public function overview(Request $request, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('iot/field-devices/overview', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'analytics' => $iotAnalytics->fieldDevicesAnalytics($site->id),
        ]);
    }

    public function edgeDevices(Request $request): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('iot/field-devices/edge', $this->listPageProps($request, $site, [
            'devices' => EdgeDevice::query()
                ->where('site_id', $site->id)
                ->with('ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at')
                ->orderBy('code')
                ->get()
                ->map(fn (EdgeDevice $d): array => $this->presentEdge($d)),
            'mountTypeOptions' => SiteGuardEnums::options('mount_types'),
        ]));
    }

    public function rfidReaders(Request $request): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('iot/field-devices/rfid-readers', $this->listPageProps($request, $site, [
            'devices' => RfidReader::query()
                ->where('site_id', $site->id)
                ->with(['rfidZone:id,name,code', 'ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at'])
                ->orderBy('code')
                ->get()
                ->map(fn (RfidReader $r): array => $this->presentReader($r)),
            'rfidZones' => RfidZone::query()
                ->where('site_id', $site->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'zone_type']),
            'mountTypeOptions' => SiteGuardEnums::options('mount_types'),
        ]));
    }

    public function gasGateways(Request $request): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('iot/field-devices/gas-gateways', $this->listPageProps($request, $site, [
            'devices' => GasGateway::query()
                ->where('site_id', $site->id)
                ->with('ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at')
                ->orderBy('code')
                ->get()
                ->map(fn (GasGateway $g): array => $this->presentGasGateway($g)),
            'edgeOptions' => EdgeDevice::query()
                ->where('site_id', $site->id)
                ->orderBy('code')
                ->get(['id', 'name', 'code']),
        ]));
    }

    public function sensorDevices(Request $request): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('iot/field-devices/sensors', $this->listPageProps($request, $site, [
            'devices' => SensorDevice::query()
                ->where('site_id', $site->id)
                ->with('ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at')
                ->orderBy('code')
                ->get()
                ->map(fn (SensorDevice $s): array => $this->presentSensor($s)),
            'sensorDeviceTypeOptions' => SiteGuardEnums::options('sensor_device_types'),
        ]));
    }

    /**
     * @return array<string, mixed>
     */
    private function listPageProps(Request $request, $site, array $extra): array
    {
        return array_merge([
            'site' => ['id' => $site->id, 'name' => $site->name],
            'ingestTokenPlain' => $request->session()->pull('ingest_token_plain'),
            'permissions' => [
                'canManage' => ($request->user()?->can('rfid_zones.manage') || $request->user()?->can('sensors.manage')) ?? false,
                'canManageTokens' => $request->user()?->can('api_tokens.manage') ?? false,
            ],
        ], $extra);
    }

    public function show(Request $request, string $type, int $id): Response
    {
        $site = $this->selectedSite($request);

        $device = match ($type) {
            'edge' => EdgeDevice::query()
                ->where('site_id', $site->id)
                ->with('ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at')
                ->findOrFail($id),
            'rfid' => RfidReader::query()
                ->where('site_id', $site->id)
                ->with(['rfidZone:id,name,code,zone_type', 'ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at'])
                ->findOrFail($id),
            'gas' => GasGateway::query()
                ->where('site_id', $site->id)
                ->with(['edgeDevice:id,name,code', 'ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at'])
                ->findOrFail($id),
            'sensor' => SensorDevice::query()
                ->where('site_id', $site->id)
                ->with('ingestToken:tokenable_type,tokenable_id,token_prefix,revoked_at,last_used_at')
                ->findOrFail($id),
            default => abort(404),
        };

        $presented = match ($type) {
            'edge' => $this->presentEdge($device),
            'rfid' => $this->presentReader($device),
            'gas' => array_merge($this->presentGasGateway($device), [
                'edge_device' => $device->edgeDevice ? [
                    'id' => $device->edgeDevice->id,
                    'name' => $device->edgeDevice->name,
                    'code' => $device->edgeDevice->code,
                ] : null,
            ]),
            'sensor' => array_merge($this->presentSensor($device), [
                'modbus_config' => $device->settings['modbus'] ?? null,
            ]),
            default => [],
        };

        return Inertia::render('iot/field-device-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'deviceType' => $type,
            'device' => $presented,
            'permissions' => [
                'canManageTokens' => $request->user()?->can('api_tokens.manage') ?? false,
            ],
        ]);
    }

    public function storeEdge(StoreEdgeDeviceRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $site->edgeDevices()->create($request->validated());

        return $this->flashRedirect(__('Edge device registered.'), 'iot.field-devices.edge.index');
    }

    public function storeRfidReader(StoreRfidReaderRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $site->rfidReaders()->create($request->validated());

        return $this->flashRedirect(__('RFID reader registered.'), 'iot.field-devices.rfid-readers.index');
    }

    public function storeGasGateway(StoreGasGatewayRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $site->gasGateways()->create($request->validated());

        return $this->flashRedirect(__('Gas gateway registered.'), 'iot.field-devices.gas-gateways.index');
    }

    public function storeSensorDevice(StoreSensorDeviceRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $site->sensorDevices()->create($request->validated());

        return $this->flashRedirect(__('Sensor device registered.'), 'iot.field-devices.sensors.index');
    }

    public function issueToken(Request $request, string $type, int $id, IngestTokenService $tokens): RedirectResponse
    {
        $device = match ($type) {
            'edge' => EdgeDevice::query()->findOrFail($id),
            'rfid' => RfidReader::query()->findOrFail($id),
            'gas' => GasGateway::query()->findOrFail($id),
            'sensor' => SensorDevice::query()->findOrFail($id),
            default => abort(404),
        };

        $site = $this->selectedSite($request);
        abort_unless((int) $device->site_id === (int) $site->id, 403);

        $issued = $tokens->issueFor($device, $request->user());

        $returnRoute = match ($type) {
            'edge' => 'iot.field-devices.edge.index',
            'rfid' => 'iot.field-devices.rfid-readers.index',
            'gas' => 'iot.field-devices.gas-gateways.index',
            'sensor' => 'iot.field-devices.sensors.index',
            default => 'iot.field-devices.overview',
        };

        return to_route($returnRoute)->with('ingest_token_plain', $issued['plain_text']);
    }

    private function flashRedirect(string $message, string $route): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route($route);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentEdge(EdgeDevice $d): array
    {
        return [
            'id' => $d->id,
            'name' => $d->name,
            'code' => $d->code,
            'health_status' => $d->health_status,
            'last_heartbeat_at' => $d->last_heartbeat_at?->toIso8601String(),
            'ingest_token' => $this->presentToken($d),
            'token_type' => 'edge',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentReader(RfidReader $r): array
    {
        return [
            'id' => $r->id,
            'name' => $r->name,
            'code' => $r->code,
            'mount_type' => $r->mount_type,
            'zone' => $r->rfidZone?->name,
            'health_status' => $r->health_status,
            'last_ingest_at' => $r->last_ingest_at?->toIso8601String(),
            'ingest_token' => $this->presentToken($r),
            'token_type' => 'rfid',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentGasGateway(GasGateway $g): array
    {
        return [
            'id' => $g->id,
            'name' => $g->name,
            'code' => $g->code,
            'vehicle_label' => $g->vehicle_label,
            'health_status' => $g->health_status,
            'last_ingest_at' => $g->last_ingest_at?->toIso8601String(),
            'ingest_token' => $this->presentToken($g),
            'token_type' => 'gas',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentSensor(SensorDevice $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'code' => $s->code,
            'device_type' => $s->device_type,
            'health_status' => $s->health_status,
            'last_ingest_at' => $s->last_ingest_at?->toIso8601String(),
            'ingest_token' => $this->presentToken($s),
            'token_type' => 'sensor',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function presentToken(EdgeDevice|RfidReader|GasGateway|SensorDevice $device): ?array
    {
        if ($device->ingestToken === null) {
            return null;
        }

        return [
            'prefix' => $device->ingestToken->token_prefix,
            'revoked' => $device->ingestToken->revoked_at !== null,
            'last_used_at' => $device->ingestToken->last_used_at?->toIso8601String(),
        ];
    }
}
