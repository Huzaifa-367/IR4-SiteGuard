<?php

use App\Http\Controllers\Api\IngestCameraController;
use Illuminate\Support\Facades\Route;

Route::post('ingest/camera', IngestCameraController::class)
    ->name('api.ingest.camera');
