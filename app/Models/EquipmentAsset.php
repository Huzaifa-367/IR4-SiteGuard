<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EquipmentAsset extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'equipment_id',
        'name',
        'equipment_type',
        'status',
        'manufacturer',
        'model',
        'serial_number',
        'qr_slug',
        'location_note',
        'registered_at',
        'settings',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'registered_at' => 'datetime',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(EquipmentInspection::class);
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(EquipmentMaintenanceRecord::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EquipmentDocument::class);
    }
}
