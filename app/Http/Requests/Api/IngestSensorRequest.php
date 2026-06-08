<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IngestSensorRequest extends FormRequest
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
            'sensor_device_id' => ['required', 'integer', 'exists:sensor_devices,id'],
            'payload' => ['required', 'array'],
            'payload.event_id' => ['required', 'uuid'],
            'payload.read_at' => ['required', 'date'],
            'payload.readings' => ['required', 'array', 'min:1'],
            'payload.readings.*.parameter' => ['required', 'string'],
            'payload.readings.*.value' => ['required', 'numeric'],
            'payload.readings.*.unit' => ['required', 'string'],
            'payload.readings.*.quality' => ['nullable', Rule::in(['good', 'uncertain', 'bad'])],
        ];
    }
}
