<?php

namespace App\Models;

use App\Models\Concerns\HasIngestApiToken;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GasGateway extends Model
{
    use HasIngestApiToken;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'edge_device_id',
        'name',
        'code',
        'vehicle_label',
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

    public function edgeDevice(): BelongsTo
    {
        return $this->belongsTo(EdgeDevice::class);
    }

    public function gasReadings(): HasMany
    {
        return $this->hasMany(GasReading::class);
    }
}
