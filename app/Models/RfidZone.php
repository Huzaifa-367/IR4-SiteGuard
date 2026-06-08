<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RfidZone extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'name',
        'code',
        'zone_type',
        'max_occupancy',
        'authorized_worker_ids',
        'map_pin_lat',
        'map_pin_lng',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'authorized_worker_ids' => 'array',
            'is_active' => 'boolean',
            'map_pin_lat' => 'decimal:7',
            'map_pin_lng' => 'decimal:7',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function readers(): HasMany
    {
        return $this->hasMany(RfidReader::class);
    }
}
