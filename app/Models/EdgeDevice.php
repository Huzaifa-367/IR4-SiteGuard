<?php

namespace App\Models;

use App\Models\Concerns\HasIngestApiToken;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EdgeDevice extends Model
{
    use HasIngestApiToken;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'name',
        'code',
        'mount_type',
        'last_heartbeat_at',
        'health_status',
        'software_version',
        'settings',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'last_heartbeat_at' => 'datetime',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
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
}
