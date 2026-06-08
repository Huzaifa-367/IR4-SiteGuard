<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('tag_epc');
            $table->string('employee_number')->nullable();
            $table->string('full_name');
            $table->string('contractor');
            $table->string('role');
            $table->string('nationality')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('portable_device_approved')->default(false);
            $table->json('portable_devices')->nullable();
            $table->json('authorized_zone_ids')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'tag_epc']);
        });

        Schema::create('rfid_read_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfid_reader_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfid_zone_id')->constrained()->cascadeOnDelete();
            $table->string('tag_epc');
            $table->foreignId('worker_record_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('rssi')->nullable();
            $table->timestamp('read_at');
            $table->uuid('batch_id');
            $table->timestamps();

            $table->index(['site_id', 'tag_epc', 'read_at']);
        });

        Schema::create('rfid_tag_last_seen', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('tag_epc');
            $table->foreignId('worker_record_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('rfid_zone_id')->constrained();
            $table->foreignId('rfid_reader_id')->constrained();
            $table->timestamp('last_seen_at');
            $table->boolean('is_on_site')->default(false);
            $table->timestamp('stationary_since')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'tag_epc']);
        });

        Schema::create('gate_entry_exit_log', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('tag_epc');
            $table->foreignId('worker_record_id')->nullable()->constrained()->nullOnDelete();
            $table->string('direction');
            $table->timestamp('occurred_at');
            $table->foreignId('gate_reader_id')->constrained('rfid_readers')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['site_id', 'occurred_at']);
        });

        Schema::create('site_headcount_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->timestamp('recorded_at');
            $table->unsignedInteger('on_site_count');
            $table->json('by_zone')->nullable();
            $table->string('source')->default('gate');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_headcount_snapshots');
        Schema::dropIfExists('gate_entry_exit_log');
        Schema::dropIfExists('rfid_tag_last_seen');
        Schema::dropIfExists('rfid_read_events');
        Schema::dropIfExists('worker_records');
    }
};
