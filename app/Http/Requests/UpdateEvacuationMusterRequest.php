<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEvacuationMusterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('evacuation.generate') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'personnel' => ['required', 'array', 'min:1'],
            'personnel.*.tag_epc' => ['required', 'string', 'max:64'],
            'personnel.*.status' => ['required', Rule::in(SiteGuardEnums::keys('muster_statuses'))],
            'personnel.*.muster_point' => ['nullable', 'string', 'max:255'],
            'personnel.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
