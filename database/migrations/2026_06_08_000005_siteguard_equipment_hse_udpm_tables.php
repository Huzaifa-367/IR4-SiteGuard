<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_assets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('equipment_id');
            $table->string('name');
            $table->string('equipment_type');
            $table->string('status')->default('active');
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->string('qr_slug')->unique();
            $table->string('location_note')->nullable();
            $table->timestamp('registered_at');
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'equipment_id']);
        });

        Schema::create('equipment_inspections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('equipment_asset_id')->constrained()->cascadeOnDelete();
            $table->date('inspected_at');
            $table->string('inspector_name');
            $table->string('outcome');
            $table->text('notes')->nullable();
            $table->date('next_inspection_due')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('equipment_maintenance_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('equipment_asset_id')->constrained()->cascadeOnDelete();
            $table->date('performed_at');
            $table->string('maintenance_type');
            $table->text('description');
            $table->string('performed_by')->nullable();
            $table->date('next_service_due')->nullable();
            $table->timestamps();
        });

        Schema::create('equipment_qr_scans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('equipment_asset_id')->constrained()->cascadeOnDelete();
            $table->timestamp('scanned_at');
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('evacuation_reports', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('generated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generated_at');
            $table->json('snapshot');
            $table->json('muster_status')->nullable();
            $table->timestamps();
        });

        Schema::create('hse_incidents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('incident_number');
            $table->string('status');
            $table->string('severity')->nullable();
            $table->string('incident_type')->nullable();
            $table->timestamp('occurred_at');
            $table->foreignId('rfid_zone_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('camera_id')->nullable()->constrained()->nullOnDelete();
            $table->json('alert_ids')->nullable();
            $table->json('workers_involved')->nullable();
            $table->json('classification')->nullable();
            $table->json('video_evidence_media_ids')->nullable();
            $table->foreignId('classified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('classified_at')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'incident_number']);
        });

        Schema::create('lsr_violation_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('lsr_category');
            $table->string('detection_mode');
            $table->timestamp('occurred_at');
            $table->foreignId('alert_id')->nullable()->constrained()->nullOnDelete();
            $table->json('worker_record_ids')->nullable();
            $table->foreignId('rfid_zone_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('camera_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description');
            $table->text('actions_taken')->nullable();
            $table->foreignId('logged_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('vehicle_violation_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->timestamp('occurred_at');
            $table->string('vehicle_description');
            $table->foreignId('equipment_asset_id')->nullable()->constrained()->nullOnDelete();
            $table->string('violation_type');
            $table->text('description');
            $table->text('actions_taken');
            $table->foreignId('logged_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('camera_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('udpm_weekly_reports', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->date('week_start');
            $table->date('week_end');
            $table->string('status')->default('draft');
            $table->timestamp('generated_at')->nullable();
            $table->foreignId('generated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('pdf_storage_key')->nullable();
            $table->string('csv_storage_key')->nullable();
            $table->json('payload');
            $table->json('compliance_summary')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('udpm_weekly_reports');
        Schema::dropIfExists('vehicle_violation_logs');
        Schema::dropIfExists('lsr_violation_logs');
        Schema::dropIfExists('hse_incidents');
        Schema::dropIfExists('evacuation_reports');
        Schema::dropIfExists('equipment_qr_scans');
        Schema::dropIfExists('equipment_maintenance_records');
        Schema::dropIfExists('equipment_inspections');
        Schema::dropIfExists('equipment_assets');
    }
};
