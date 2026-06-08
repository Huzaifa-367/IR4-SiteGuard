<?php

namespace Tests\Unit\Iot;

use App\Support\Iot\IotTimeRange;
use Illuminate\Http\Request;
use Tests\TestCase;

class IotTimeRangeTest extends TestCase
{
    public function test_chart_days_defaults_to_ninety(): void
    {
        $request = Request::create('/iot/rfid', 'GET');

        $this->assertSame(90, IotTimeRange::chartDaysFromRequest($request));
        $this->assertSame(90, IotTimeRange::effectiveChartDays(IotTimeRange::chartDaysFromRequest($request)));
    }

    public function test_all_history_maps_to_configured_max_chart_days(): void
    {
        $request = Request::create('/iot/rfid', 'GET', ['days' => 0]);

        $this->assertSame(0, IotTimeRange::chartDaysFromRequest($request));
        $this->assertSame(548, IotTimeRange::effectiveChartDays(IotTimeRange::chartDaysFromRequest($request)));
    }

    public function test_list_days_zero_means_no_since_filter(): void
    {
        $this->assertNull(IotTimeRange::since(0));
    }

    public function test_invalid_days_falls_back_to_default(): void
    {
        $request = Request::create('/iot/rfid/gate-log', 'GET', ['days' => 999]);

        $this->assertSame(90, IotTimeRange::listDaysFromRequest($request));
    }

    public function test_list_and_chart_days_share_options(): void
    {
        $request = Request::create('/iot/rfid/gate-log', 'GET', ['days' => 7]);

        $this->assertSame(7, IotTimeRange::listDaysFromRequest($request));
        $this->assertSame(7, IotTimeRange::chartDaysFromRequest($request));
        $this->assertSame(IotTimeRange::chartOptions(), IotTimeRange::listOptions());
    }

    public function test_hourly_trend_hours_scale_with_short_ranges(): void
    {
        $this->assertSame(24, IotTimeRange::hourlyTrendHours(0));
        $this->assertSame(24, IotTimeRange::hourlyTrendHours(1));
        $this->assertSame(48, IotTimeRange::hourlyTrendHours(2));
        $this->assertSame(24, IotTimeRange::hourlyTrendHours(90));
    }
}
