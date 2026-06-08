<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GateEntryExitLog extends Model
{
    protected $table = 'gate_entry_exit_log';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'tag_epc',
        'worker_record_id',
        'direction',
        'occurred_at',
        'gate_reader_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(WorkerRecord::class, 'worker_record_id');
    }

    public function gateReader(): BelongsTo
    {
        return $this->belongsTo(RfidReader::class, 'gate_reader_id');
    }
}
