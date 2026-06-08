<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentInspection extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'equipment_asset_id',
        'inspected_at',
        'inspector_name',
        'outcome',
        'notes',
        'next_inspection_due',
        'created_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'inspected_at' => 'date',
            'next_inspection_due' => 'date',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(EquipmentAsset::class, 'equipment_asset_id');
    }
}
