<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rule extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'detection_module_id',
        'code',
        'name',
        'severity',
        'definition',
        'dwell_sec',
        'cooldown_sec',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'definition' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function detectionModule(): BelongsTo
    {
        return $this->belongsTo(DetectionModule::class);
    }

    public function zones(): BelongsToMany
    {
        return $this->belongsToMany(Zone::class, 'zone_rules');
    }
}
