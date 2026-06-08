import { Check, Cog, ShieldCheck, UserCog, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { PermissionGroup } from '@/types/permission';

type PermissionMatrixProps = {
    groups: PermissionGroup[];
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
    name?: string;
};

const groupIcons: Record<string, LucideIcon> = {
    roles: ShieldCheck,
    users: UserCog,
    settings: Cog,
};

export default function PermissionMatrix({
    groups,
    value,
    onChange,
    disabled = false,
    name = 'permissions',
}: PermissionMatrixProps) {
    const selected = new Set(value);

    const togglePermission = (permission: string, checked: boolean): void => {
        if (disabled) {
            return;
        }

        const next = new Set(selected);

        if (checked) {
            next.add(permission);
        } else {
            next.delete(permission);
        }

        onChange(Array.from(next));
    };

    return (
        <div className="divide-y rounded-xl border">
            {value.map((permission) => (
                <input
                    key={permission}
                    type="hidden"
                    name={`${name}[]`}
                    value={permission}
                />
            ))}

            {value.length === 0 && (
                <input type="hidden" name={`${name}[]`} value="" disabled />
            )}

            {groups.map((group) => {
                const Icon = groupIcons[group.key] ?? Users;

                return (
                    <div
                        key={group.key}
                        className={cn(
                            'grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6',
                            disabled && 'opacity-60',
                        )}
                    >
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted/40 text-foreground/80">
                                <Icon className="size-5" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                    {group.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {group.description}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:w-72 sm:grid-cols-4">
                            {group.permissions.map((permission) => {
                                const isChecked = selected.has(permission.name);

                                return (
                                    <Toggle
                                        key={permission.name}
                                        variant="outline"
                                        size="sm"
                                        pressed={isChecked}
                                        onPressedChange={(pressed) =>
                                            togglePermission(
                                                permission.name,
                                                pressed,
                                            )
                                        }
                                        disabled={disabled}
                                        aria-label={`Toggle ${permission.label}`}
                                        className={cn(
                                            'h-7 w-full min-w-0 justify-center gap-1 rounded-md border-input px-1.5 text-xs font-medium',
                                            isChecked &&
                                                'border-primary bg-primary/10 text-primary hover:bg-primary/15 data-[state=on]:bg-primary/10 data-[state=on]:text-primary',
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                'size-3 shrink-0 transition-opacity',
                                                isChecked
                                                    ? 'opacity-100'
                                                    : 'opacity-40',
                                            )}
                                        />
                                        {shortLabel(permission.label)}
                                    </Toggle>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * The reference design surfaces verb-only labels on permission pills
 * (e.g. "View users" becomes "View"). We strip a leading verb-only prefix
 * while keeping the full label available via aria-label.
 */
function shortLabel(label: string): string {
    const [head, ...rest] = label.split(' ');

    if (rest.length === 0) {
        return label;
    }

    return head;
}
