<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertAction extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'alert_id',
        'user_id',
        'action',
        'reason_code',
        'note',
    ];

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
