<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteLocation extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'parent_id',
        'name',
        'code',
        'sort_order',
        'map_pin_lat',
        'map_pin_lng',
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
            'map_pin_lat' => 'decimal:7',
            'map_pin_lng' => 'decimal:7',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class);
    }
}
