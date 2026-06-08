<?php

namespace App\Support;

use App\Models\MediaObject;
use Illuminate\Support\Facades\Storage;

class MediaObjectUrl
{
    public static function resolve(?MediaObject $media): ?string
    {
        if ($media === null || $media->storage_key === '') {
            return null;
        }

        if (str_starts_with($media->storage_key, 'alert-snapshots/')) {
            return asset($media->storage_key);
        }

        if (Storage::disk('public')->exists($media->storage_key)) {
            return Storage::disk('public')->url($media->storage_key);
        }

        return null;
    }
}
