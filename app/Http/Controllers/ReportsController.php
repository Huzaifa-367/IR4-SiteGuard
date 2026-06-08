<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Site;
use App\Support\AlertReportQuery;
use App\Support\ExcelXmlExporter;
use App\Support\SelectedSiteManager;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly AlertReportQuery $alertReportQuery,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('permission:reports.export'),
        ];
    }

    public function index(Request $request, SelectedSiteManager $selectedSiteManager): Response
    {
        $user = $request->user();
        $siteQuery = Site::query()->orderBy('name');

        if ($user !== null && ! $user->can('sites.access_all') && ! $user->hasRole('super_admin')) {
            $siteQuery->whereIn('id', $user->sites()->pluck('sites.id'));
        }

        $filters = $this->alertReportQuery->filtersFromRequest($request, $selectedSiteManager);
        $query = $this->alertReportQuery->forRequest($request, $selectedSiteManager);

        return Inertia::render('reports/index', [
            'sites' => $siteQuery->get(['id', 'name', 'code']),
            'filters' => $filters,
            'summary' => $this->alertReportQuery->summaryForRequest($request, $selectedSiteManager),
            'alerts' => $query
                ->paginate(20)
                ->withQueryString()
                ->through(fn (Alert $alert): array => [
                    'id' => $alert->id,
                    'title' => $alert->title,
                    'severity' => $alert->severity,
                    'status' => $alert->status,
                    'opened_at' => $alert->opened_at?->toIso8601String(),
                    'site' => $alert->site?->only(['id', 'name']),
                    'camera' => $alert->camera?->only(['id', 'name']),
                    'rule' => $alert->rule?->only(['id', 'name', 'code']),
                ]),
        ]);
    }

    public function exportAlerts(Request $request, SelectedSiteManager $selectedSiteManager): StreamedResponse
    {
        $query = $this->alertReportQuery->forRequest($request, $selectedSiteManager);
        $filename = 'siteguard-alerts-'.now()->format('Y-m-d-His').'.xls';

        return response()->streamDownload(function () use ($query): void {
            $headers = ['ID', 'Site', 'Camera', 'Rule', 'Title', 'Severity', 'Status', 'Opened at'];
            $rows = $query->orderBy('id')->lazy(200)->map(fn (Alert $alert): array => [
                $alert->id,
                $alert->site?->name,
                $alert->camera?->name,
                $alert->rule?->code,
                $alert->title,
                $alert->severity,
                $alert->status,
                $alert->opened_at?->toIso8601String(),
            ]);

            ExcelXmlExporter::stream('Alerts', $headers, $rows);
        }, $filename, [
            'Content-Type' => 'application/vnd.ms-excel',
        ]);
    }
}
