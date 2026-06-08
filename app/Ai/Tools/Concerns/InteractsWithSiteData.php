<?php

namespace App\Ai\Tools\Concerns;

use App\Models\Site;
use App\Support\SiteGuardAiDataService;
use App\Support\SiteGuardAiIotDataService;

trait InteractsWithSiteData
{
    protected Site $site;

    protected SiteGuardAiDataService $data;

    protected SiteGuardAiIotDataService $iot;

    public function __construct(Site $site)
    {
        $this->site = $site;
        $this->data = new SiteGuardAiDataService($site);
        $this->iot = new SiteGuardAiIotDataService($site);
    }

    public function name(): string
    {
        return str(class_basename(static::class))
            ->replaceLast('Tool', '')
            ->snake()
            ->toString();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function encode(array $payload): string
    {
        return json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }
}
