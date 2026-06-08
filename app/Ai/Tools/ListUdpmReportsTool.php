<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListUdpmReportsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List UDPM weekly compliance reports with status, week range, and compliance summary.';
    }

    public function handle(Request $request): Stringable|string
    {
        $status = $request->string('status')->toString();

        return $this->encode($this->iot->udpmReports(
            status: $status !== '' ? $status : null,
            limit: max(1, $request->integer('limit') ?: 12),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('Report status filter, or empty string for all.')->required(),
            'limit' => $schema->integer()->description('Max rows (default 12).')->required(),
        ];
    }
}
