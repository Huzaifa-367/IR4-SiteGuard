<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LinkAlertInvestigationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('investigations.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'investigation_id' => [
                'required',
                'integer',
                Rule::exists('investigations', 'id'),
            ],
        ];
    }
}
