<?php

namespace App\Models\Concerns;

use App\Models\IngestApiToken;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasIngestApiToken
{
    public function ingestToken(): MorphOne
    {
        return $this->morphOne(IngestApiToken::class, 'tokenable');
    }
}
