<?php

namespace App\Models;

use App\Models\Concerns\HasIngestApiToken;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Camera extends Model
{
    use HasIngestApiToken;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'detection_module_id',
        'site_location_id',
        'name',
        'code',
        'location_label',
        'viewing_angle',
        'rtsp_url',
        'reference_frame_path',
        'settings',
        'sort_order',
        'is_active',
        'external_id',
        'last_ingest_at',
        'health_status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'boolean',
            'last_ingest_at' => 'datetime',
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

    public function location(): BelongsTo
    {
        return $this->belongsTo(SiteLocation::class, 'site_location_id');
    }

    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }

    public function detectionEvents(): HasMany
    {
        return $this->hasMany(DetectionEvent::class);
    }
}
