<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiMessage extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'ai_session_id',
        'role',
        'content',
        'proposed_actions',
        'chart_spec',
        'citations',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'proposed_actions' => 'array',
            'chart_spec' => 'array',
            'citations' => 'array',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AiSession::class, 'ai_session_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AiAuditLog::class);
    }
}
