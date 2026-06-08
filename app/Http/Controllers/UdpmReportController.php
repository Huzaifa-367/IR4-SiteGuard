<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Models\UdpmWeeklyReport;
use App\Services\Reports\UdpmWeeklyReportService;
use App\Support\IotAnalytics;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UdpmReportController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:udpm.view', only: ['index', 'show']),
            new Middleware('permission:udpm.generate', only: ['generate']),
            new Middleware('permission:udpm.approve', only: ['approve']),
            new Middleware('permission:udpm.export', only: ['export', 'exportHtml']),
        ];
    }

    public function index(Request $request, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('iot/udpm', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'reports' => UdpmWeeklyReport::query()
                ->where('site_id', $site->id)
                ->orderByDesc('week_start')
                ->limit(20)
                ->get()
                ->map(fn (UdpmWeeklyReport $report): array => [
                    'id' => $report->id,
                    'week_start' => $report->week_start->toDateString(),
                    'week_end' => $report->week_end->toDateString(),
                    'status' => $report->status,
                    'generated_at' => $report->generated_at?->toIso8601String(),
                ]),
            'permissions' => [
                'canGenerate' => $request->user()?->can('udpm.generate') ?? false,
            ],
            'analytics' => $iotAnalytics->udpmPageAnalytics($site->id),
        ]);
    }

    public function show(Request $request, UdpmWeeklyReport $report): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $report->site_id === (int) $site->id, 404);

        return Inertia::render('iot/udpm-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'report' => [
                'id' => $report->id,
                'week_start' => $report->week_start->toDateString(),
                'week_end' => $report->week_end->toDateString(),
                'status' => $report->status,
                'generated_at' => $report->generated_at?->toIso8601String(),
                'payload' => $report->payload,
                'compliance_summary' => $report->compliance_summary,
            ],
            'permissions' => [
                'canApprove' => $request->user()?->can('udpm.approve') ?? false,
                'canExport' => $request->user()?->can('udpm.export') ?? false,
            ],
        ]);
    }

    public function generate(Request $request, UdpmWeeklyReportService $service): RedirectResponse
    {
        $site = $this->selectedSite($request);

        $result = $service->generate($site, null, $request->user()?->id);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('UDPM report generated for week :week.', [
                'week' => $result['report']->week_start->toDateString(),
            ]),
        ]);

        return to_route('iot.udpm.show', $result['report']);
    }

    public function approve(Request $request, UdpmWeeklyReport $report): RedirectResponse
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $report->site_id === (int) $site->id, 404);

        $report->update([
            'status' => 'approved',
            'approved_by_user_id' => $request->user()?->id,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('UDPM report approved.'),
        ]);

        return to_route('iot.udpm.show', $report);
    }

    public function export(Request $request, UdpmWeeklyReport $report): StreamedResponse
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $report->site_id === (int) $site->id, 404);

        $filename = sprintf(
            'udpm-%s-%s.json',
            $site->code ?? $site->id,
            $report->week_start->format('Y-m-d'),
        );

        $storageKey = 'udpm/'.$filename;
        Storage::disk('local')->put($storageKey, json_encode($report->payload, JSON_PRETTY_PRINT));

        $report->update([
            'status' => 'exported',
            'csv_storage_key' => $storageKey,
        ]);

        return response()->streamDownload(
            fn () => print (string) json_encode($report->payload, JSON_PRETTY_PRINT),
            $filename,
            ['Content-Type' => 'application/json'],
        );
    }

    public function exportHtml(Request $request, UdpmWeeklyReport $report): StreamedResponse
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $report->site_id === (int) $site->id, 404);

        $payload = $report->payload ?? [];
        $siteMeta = $payload['site'] ?? [];

        $html = View::make('reports.udpm', [
            'siteName' => $siteMeta['name'] ?? $site->name,
            'siteCode' => $siteMeta['code'] ?? $site->code,
            'weekLabel' => $siteMeta['week_label'] ?? '',
            'weekStart' => $report->week_start->toDateString(),
            'weekEnd' => $report->week_end->toDateString(),
            'sections' => $payload['sections'] ?? [],
        ])->render();

        $filename = sprintf(
            'udpm-%s-%s.html',
            $site->code ?? $site->id,
            $report->week_start->format('Y-m-d'),
        );

        $storageKey = 'udpm/'.$filename;
        Storage::disk('local')->put($storageKey, $html);

        $report->update([
            'status' => 'exported',
            'pdf_storage_key' => $storageKey,
        ]);

        return response()->streamDownload(
            fn () => print $html,
            $filename,
            ['Content-Type' => 'text/html'],
        );
    }
}
