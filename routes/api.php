<?php

use App\Http\Controllers\Api\IngestCameraController;
use App\Http\Controllers\Api\IngestEdgeHeartbeatController;
use App\Http\Controllers\Api\IngestGasController;
use App\Http\Controllers\Api\IngestMediaController;
use App\Http\Controllers\Api\IngestRfidController;
use App\Http\Controllers\Api\IngestSensorController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:120,1')->group(function () {
    Route::post('ingest/camera', IngestCameraController::class)
        ->name('api.ingest.camera');

    Route::post('ingest/rfid', IngestRfidController::class)
        ->name('api.ingest.rfid');

    Route::post('ingest/sensor', IngestSensorController::class)
        ->name('api.ingest.sensor');

    Route::post('ingest/gas', IngestGasController::class)
        ->name('api.ingest.gas');

    Route::post('ingest/edge/heartbeat', IngestEdgeHeartbeatController::class)
        ->name('api.ingest.edge.heartbeat');

    Route::post('ingest/media', IngestMediaController::class)
        ->name('api.ingest.media');
});
