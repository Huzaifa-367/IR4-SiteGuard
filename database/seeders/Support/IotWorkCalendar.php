<?php

namespace Database\Seeders\Support;

use Carbon\CarbonInterface;

/**
 * Site work calendar — Saudi Fri/Sat weekends, occasional shutdowns, seasonal headcount.
 */
class IotWorkCalendar
{
    /**
     * @var list<CarbonInterface>|null
     */
    private ?array $workingDaysCache = null;

    public function __construct(
        private int $historyDays,
        private int $siteSeed,
        private float $scale,
    ) {}

    public function historyDays(): int
    {
        return $this->historyDays;
    }

    public function periodStart(): CarbonInterface
    {
        return now()->subDays($this->historyDays)->startOfDay();
    }

    public function periodEnd(): CarbonInterface
    {
        return now()->endOfDay();
    }

    public function isWorkingDay(CarbonInterface $day): bool
    {
        if ($day->isFriday() || $day->isSaturday()) {
            return false;
        }

        if ($this->deterministicChance($day->toDateString().'-shutdown', 0.018)) {
            return false;
        }

        if ($this->scale < 0.85 && $day->isThursday() && $this->deterministicChance($day->toDateString().'-half', 0.12)) {
            return false;
        }

        return true;
    }

    /**
     * @return list<CarbonInterface>
     */
    public function workingDays(): array
    {
        if ($this->workingDaysCache !== null) {
            return $this->workingDaysCache;
        }

        $days = [];
        $cursor = $this->periodStart()->copy();
        $end = $this->periodEnd();

        while ($cursor->lte($end)) {
            if ($this->isWorkingDay($cursor)) {
                $days[] = $cursor->copy();
            }
            $cursor = $cursor->copy()->addDay();
        }

        return $this->workingDaysCache = $days;
    }

    public function headcountFactor(CarbonInterface $day): float
    {
        $month = (int) $day->format('n');
        $seasonal = match (true) {
            in_array($month, [6, 7, 8], true) => 0.88,
            in_array($month, [12, 1, 2], true) => 0.94,
            default => 1.0,
        };

        return max(0.45, $seasonal * $this->scale);
    }

    public function gateEventsTarget(CarbonInterface $day): int
    {
        $config = config('siteguard.iot_demo_seed.gate_events_per_work_day', [50, 100]);
        $min = (int) ($config[0] ?? 50);
        $max = (int) ($config[1] ?? 100);
        $base = $this->seededInt($day->toDateString().'-gate', $min, $max);

        return max(10, (int) round($base * $this->headcountFactor($day)));
    }

    public function rfidReadsPerReader(CarbonInterface $day): int
    {
        $config = config('siteguard.iot_demo_seed.rfid_reads_per_reader_per_work_day', [35, 65]);
        $min = (int) ($config[0] ?? 35);
        $max = (int) ($config[1] ?? 65);
        $base = $this->seededInt($day->toDateString().'-rfid-reader', $min, $max);

        return max(12, (int) round($base * $this->headcountFactor($day)));
    }

    public function gasPollIntervalMinutes(): int
    {
        return max(5, (int) config('siteguard.iot_demo_seed.gas_poll_interval_minutes', 15));
    }

    public function gasPollsPerGateway(CarbonInterface $day): int
    {
        $config = config('siteguard.iot_demo_seed.gas_polls_per_gateway_per_day', [16, 22]);
        $min = (int) ($config[0] ?? 16);
        $max = (int) ($config[1] ?? 22);
        $base = $this->seededInt($day->toDateString().'-gas', $min, $max);

        return max(8, (int) round($base * $this->headcountFactor($day) / max(0.5, $this->scale)));
    }

    public function workTimestamp(CarbonInterface $day, string $salt, int $startHour = 6, int $endHour = 17): CarbonInterface
    {
        $minutesSpan = max(1, ($endHour - $startHour) * 60);
        $offset = $this->seededInt($day->toDateString().$salt, 0, $minutesSpan);

        return $day->copy()->setTime($startHour, 0)->addMinutes($offset);
    }

    public function deterministicChance(string $key, float $probability): bool
    {
        $hash = crc32($this->siteSeed.$key);

        return ($hash % 10_000) < (int) round($probability * 10_000);
    }

    public function seededInt(string $key, int $min, int $max): int
    {
        if ($max <= $min) {
            return $min;
        }

        $hash = crc32($this->siteSeed.$key);

        return $min + ($hash % ($max - $min + 1));
    }

    /**
     * @return list<CarbonInterface>
     */
    public function pickWorkdaysInMonth(CarbonInterface $month, int $count): array
    {
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();
        $candidates = [];

        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            if ($this->isWorkingDay($cursor) && $cursor->lte($this->periodEnd())) {
                $candidates[] = $cursor->copy();
            }
            $cursor = $cursor->copy()->addDay();
        }

        if ($candidates === []) {
            return [];
        }

        usort($candidates, fn (CarbonInterface $a, CarbonInterface $b): int => crc32($a->toDateString()) <=> crc32($b->toDateString()));
        $count = min($count, count($candidates));

        return array_slice($candidates, 0, $count);
    }
}
