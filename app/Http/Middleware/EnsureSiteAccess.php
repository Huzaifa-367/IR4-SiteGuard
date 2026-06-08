<?php

namespace App\Http\Middleware;

use App\Models\Site;
use App\Support\SelectedSiteManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSiteAccess
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $site = $request->route('site');

        if (! $site instanceof Site) {
            return $next($request);
        }

        $user = $request->user();

        if ($user === null || ! $user->canAccessSite($site->id)) {
            abort(403);
        }

        $request->session()->put(SelectedSiteManager::SESSION_KEY, $site->id);

        return $next($request);
    }
}
