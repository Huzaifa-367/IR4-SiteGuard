<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('edge_devices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('mount_type')->default('vehicle');
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->string('health_status')->default('offline');
            $table->string('software_version')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'code']);
        });

        Schema::create('rfid_zones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('zone_type')->default('general');
            $table->unsignedInteger('max_occupancy')->nullable();
            $table->json('authorized_worker_ids')->nullable();
            $table->decimal('map_pin_lat', 10, 7)->nullable();
            $table->decimal('map_pin_lng', 10, 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['site_id', 'code']);
        });

        Schema::create('rfid_readers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfid_zone_id')->constrained()->cascadeOnDelete();
            $table->foreignId('edge_device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('mount_type');
            $table->string('ip_address')->nullable();
            $table->timestamp('last_ingest_at')->nullable();
            $table->string('health_status')->default('offline');
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'code']);
        });

        Schema::create('gas_gateways', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('edge_device_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('vehicle_label')->nullable();
            $table->timestamp('last_ingest_at')->nullable();
            $table->string('health_status')->default('offline');
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'code']);
        });

        Schema::create('sensor_devices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('edge_device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('device_type');
            $table->string('name');
            $table->string('code');
            $table->json('modbus_config')->nullable();
            $table->timestamp('last_ingest_at')->nullable();
            $table->string('health_status')->default('offline');
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_devices');
        Schema::dropIfExists('gas_gateways');
        Schema::dropIfExists('rfid_readers');
        Schema::dropIfExists('rfid_zones');
        Schema::dropIfExists('edge_devices');
    }
};
