<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HseIncident extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'incident_number',
        'status',
        'severity',
        'incident_type',
        'occurred_at',
        'rfid_zone_id',
        'camera_id',
        'alert_ids',
        'workers_involved',
        'classification',
        'video_evidence_media_ids',
        'classified_by_user_id',
        'classified_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'classified_at' => 'datetime',
            'alert_ids' => 'array',
            'workers_involved' => 'array',
            'classification' => 'array',
            'video_evidence_media_ids' => 'array',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function rfidZone(): BelongsTo
    {
        return $this->belongsTo(RfidZone::class);
    }

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function classifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'classified_by_user_id');
    }
}
