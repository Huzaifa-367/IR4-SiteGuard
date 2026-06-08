<?php

namespace App\Support;

use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SelectedSiteManager
{
    public const string SESSION_KEY = 'selected_site_id';

    /**
     * @return Builder<Site>
     */
    public function accessibleSitesQuery(User $user): Builder
    {
        $query = Site::query()
            ->where('status', 'active')
            ->orderBy('name');

        if (! $user->can('sites.access_all') && ! $user->hasRole('super_admin')) {
            $query->whereIn('id', $user->sites()->pluck('sites.id'));
        }

        return $query;
    }

    /**
     * @return Collection<int, Site>
     */
    public function accessibleSites(User $user): Collection
    {
        return $this->accessibleSitesQuery($user)->get();
    }

    public function setSelectedSiteId(Request $request, int $siteId): void
    {
        $request->session()->put(self::SESSION_KEY, $siteId);
    }

    public function requireSelectedSite(Request $request): Site
    {
        $site = $this->resolveSelectedSite($request);

        if ($site === null) {
            throw new HttpResponseException(
                redirect()->route('sites.index'),
            );
        }

        return $site;
    }

    public function resolveSelectedSite(Request $request): ?Site
    {
        $user = $request->user();

        if ($user === null) {
            return null;
        }

        $sites = $this->accessibleSites($user);

        if ($sites->isEmpty()) {
            return null;
        }

        $sessionId = $request->session()->get(self::SESSION_KEY);

        if ($sessionId !== null) {
            $matched = $sites->firstWhere('id', (int) $sessionId);

            if ($matched instanceof Site) {
                return $matched;
            }
        }

        $primarySite = $user->sites()
            ->wherePivot('is_primary', true)
            ->whereIn('sites.id', $sites->pluck('id'))
            ->first();

        if ($primarySite instanceof Site) {
            $this->setSelectedSiteId($request, $primarySite->id);

            return $primarySite;
        }

        $firstSite = $sites->first();

        if ($firstSite instanceof Site) {
            $this->setSelectedSiteId($request, $firstSite->id);
        }

        return $firstSite;
    }

    /**
     * Site IDs used to scope list dashboards and alerts.
     *
     * @return array<int, int>
     */
    public function siteIdsForScope(Request $request): array
    {
        $selectedSite = $this->resolveSelectedSite($request);

        if ($selectedSite === null) {
            return [];
        }

        return [$selectedSite->id];
    }

    /**
     * @return array{selectedSite: array{id: int, name: string, code: string|null}|null, sites: array<int, array{id: int, name: string, code: string|null}>}
     */
    public function sharedContext(Request $request): array
    {
        $user = $request->user();

        if ($user === null) {
            return [
                'selectedSite' => null,
                'sites' => [],
            ];
        }

        $sites = $this->accessibleSites($user);
        $selectedSite = $this->resolveSelectedSite($request);

        return [
            'selectedSite' => $selectedSite ? [
                'id' => $selectedSite->id,
                'name' => $selectedSite->name,
                'code' => $selectedSite->code,
            ] : null,
            'sites' => $sites->map(fn (Site $site): array => [
                'id' => $site->id,
                'name' => $site->name,
                'code' => $site->code,
            ])->values()->all(),
        ];
    }
}
