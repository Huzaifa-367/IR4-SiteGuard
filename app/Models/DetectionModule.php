<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DetectionModule extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'name',
        'description',
    ];

    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'site_detection_modules')
            ->withPivot(['is_enabled', 'settings'])
            ->withTimestamps();
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class);
    }
}
