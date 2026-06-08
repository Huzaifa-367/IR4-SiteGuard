<?php

namespace App\Models;

use App\Models\Concerns\HasIngestApiToken;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfidReader extends Model
{
    use HasIngestApiToken;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'rfid_zone_id',
        'edge_device_id',
        'name',
        'code',
        'mount_type',
        'ip_address',
        'last_ingest_at',
        'health_status',
        'settings',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'last_ingest_at' => 'datetime',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function rfidZone(): BelongsTo
    {
        return $this->belongsTo(RfidZone::class);
    }

    public function edgeDevice(): BelongsTo
    {
        return $this->belongsTo(EdgeDevice::class);
    }

    public function isGateReader(): bool
    {
        return $this->mount_type === 'gate';
    }
}
