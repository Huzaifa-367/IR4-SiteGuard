<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class IngestCameraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'camera_id' => ['required', 'integer', 'exists:cameras,id'],
            'payload' => ['required', 'array'],
            'payload.event_id' => ['required', 'uuid'],
            'payload.captured_at' => ['required', 'date'],
            'payload.snapshot' => ['required', 'string'],
            'payload.detections' => ['required', 'array', 'min:1'],
            'payload.detections.*.classes' => ['required', 'array', 'min:1'],
            'payload.detections.*.classes.*.key' => ['required', 'string'],
            'payload.detections.*.classes.*.confidence' => ['required', 'numeric', 'between:0,1'],
            'payload.detections.*.bbox' => ['required', 'array'],
            'payload.detections.*.bbox.x' => ['required', 'numeric', 'between:0,1'],
            'payload.detections.*.bbox.y' => ['required', 'numeric', 'between:0,1'],
            'payload.detections.*.bbox.w' => ['required', 'numeric', 'between:0,1'],
            'payload.detections.*.bbox.h' => ['required', 'numeric', 'between:0,1'],
            'payload.detections.*.distance_m' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
