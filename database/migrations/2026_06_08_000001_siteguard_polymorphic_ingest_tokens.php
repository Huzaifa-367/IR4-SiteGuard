<?php

use App\Models\Camera;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingest_api_tokens', function (Blueprint $table): void {
            $table->string('tokenable_type')->nullable()->after('id');
            $table->unsignedBigInteger('tokenable_id')->nullable()->after('tokenable_type');
        });

        foreach (DB::table('ingest_api_tokens')->orderBy('id')->get() as $row) {
            DB::table('ingest_api_tokens')
                ->where('id', $row->id)
                ->update([
                    'tokenable_type' => Camera::class,
                    'tokenable_id' => $row->camera_id,
                ]);
        }

        Schema::table('ingest_api_tokens', function (Blueprint $table): void {
            $table->dropForeign(['camera_id']);
            $table->dropUnique(['camera_id']);
            $table->dropColumn('camera_id');
            $table->unique(['tokenable_type', 'tokenable_id']);
        });

        Schema::table('detection_events', function (Blueprint $table): void {
            $table->string('assurance_tier')->default('inferred')->after('extras');
        });
    }

    public function down(): void
    {
        Schema::table('detection_events', function (Blueprint $table): void {
            $table->dropColumn('assurance_tier');
        });

        Schema::table('ingest_api_tokens', function (Blueprint $table): void {
            $table->foreignId('camera_id')->nullable()->after('id');
        });

        foreach (DB::table('ingest_api_tokens')->orderBy('id')->get() as $row) {
            if ($row->tokenable_type === Camera::class) {
                DB::table('ingest_api_tokens')
                    ->where('id', $row->id)
                    ->update(['camera_id' => $row->tokenable_id]);
            }
        }

        Schema::table('ingest_api_tokens', function (Blueprint $table): void {
            $table->dropUnique(['tokenable_type', 'tokenable_id']);
            $table->dropColumn(['tokenable_type', 'tokenable_id']);
            $table->foreign('camera_id')->references('id')->on('cameras')->cascadeOnDelete();
            $table->unique('camera_id');
        });
    }
};
