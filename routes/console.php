<?php

use App\Jobs\GenerateUdpmWeeklyReportJob;
use App\Jobs\StationaryTagWatchJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new GenerateUdpmWeeklyReportJob)->weeklyOn(0, '06:00');
Schedule::job(new StationaryTagWatchJob)->everyMinute();
