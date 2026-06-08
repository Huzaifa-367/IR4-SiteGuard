<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IngestRfidRequest extends FormRequest
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
            'reader_id' => ['required', 'integer', 'exists:rfid_readers,id'],
            'payload' => ['required', 'array'],
            'payload.batch_id' => ['required', 'uuid'],
            'payload.read_at' => ['required', 'date'],
            'payload.events' => ['required', 'array', 'min:1'],
            'payload.events.*.epc' => ['required', 'string'],
            'payload.events.*.rssi' => ['nullable', 'integer'],
            'payload.events.*.direction' => ['nullable', Rule::in(['entry', 'exit'])],
            'payload.events.*.read_at' => ['nullable', 'date'],
        ];
    }
}
