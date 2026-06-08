<?php

namespace App\Services\Ingest;

use App\Models\Camera;
use App\Models\EdgeDevice;
use App\Models\GasGateway;
use App\Models\IngestApiToken;
use App\Models\RfidReader;
use App\Models\SensorDevice;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class IngestTokenService
{
    /**
     * @return array{token: IngestApiToken, plain_text: string}
     */
    public function issueFor(Model $tokenable, ?User $issuer = null, ?string $name = null): array
    {
        $plain = $this->prefixFor($tokenable).Str::random(48);
        $prefix = substr($plain, 0, 8);

        $token = IngestApiToken::query()->updateOrCreate(
            [
                'tokenable_type' => $tokenable->getMorphClass(),
                'tokenable_id' => $tokenable->getKey(),
            ],
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

    /**
     * @return array{token: IngestApiToken, plain_text: string}
     */
    public function issueForCamera(Camera $camera, ?User $issuer = null, ?string $name = null): array
    {
        return $this->issueFor($camera, $issuer, $name);
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

    public function matchesTokenable(IngestApiToken $token, Model $expected): bool
    {
        return $token->tokenable_type === $expected->getMorphClass()
            && (int) $token->tokenable_id === (int) $expected->getKey();
    }

    private function prefixFor(Model $tokenable): string
    {
        $prefixes = config('siteguard.ingest_token_prefixes', []);

        return match ($tokenable::class) {
            Camera::class => $prefixes['camera'] ?? 'sgcam_',
            RfidReader::class => $prefixes['rfid_reader'] ?? 'sgrfid_',
            SensorDevice::class => $prefixes['sensor_device'] ?? 'sgsensor_',
            GasGateway::class => $prefixes['gas_gateway'] ?? 'sggas_',
            EdgeDevice::class => $prefixes['edge_device'] ?? 'sgedge_',
            default => 'sgingest_',
        };
    }
}
