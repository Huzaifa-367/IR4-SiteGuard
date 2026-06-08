<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class IngestEdgeHeartbeatRequest extends FormRequest
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
            'payload' => ['required', 'array'],
            'payload.event_id' => ['required', 'uuid'],
            'payload.reported_at' => ['required', 'date'],
            'payload.vpn_up' => ['nullable', 'boolean'],
            'payload.storage_free_gb' => ['nullable', 'numeric'],
            'payload.pole_streams_active' => ['nullable', 'integer', 'min:0'],
            'payload.cameras_online' => ['nullable', 'integer', 'min:0'],
            'payload.rfid_reader_ok' => ['nullable', 'boolean'],
            'payload.modbus_bus_ok' => ['nullable', 'boolean'],
            'payload.software_version' => ['nullable', 'string'],
        ];
    }
}
