<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGasThresholdsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('gas_thresholds.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'lel_pct.high' => ['required', 'numeric', 'min:0'],
            'o2_pct.low' => ['required', 'numeric', 'min:0'],
            'o2_pct.high' => ['required', 'numeric', 'min:0'],
            'h2s_ppm.high' => ['required', 'numeric', 'min:0'],
            'co_ppm.high' => ['required', 'numeric', 'min:0'],
        ];
    }
}
