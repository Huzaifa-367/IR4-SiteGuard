<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        Schema::create('sites', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable()->unique();
            $table->string('timezone');
            $table->text('address')->nullable();
            $table->string('status')->default('active');
            $table->decimal('map_center_lat', 10, 7)->nullable();
            $table->decimal('map_center_lng', 10, 7)->nullable();
            $table->json('settings')->nullable();
            $table->string('external_ref')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('site_locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('site_locations')->nullOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->decimal('map_pin_lat', 10, 7)->nullable();
            $table->decimal('map_pin_lng', 10, 7)->nullable();
            $table->json('settings')->nullable();
            $table->string('external_ref')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'code']);
        });

        Schema::create('detection_modules', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('site_detection_modules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('detection_module_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_enabled')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'detection_module_id']);
        });

        Schema::create('site_user', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'site_id']);
        });

        Schema::create('cameras', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('detection_module_id')->constrained();
            $table->foreignId('site_location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('location_label')->nullable();
            $table->string('viewing_angle')->nullable();
            $table->text('rtsp_url')->nullable();
            $table->string('reference_frame_path')->nullable();
            $table->json('settings')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('external_id')->nullable();
            $table->timestamp('last_ingest_at')->nullable();
            $table->string('health_status')->default('offline');
            $table->timestamps();

            $table->index(['site_id', 'detection_module_id']);
            $table->unique(['site_id', 'code']);
        });

        Schema::create('ingest_api_tokens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('camera_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('token_hash');
            $table->string('token_prefix', 16);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
        });

        Schema::create('zones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('camera_id')->constrained()->cascadeOnDelete();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->json('polygon');
            $table->string('zone_type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('detection_module_id')->constrained();
            $table->string('code');
            $table->string('name');
            $table->string('severity');
            $table->json('definition');
            $table->unsignedInteger('dwell_sec')->nullable();
            $table->unsignedInteger('cooldown_sec')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['site_id', 'code']);
        });

        Schema::create('zone_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rule_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['zone_id', 'rule_id']);
        });

        Schema::create('media_objects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('camera_id')->nullable()->constrained()->nullOnDelete();
            $table->string('storage_key');
            $table->string('media_type');
            $table->string('content_type');
            $table->timestamp('captured_at');
            $table->timestamps();
        });

        Schema::create('detection_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('camera_id')->constrained()->cascadeOnDelete();
            $table->foreignId('detection_module_id')->constrained();
            $table->uuid('ingest_event_id')->unique();
            $table->uuid('event_id')->unique();
            $table->timestamp('captured_at');
            $table->timestamp('received_at');
            $table->json('classes');
            $table->json('bbox');
            $table->string('track_id')->nullable();
            $table->json('zone_ids')->nullable();
            $table->string('model_name')->nullable();
            $table->string('model_version')->nullable();
            $table->json('extras')->nullable();
            $table->foreignId('snapshot_media_id')->constrained('media_objects');
            $table->foreignId('clip_media_id')->nullable()->constrained('media_objects')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('alerts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('camera_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('detection_module_id')->constrained();
            $table->foreignId('rule_id')->constrained();
            $table->string('severity');
            $table->string('status')->default('open');
            $table->string('title');
            $table->foreignId('first_detection_event_id')->constrained('detection_events');
            $table->foreignId('last_detection_event_id')->nullable()->constrained('detection_events')->nullOnDelete();
            $table->unsignedInteger('occurrence_count')->default(1);
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('alert_actions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('alert_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('reason_code')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_actions');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('detection_events');
        Schema::dropIfExists('media_objects');
        Schema::dropIfExists('zone_rules');
        Schema::dropIfExists('rules');
        Schema::dropIfExists('zones');
        Schema::dropIfExists('ingest_api_tokens');
        Schema::dropIfExists('cameras');
        Schema::dropIfExists('site_user');
        Schema::dropIfExists('site_detection_modules');
        Schema::dropIfExists('detection_modules');
        Schema::dropIfExists('site_locations');
        Schema::dropIfExists('sites');
        Schema::dropIfExists('settings');
    }
};
