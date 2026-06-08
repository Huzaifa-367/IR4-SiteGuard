<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfidTagLastSeen extends Model
{
    protected $table = 'rfid_tag_last_seen';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'tag_epc',
        'worker_record_id',
        'rfid_zone_id',
        'rfid_reader_id',
        'last_seen_at',
        'is_on_site',
        'stationary_since',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
            'stationary_since' => 'datetime',
            'is_on_site' => 'boolean',
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

    public function rfidZone(): BelongsTo
    {
        return $this->belongsTo(RfidZone::class);
    }

    public function reader(): BelongsTo
    {
        return $this->belongsTo(RfidReader::class, 'rfid_reader_id');
    }
}
