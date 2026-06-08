<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GasReading extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'gas_gateway_id',
        'lel_pct',
        'o2_pct',
        'h2s_ppm',
        'co_ppm',
        'alarm_state',
        'alarm_gases',
        'poll_type',
        'detector_serial',
        'read_at',
        'event_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'alarm_gases' => 'array',
            'read_at' => 'datetime',
            'lel_pct' => 'decimal:4',
            'o2_pct' => 'decimal:4',
            'h2s_ppm' => 'decimal:4',
            'co_ppm' => 'decimal:4',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function gasGateway(): BelongsTo
    {
        return $this->belongsTo(GasGateway::class);
    }
}
