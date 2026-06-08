import { cn } from '@/lib/utils';

export type EnumOption = {
    value: string;
    label: string;
};

type EnumSelectProps = {
    id?: string;
    name: string;
    options: EnumOption[];
    defaultValue?: string;
    required?: boolean;
    className?: string;
    placeholder?: string;
};

export function EnumSelect({
    id,
    name,
    options,
    defaultValue,
    required,
    className,
    placeholder,
}: EnumSelectProps) {
    return (
        <select
            id={id}
            name={name}
            required={required}
            defaultValue={defaultValue}
            className={cn(
                'flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs',
                className,
            )}
        >
            {placeholder ? (
                <option value="" disabled>
                    {placeholder}
                </option>
            ) : null}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
