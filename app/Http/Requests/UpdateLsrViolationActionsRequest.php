<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLsrViolationActionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('lsr.actions_update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'actions_taken' => ['required', 'string', 'max:5000'],
        ];
    }
}
