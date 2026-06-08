<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class IngestMediaRequest extends FormRequest
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
            'edge_device_id' => ['required', 'integer', 'exists:edge_devices,id'],
            'event_id' => ['required', 'uuid'],
            'captured_at' => ['required', 'date'],
            'camera_id' => ['nullable', 'integer', 'exists:cameras,id'],
            'alert_id' => ['nullable', 'integer', 'exists:alerts,id'],
            'incident_id' => ['nullable', 'integer', 'exists:hse_incidents,id'],
            'file' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime,video/x-msvideo,application/octet-stream', 'max:51200'],
        ];
    }
}
