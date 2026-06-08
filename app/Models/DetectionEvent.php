<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetectionEvent extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'camera_id',
        'detection_module_id',
        'ingest_event_id',
        'event_id',
        'captured_at',
        'received_at',
        'classes',
        'bbox',
        'track_id',
        'zone_ids',
        'model_name',
        'model_version',
        'extras',
        'assurance_tier',
        'snapshot_media_id',
        'clip_media_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'captured_at' => 'datetime',
            'received_at' => 'datetime',
            'classes' => 'array',
            'bbox' => 'array',
            'zone_ids' => 'array',
            'extras' => 'array',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function detectionModule(): BelongsTo
    {
        return $this->belongsTo(DetectionModule::class);
    }

    public function snapshot(): BelongsTo
    {
        return $this->belongsTo(MediaObject::class, 'snapshot_media_id');
    }
}
