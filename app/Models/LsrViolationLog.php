<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LsrViolationLog extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'lsr_category',
        'detection_mode',
        'occurred_at',
        'alert_id',
        'worker_record_ids',
        'rfid_zone_id',
        'camera_id',
        'description',
        'actions_taken',
        'logged_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'worker_record_ids' => 'array',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function rfidZone(): BelongsTo
    {
        return $this->belongsTo(RfidZone::class);
    }

    public function loggedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by_user_id');
    }
}
