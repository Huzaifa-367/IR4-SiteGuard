<?php

namespace App\Http\Controllers;

use App\Support\DashboardAnalytics;
use App\Support\SelectedSiteManager;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly DashboardAnalytics $dashboardAnalytics,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('permission:alerts.view'),
        ];
    }

    public function __invoke(Request $request, SelectedSiteManager $selectedSiteManager): Response
    {
        return Inertia::render('dashboard', $this->dashboardAnalytics->build($request, $selectedSiteManager));
    }
}
