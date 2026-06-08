<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvacuationReport extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'generated_by_user_id',
        'generated_at',
        'snapshot',
        'muster_status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'generated_at' => 'datetime',
            'snapshot' => 'array',
            'muster_status' => 'array',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
