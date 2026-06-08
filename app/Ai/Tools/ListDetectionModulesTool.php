<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListDetectionModulesTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List AI detection modules enabled on this site (e.g. PPE, proximity, vehicle).';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->encode($this->data->listDetectionModules());
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
