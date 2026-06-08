<?php

namespace App\Jobs;

use App\Models\Site;
use App\Services\Reports\UdpmWeeklyReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateUdpmWeeklyReportJob implements ShouldQueue
{
    use Queueable;

    public function handle(UdpmWeeklyReportService $reports): void
    {
        Site::query()
            ->where('status', 'active')
            ->orderBy('id')
            ->each(fn (Site $site) => $reports->generate($site));
    }
}
