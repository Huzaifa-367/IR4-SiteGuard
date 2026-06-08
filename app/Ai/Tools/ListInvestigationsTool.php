<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListInvestigationsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List investigations (incident reviews) for this site with status, assignee, and linked alert counts.';
    }

    public function handle(Request $request): Stringable|string
    {
        $status = $request->string('status')->toString();

        return $this->encode($this->data->listInvestigations(
            status: $status !== '' ? $status : null,
            limit: max(1, $request->integer('limit') ?: 20),
        ));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('Status filter, or empty string for all.')->required(),
            'limit' => $schema->integer()->description('Maximum rows (default 20).')->required(),
        ];
    }
}
