<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerRecord extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'tag_epc',
        'employee_number',
        'full_name',
        'contractor',
        'role',
        'nationality',
        'is_active',
        'portable_device_approved',
        'portable_devices',
        'authorized_zone_ids',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'portable_device_approved' => 'boolean',
            'portable_devices' => 'array',
            'authorized_zone_ids' => 'array',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
