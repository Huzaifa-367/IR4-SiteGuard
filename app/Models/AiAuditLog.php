<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAuditLog extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'ai_message_id',
        'tool_name',
        'tool_input',
        'tool_output',
        'llm_model',
        'latency_ms',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tool_input' => 'array',
            'tool_output' => 'array',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(AiMessage::class, 'ai_message_id');
    }
}
