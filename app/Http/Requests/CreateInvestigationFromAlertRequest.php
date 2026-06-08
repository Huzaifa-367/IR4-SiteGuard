<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateInvestigationFromAlertRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'assigned_user_id' => ['required', 'integer', 'exists:users,id'],
            'priority' => ['required', 'string', 'in:low,medium,high,critical'],
        ];
    }
}
