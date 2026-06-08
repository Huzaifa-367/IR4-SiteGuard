<?php

namespace App\Models;

use App\Support\MediaObjectUrl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaObject extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'site_id',
        'camera_id',
        'storage_key',
        'media_type',
        'content_type',
        'captured_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'captured_at' => 'datetime',
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

    public function url(): ?string
    {
        return MediaObjectUrl::resolve($this);
    }
}
