<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SensorAlarm extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'source_type',
        'source_id',
        'parameter',
        'value',
        'threshold',
        'severity',
        'alarm_at',
        'cleared_at',
        'alert_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'alarm_at' => 'datetime',
            'cleared_at' => 'datetime',
            'value' => 'decimal:4',
            'threshold' => 'decimal:4',
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
}
