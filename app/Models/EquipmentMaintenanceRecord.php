<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentMaintenanceRecord extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'equipment_asset_id',
        'performed_at',
        'maintenance_type',
        'description',
        'performed_by',
        'next_service_due',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'performed_at' => 'date',
            'next_service_due' => 'date',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(EquipmentAsset::class, 'equipment_asset_id');
    }
}
