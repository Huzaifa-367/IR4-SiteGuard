<?php

namespace App\Support;

use App\Models\Alert;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AlertReportQuery
{
    /**
     * @return Builder<Alert>
     */
    public function forRequest(Request $request, SelectedSiteManager $selectedSiteManager): Builder
    {
        $query = Alert::query()
            ->with(['site:id,name', 'camera:id,name', 'rule:id,code,name']);

        $this->applySiteFilter($query, $request, $selectedSiteManager);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $query->latest('opened_at');
    }

    /**
     * @return array{total: int, open: int, critical_high: int, acknowledged: int}
     */
    public function summaryForRequest(Request $request, SelectedSiteManager $selectedSiteManager): array
    {
        $base = $this->forRequest($request, $selectedSiteManager);

        return [
            'total' => (clone $base)->count(),
            'open' => (clone $base)->where('status', 'open')->count(),
            'critical_high' => (clone $base)->whereIn('severity', ['critical', 'high'])->count(),
            'acknowledged' => (clone $base)->where('status', 'acknowledged')->count(),
        ];
    }

    /**
     * @return array{site_id: int|string|null, status: string}
     */
    public function filtersFromRequest(Request $request, SelectedSiteManager $selectedSiteManager): array
    {
        if ($request->has('site_id')) {
            $siteId = $request->input('site_id');

            return [
                'site_id' => $siteId === '' || $siteId === null ? '' : (int) $siteId,
                'status' => $request->string('status')->toString(),
            ];
        }

        $selectedSite = $selectedSiteManager->resolveSelectedSite($request);

        return [
            'site_id' => $selectedSite?->id ?? '',
            'status' => $request->string('status')->toString(),
        ];
    }

    /**
     * @param  Builder<Alert>  $query
     */
    private function applySiteFilter(
        Builder $query,
        Request $request,
        SelectedSiteManager $selectedSiteManager,
    ): void {
        $user = $request->user();

        if ($user === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        $siteId = $request->input('site_id');

        if ($siteId !== null && $siteId !== '') {
            abort_unless($user->canAccessSite((int) $siteId), 403);
            $query->where('site_id', (int) $siteId);

            return;
        }

        if (! $user->can('sites.access_all') && ! $user->hasRole('super_admin')) {
            $accessibleSiteIds = $user->sites()->pluck('sites.id');

            if ($accessibleSiteIds->isEmpty()) {
                $query->whereRaw('1 = 0');

                return;
            }

            $query->whereIn('site_id', $accessibleSiteIds);
        }
    }
}
