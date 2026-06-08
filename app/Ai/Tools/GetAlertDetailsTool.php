<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetAlertDetailsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'Get full details for a single alert on this site, including camera, rule, module, and action history (acknowledge/dismiss notes).';
    }

    public function handle(Request $request): Stringable|string
    {
        $alertId = (int) $request->integer('alert_id');
        $details = $this->data->alertDetails($alertId);

        if ($details === null) {
            return $this->encode([
                'error' => 'Alert not found on this site.',
                'alert_id' => $alertId,
            ]);
        }

        return $this->encode($details);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'alert_id' => $schema->integer()->description('The alert ID from search results.')->required(),
        ];
    }
}
