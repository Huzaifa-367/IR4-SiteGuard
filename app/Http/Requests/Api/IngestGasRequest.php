<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IngestGasRequest extends FormRequest
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
            'gas_gateway_id' => ['required', 'integer', 'exists:gas_gateways,id'],
            'payload' => ['required', 'array'],
            'payload.event_id' => ['required', 'uuid'],
            'payload.read_at' => ['required', 'date'],
            'payload.readings' => ['required', 'array'],
            'payload.readings.lel_pct' => ['required', 'numeric', 'min:0'],
            'payload.readings.o2_pct' => ['required', 'numeric', 'min:0'],
            'payload.readings.h2s_ppm' => ['required', 'numeric', 'min:0'],
            'payload.readings.co_ppm' => ['required', 'numeric', 'min:0'],
            'payload.alarm_state' => ['required', Rule::in(['normal', 'low_alarm', 'high_alarm', 'stel', 'twa'])],
            'payload.alarm_gases' => ['present', 'array'],
            'payload.poll_type' => ['required', Rule::in(['scheduled', 'immediate'])],
            'payload.detector_serial' => ['nullable', 'string'],
        ];
    }
}
