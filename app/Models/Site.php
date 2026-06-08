<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'timezone',
        'address',
        'status',
        'map_center_lat',
        'map_center_lng',
        'settings',
        'external_ref',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'map_center_lat' => 'decimal:7',
            'map_center_lng' => 'decimal:7',
        ];
    }

    public function locations(): HasMany
    {
        return $this->hasMany(SiteLocation::class);
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'site_user')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function detectionModules(): BelongsToMany
    {
        return $this->belongsToMany(DetectionModule::class, 'site_detection_modules')
            ->withPivot(['is_enabled', 'settings'])
            ->withTimestamps();
    }

    public function rules(): HasMany
    {
        return $this->hasMany(Rule::class);
    }

    public function investigations(): HasMany
    {
        return $this->hasMany(Investigation::class);
    }

    public function notificationChannels(): HasMany
    {
        return $this->hasMany(NotificationChannel::class);
    }

    public function aiSessions(): HasMany
    {
        return $this->hasMany(AiSession::class);
    }

    public function edgeDevices(): HasMany
    {
        return $this->hasMany(EdgeDevice::class);
    }

    public function rfidZones(): HasMany
    {
        return $this->hasMany(RfidZone::class);
    }

    public function rfidReaders(): HasMany
    {
        return $this->hasMany(RfidReader::class);
    }

    public function gasGateways(): HasMany
    {
        return $this->hasMany(GasGateway::class);
    }

    public function sensorDevices(): HasMany
    {
        return $this->hasMany(SensorDevice::class);
    }

    public function workerRecords(): HasMany
    {
        return $this->hasMany(WorkerRecord::class);
    }

    public function equipmentAssets(): HasMany
    {
        return $this->hasMany(EquipmentAsset::class);
    }

    public function udpmWeeklyReports(): HasMany
    {
        return $this->hasMany(UdpmWeeklyReport::class);
    }

    public function gateEntryExitLogs(): HasMany
    {
        return $this->hasMany(GateEntryExitLog::class);
    }

    public function siteHeadcountSnapshots(): HasMany
    {
        return $this->hasMany(SiteHeadcountSnapshot::class);
    }

    public function evacuationReports(): HasMany
    {
        return $this->hasMany(EvacuationReport::class);
    }

    public function hseIncidents(): HasMany
    {
        return $this->hasMany(HseIncident::class);
    }

    public function lsrViolationLogs(): HasMany
    {
        return $this->hasMany(LsrViolationLog::class);
    }

    public function vehicleViolationLogs(): HasMany
    {
        return $this->hasMany(VehicleViolationLog::class);
    }

    public function gasReadings(): HasMany
    {
        return $this->hasMany(GasReading::class);
    }

    public function sensorReadings(): HasMany
    {
        return $this->hasMany(SensorReading::class);
    }

    public function sensorAlarms(): HasMany
    {
        return $this->hasMany(SensorAlarm::class);
    }
}
