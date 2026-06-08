<?php

namespace Database\Seeders\Support;

use Illuminate\Support\Facades\DB;

class IotBulkInserter
{
    private string $timestamp;

    public function __construct()
    {
        $this->timestamp = now()->toDateTimeString();
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public function insert(string $table, array $rows, int $chunkSize = 400): void
    {
        if ($rows === []) {
            return;
        }

        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            $this->insertChunk($table, $chunk, $chunkSize);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public function insertChunk(string $table, array $rows, int $chunkSize = 400): void
    {
        if ($rows === []) {
            return;
        }

        foreach ($rows as &$row) {
            $row['created_at'] ??= $this->timestamp;
            $row['updated_at'] ??= $this->timestamp;
        }
        unset($row);

        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            DB::table($table)->insert($chunk);
        }
    }
}
