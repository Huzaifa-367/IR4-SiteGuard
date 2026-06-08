<?php

namespace App\Ai\Tools;

use App\Ai\Tools\Concerns\InteractsWithSiteData;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListSiteLocationsTool implements Tool
{
    use InteractsWithSiteData;

    public function description(): Stringable|string
    {
        return 'List physical locations/zones on this site and how many cameras cover each.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->encode($this->data->listLocations());
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
