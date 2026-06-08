<?php

namespace App\Http\Requests;

use App\Models\Camera;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCameraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('cameras.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Camera $camera */
        $camera = $this->route('camera');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:64',
                Rule::unique('cameras', 'code')
                    ->where('site_id', $camera->site_id)
                    ->ignore($camera->id),
            ],
            'location_label' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
