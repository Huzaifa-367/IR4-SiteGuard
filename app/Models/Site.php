<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'timezone',
        'address',
        'status',
        'map_center_lat',
        'map_center_lng',
        'settings',
        'external_ref',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'map_center_lat' => 'decimal:7',
            'map_center_lng' => 'decimal:7',
        ];
    }

    public function locations(): HasMany
    {
        return $this->hasMany(SiteLocation::class);
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'site_user')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function detectionModules(): BelongsToMany
    {
        return $this->belongsToMany(DetectionModule::class, 'site_detection_modules')
            ->withPivot(['is_enabled', 'settings'])
            ->withTimestamps();
    }

    public function rules(): HasMany
    {
        return $this->hasMany(Rule::class);
    }

    public function investigations(): HasMany
    {
        return $this->hasMany(Investigation::class);
    }

    public function notificationChannels(): HasMany
    {
        return $this->hasMany(NotificationChannel::class);
    }

    public function aiSessions(): HasMany
    {
        return $this->hasMany(AiSession::class);
    }
}
