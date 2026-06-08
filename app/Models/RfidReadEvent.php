<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfidReadEvent extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'rfid_reader_id',
        'rfid_zone_id',
        'tag_epc',
        'worker_record_id',
        'rssi',
        'read_at',
        'batch_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function reader(): BelongsTo
    {
        return $this->belongsTo(RfidReader::class, 'rfid_reader_id');
    }

    public function rfidZone(): BelongsTo
    {
        return $this->belongsTo(RfidZone::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(WorkerRecord::class, 'worker_record_id');
    }
}
