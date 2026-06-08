<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListDeploymentApprovalsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List IoT deployment approval requests (hardware rollouts, configuration changes) with type, status, and submission dates.';
    }

    public function handle(Request $request): Stringable|string
    {
        $status = $request->string('status')->toString();

        return $this->encode($this->iot->deploymentApprovals(
            status: $status !== '' ? $status : null,
            limit: max(1, $request->integer('limit') ?: 20),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('pending, approved, rejected — or empty for all.')->required(),
            'limit' => $schema->integer()->description('Max rows (default 20).')->required(),
        ];
    }
}
