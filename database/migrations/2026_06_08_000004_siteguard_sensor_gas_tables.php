<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gas_readings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gas_gateway_id')->constrained()->cascadeOnDelete();
            $table->decimal('lel_pct', 8, 4);
            $table->decimal('o2_pct', 8, 4);
            $table->decimal('h2s_ppm', 10, 4);
            $table->decimal('co_ppm', 10, 4);
            $table->string('alarm_state');
            $table->json('alarm_gases');
            $table->string('poll_type');
            $table->string('detector_serial')->nullable();
            $table->timestamp('read_at');
            $table->uuid('event_id')->unique();
            $table->timestamps();

            $table->index(['gas_gateway_id', 'read_at']);
        });

        Schema::create('sensor_readings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sensor_device_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('gas_gateway_id')->nullable()->constrained()->nullOnDelete();
            $table->string('parameter');
            $table->decimal('value', 12, 4);
            $table->string('unit');
            $table->string('quality')->default('good');
            $table->string('assurance_tier')->default('instrumented');
            $table->timestamp('read_at');
            $table->uuid('event_id');
            $table->timestamps();

            $table->unique(['sensor_device_id', 'parameter', 'event_id']);
            $table->index(['site_id', 'parameter', 'read_at']);
        });

        Schema::create('sensor_alarms', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->string('parameter');
            $table->decimal('value', 12, 4);
            $table->decimal('threshold', 12, 4);
            $table->string('severity');
            $table->timestamp('alarm_at');
            $table->timestamp('cleared_at')->nullable();
            $table->foreignId('alert_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['site_id', 'alarm_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_alarms');
        Schema::dropIfExists('sensor_readings');
        Schema::dropIfExists('gas_readings');
    }
};
