<?php

namespace App\Services\Ingest;

use App\Models\Camera;
use App\Models\IngestApiToken;
use App\Models\User;
use Illuminate\Support\Str;

class IngestTokenService
{
    /**
     * @return array{token: IngestApiToken, plain_text: string}
     */
    public function issueForCamera(Camera $camera, ?User $issuer = null, ?string $name = null): array
    {
        $plain = config('siteguard.ingest_token_prefix').Str::random(48);
        $prefix = substr($plain, 0, 8);

        $token = IngestApiToken::query()->updateOrCreate(
            ['camera_id' => $camera->id],
            [
                'name' => $name,
                'token_hash' => hash('sha256', $plain),
                'token_prefix' => $prefix,
                'created_by_user_id' => $issuer?->id,
                'revoked_at' => null,
                'expires_at' => null,
            ],
        );

        return ['token' => $token, 'plain_text' => $plain];
    }

    public function findByBearer(string $bearer): ?IngestApiToken
    {
        $hash = hash('sha256', $bearer);

        return IngestApiToken::query()
            ->where('token_hash', $hash)
            ->whereNull('revoked_at')
            ->where(function ($query): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();
    }
}
