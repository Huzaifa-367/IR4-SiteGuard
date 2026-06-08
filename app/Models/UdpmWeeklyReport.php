<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UdpmWeeklyReport extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'week_start',
        'week_end',
        'status',
        'generated_at',
        'generated_by_user_id',
        'approved_by_user_id',
        'pdf_storage_key',
        'csv_storage_key',
        'payload',
        'compliance_summary',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'week_end' => 'date',
            'generated_at' => 'datetime',
            'payload' => 'array',
            'compliance_summary' => 'array',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
