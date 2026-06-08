import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store as storeRule, update as updateRule } from '@/routes/rules';

export type RuleFormValues = {
    id: number;
    code: string;
    name: string;
    severity: string;
    is_active: boolean;
    detection_module_id: number;
    module: string | null;
    match_key: string;
    dwell_sec: number | null;
    cooldown_sec: number | null;
};

type RuleFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modules: { id: number; name: string }[];
    rule?: RuleFormValues | null;
};

export default function RuleFormDialog({
    open,
    onOpenChange,
    modules,
    rule = null,
}: RuleFormDialogProps) {
    const isEditing = rule !== null;
    const action = isEditing
        ? updateRule.form({ rule: rule.id })
        : storeRule.form();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                {open && (isEditing || modules.length > 0) ? (
                    <Form
                        key={rule?.id ?? 'create'}
                        {...action}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                                    <DialogTitle className="text-xl font-semibold">
                                        {isEditing ? 'Edit rule' : 'Add rule'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm">
                                        {isEditing
                                            ? 'Update severity, match key, and status. Code and module cannot be changed.'
                                            : 'Define a detection match key and severity for this site.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="space-y-4 py-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="rule-module">Module</Label>
                                        {isEditing ? (
                                            <Input
                                                id="rule-module"
                                                value={rule.module ?? '—'}
                                                disabled
                                                className="bg-muted"
                                            />
                                        ) : (
                                            <select
                                                id="rule-module"
                                                name="detection_module_id"
                                                required
                                                className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm"
                                            >
                                                {modules.map((mod) => (
                                                    <option key={mod.id} value={mod.id}>
                                                        {mod.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <InputError message={errors.detection_module_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rule-code">Code</Label>
                                        {isEditing ? (
                                            <Input
                                                id="rule-code"
                                                value={rule.code}
                                                disabled
                                                className="bg-muted font-mono"
                                            />
                                        ) : (
                                            <Input
                                                id="rule-code"
                                                name="code"
                                                required
                                                placeholder="PPE-002"
                                            />
                                        )}
                                        <InputError message={errors.code} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rule-name">Name</Label>
                                        <Input
                                            id="rule-name"
                                            name="name"
                                            defaultValue={rule?.name ?? ''}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rule-severity">Severity</Label>
                                        <select
                                            id="rule-severity"
                                            name="severity"
                                            required
                                            defaultValue={rule?.severity ?? 'medium'}
                                            className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                        <InputError message={errors.severity} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rule-match">Match class key</Label>
                                        <Input
                                            id="rule-match"
                                            name="definition[match]"
                                            defaultValue={rule?.match_key ?? ''}
                                            required
                                            placeholder="no_helmet"
                                        />
                                        <InputError message={errors['definition.match']} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="rule-dwell">Dwell (sec)</Label>
                                            <Input
                                                id="rule-dwell"
                                                name="dwell_sec"
                                                type="number"
                                                min={0}
                                                defaultValue={rule?.dwell_sec ?? ''}
                                                placeholder="Optional"
                                            />
                                            <InputError message={errors.dwell_sec} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="rule-cooldown">Cooldown (sec)</Label>
                                            <Input
                                                id="rule-cooldown"
                                                name="cooldown_sec"
                                                type="number"
                                                min={0}
                                                defaultValue={rule?.cooldown_sec ?? ''}
                                                placeholder="Optional"
                                            />
                                            <InputError message={errors.cooldown_sec} />
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="hidden"
                                                name="is_active"
                                                value="0"
                                            />
                                            <input
                                                id="rule-active"
                                                name="is_active"
                                                type="checkbox"
                                                value="1"
                                                defaultChecked={rule.is_active}
                                                className="size-4 rounded border-input"
                                            />
                                            <Label htmlFor="rule-active" className="font-normal">
                                                Rule is active
                                            </Label>
                                            <InputError message={errors.is_active} />
                                        </div>
                                    ) : (
                                        <input type="hidden" name="is_active" value="1" />
                                    )}
                                </DialogBody>
                                <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>
                                        {isEditing ? 'Save changes' : 'Add rule'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
