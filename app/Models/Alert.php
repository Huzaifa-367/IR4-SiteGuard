<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'camera_id',
        'detection_module_id',
        'rule_id',
        'severity',
        'status',
        'title',
        'first_detection_event_id',
        'last_detection_event_id',
        'occurrence_count',
        'opened_at',
        'closed_at',
        'assigned_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
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

    public function rule(): BelongsTo
    {
        return $this->belongsTo(Rule::class);
    }

    public function detectionModule(): BelongsTo
    {
        return $this->belongsTo(DetectionModule::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(AlertAction::class);
    }

    public function firstDetectionEvent(): BelongsTo
    {
        return $this->belongsTo(DetectionEvent::class, 'first_detection_event_id');
    }

    public function investigations(): BelongsToMany
    {
        return $this->belongsToMany(Investigation::class, 'investigation_alerts')
            ->withTimestamps();
    }
}
