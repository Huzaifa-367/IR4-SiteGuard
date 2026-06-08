<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SensorReading extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'sensor_device_id',
        'gas_gateway_id',
        'parameter',
        'value',
        'unit',
        'quality',
        'assurance_tier',
        'read_at',
        'event_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'value' => 'decimal:4',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function sensorDevice(): BelongsTo
    {
        return $this->belongsTo(SensorDevice::class);
    }
}
