<?php

namespace App\Http\Controllers;

use App\Support\SelectedSiteManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SiteContextController extends Controller
{
    public function update(Request $request, SelectedSiteManager $selectedSiteManager): RedirectResponse
    {
        $validated = $request->validate([
            'site_id' => ['required', 'integer', 'exists:sites,id'],
        ]);

        $user = $request->user();

        abort_unless($user !== null && $user->canAccessSite((int) $validated['site_id']), 403);

        $selectedSiteManager->setSelectedSiteId($request, (int) $validated['site_id']);

        return back();
    }
}
