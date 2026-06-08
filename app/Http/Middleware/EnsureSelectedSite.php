<?php

namespace App\Http\Middleware;

use App\Support\SelectedSiteManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSelectedSite
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $site = app(SelectedSiteManager::class)->requireSelectedSite($request);

        $request->attributes->set('selectedSite', $site);

        return $next($request);
    }
}
