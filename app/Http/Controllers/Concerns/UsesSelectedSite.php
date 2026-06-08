<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Site;
use App\Support\SelectedSiteManager;
use Illuminate\Http\Request;

trait UsesSelectedSite
{
    protected function selectedSite(Request $request): Site
    {
        /** @var Site|null $site */
        $site = $request->attributes->get('selectedSite');

        if ($site !== null) {
            return $site;
        }

        return app(SelectedSiteManager::class)->requireSelectedSite($request);
    }
}
