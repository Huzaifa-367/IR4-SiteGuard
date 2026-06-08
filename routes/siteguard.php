<?php

use App\Http\Controllers\AiSessionController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\CameraController;
use App\Http\Controllers\CameraZoneController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvestigationController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SiteContextController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\SiteModuleController;
use App\Http\Controllers\SiteRuleController;
use App\Http\Controllers\UserManagementController;
use App\Models\Site;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('site-context', [SiteContextController::class, 'update'])
        ->name('site-context.update');

    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('sites', [SiteController::class, 'index'])->name('sites.index');
    Route::get('sites/create', [SiteController::class, 'create'])->name('sites.create');
    Route::post('sites', [SiteController::class, 'store'])->name('sites.store');
    Route::get('sites/{site}', [SiteController::class, 'show'])
        ->middleware('site.access')
        ->name('sites.show');
    Route::get('sites/{site}/edit', [SiteController::class, 'edit'])
        ->middleware('site.access')
        ->name('sites.edit');
    Route::patch('sites/{site}', [SiteController::class, 'update'])
        ->middleware('site.access')
        ->name('sites.update');

    Route::middleware('selected.site')->group(function () {
        Route::get('modules', [SiteModuleController::class, 'index'])->name('modules.index');
        Route::patch('modules/{module}', [SiteModuleController::class, 'update'])->name('modules.update');

        Route::get('rules', [SiteRuleController::class, 'index'])->name('rules.index');
        Route::post('rules', [SiteRuleController::class, 'store'])->name('rules.store');
        Route::patch('rules/{rule}', [SiteRuleController::class, 'update'])->name('rules.update');
        Route::delete('rules/{rule}', [SiteRuleController::class, 'destroy'])->name('rules.destroy');

        Route::get('investigations', [InvestigationController::class, 'index'])->name('investigations.index');
        Route::post('investigations', [InvestigationController::class, 'store'])->name('investigations.store');
        Route::get('investigations/{investigation}', [InvestigationController::class, 'show'])->name('investigations.show');
        Route::post('investigations/{investigation}/close', [InvestigationController::class, 'close'])
            ->name('investigations.close');

        Route::get('ai', [AiSessionController::class, 'index'])->name('ai.index');
        Route::post('ai/sessions', [AiSessionController::class, 'store'])->name('ai.sessions.store');
        Route::get('ai/sessions/{session}', [AiSessionController::class, 'show'])->name('ai.sessions.show');
        Route::post('ai/sessions/{session}/messages/stream', [AiSessionController::class, 'messageStream'])
            ->name('ai.messages.stream');
    });

    Route::get('sites/{site}/modules', fn (Site $site) => redirect()->route('modules.index'))
        ->middleware('site.access');
    Route::get('sites/{site}/rules', fn (Site $site) => redirect()->route('rules.index'))
        ->middleware('site.access');
    Route::get('sites/{site}/investigations', fn (Site $site) => redirect()->route('investigations.index'))
        ->middleware('site.access');
    Route::get('sites/{site}/investigations/{investigation}', fn (Site $site, $investigation) => redirect()->route('investigations.show', $investigation))
        ->middleware('site.access');
    Route::get('sites/{site}/ai', fn (Site $site) => redirect()->route('ai.index'))
        ->middleware('site.access');

    Route::post('sites/{site}/cameras', [CameraController::class, 'store'])
        ->middleware('site.access')
        ->name('sites.cameras.store');

    Route::get('cameras/{camera}/zones', [CameraZoneController::class, 'index'])
        ->name('cameras.zones.index');
    Route::post('cameras/{camera}/zones', [CameraZoneController::class, 'store'])
        ->name('cameras.zones.store');
    Route::delete('cameras/{camera}/zones/{zone}', [CameraZoneController::class, 'destroy'])
        ->name('cameras.zones.destroy');

    Route::patch('cameras/{camera}', [CameraController::class, 'update'])->name('cameras.update');
    Route::delete('cameras/{camera}', [CameraController::class, 'destroy'])->name('cameras.destroy');
    Route::post('cameras/{camera}/ingest-token', [CameraController::class, 'issueIngestToken'])
        ->name('cameras.ingest-token.store');
    Route::delete('cameras/{camera}/ingest-token', [CameraController::class, 'revokeIngestToken'])
        ->name('cameras.ingest-token.destroy');

    Route::get('alerts', [AlertController::class, 'index'])->name('alerts.index');
    Route::get('alerts/{alert}', [AlertController::class, 'show'])->name('alerts.show');
    Route::post('alerts/{alert}/acknowledge', [AlertController::class, 'acknowledge'])
        ->name('alerts.acknowledge');
    Route::post('alerts/{alert}/dismiss', [AlertController::class, 'dismiss'])
        ->name('alerts.dismiss');
    Route::post('alerts/{alert}/investigations', [AlertController::class, 'createInvestigation'])
        ->name('alerts.investigations.store');
    Route::post('alerts/{alert}/link-investigation', [AlertController::class, 'linkInvestigation'])
        ->name('alerts.investigations.link');

    Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
    Route::post('users', [UserManagementController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserManagementController::class, 'update'])->name('users.update');

    Route::get('settings/platform', [SettingsController::class, 'index'])->name('settings.platform.index');
    Route::patch('settings/platform', [SettingsController::class, 'update'])->name('settings.platform.update');

    Route::get('reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::get('reports/alerts/export', [ReportsController::class, 'exportAlerts'])
        ->name('reports.alerts.export');
});
