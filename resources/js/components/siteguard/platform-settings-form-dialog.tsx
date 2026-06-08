import { Form } from '@inertiajs/react';
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
import { update as updatePlatform } from '@/routes/settings/platform';

type PlatformSettings = {
    retention_days: number;
    default_confidence_min: number;
    ai_enabled: boolean;
    ai_max_messages_per_hour_user: number;
    ai_model: string;
    has_openai_api_key: boolean;
    openai_api_key_masked: string | null;
    mail_from_address: string;
};

type PlatformSettingsFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: PlatformSettings;
};

export default function PlatformSettingsFormDialog({
    open,
    onOpenChange,
    settings,
}: PlatformSettingsFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,40rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                {open ? (
                    <Form
                        {...updatePlatform.form()}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        {({ processing }) => (
                            <>
                                <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                                    <DialogTitle className="text-xl font-semibold">
                                        Edit platform settings
                                    </DialogTitle>
                                    <DialogDescription className="text-sm">
                                        Retention, AI provider, and outbound mail defaults.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="grid gap-4 py-5 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="openai_api_key">OpenAI API key</Label>
                                        <Input
                                            id="openai_api_key"
                                            name="openai_api_key"
                                            type="password"
                                            autoComplete="off"
                                            placeholder={
                                                settings.has_openai_api_key
                                                    ? `Configured (${settings.openai_api_key_masked ?? '••••'}) — leave blank to keep`
                                                    : 'sk-…'
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="ai_model">AI model</Label>
                                        <Input
                                            id="ai_model"
                                            name="ai_model"
                                            defaultValue={settings.ai_model}
                                            placeholder="gpt-4o-mini"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="retention_days">Retention (days)</Label>
                                        <Input
                                            id="retention_days"
                                            name="retention_days"
                                            type="number"
                                            min={1}
                                            defaultValue={settings.retention_days}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="default_confidence_min">Min confidence</Label>
                                        <Input
                                            id="default_confidence_min"
                                            name="default_confidence_min"
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            max={1}
                                            defaultValue={settings.default_confidence_min}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ai_max_messages_per_hour_user">AI messages / hour</Label>
                                        <Input
                                            id="ai_max_messages_per_hour_user"
                                            name="ai_max_messages_per_hour_user"
                                            type="number"
                                            min={1}
                                            defaultValue={settings.ai_max_messages_per_hour_user}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mail_from_address">Mail from</Label>
                                        <Input
                                            id="mail_from_address"
                                            name="mail_from_address"
                                            type="email"
                                            defaultValue={settings.mail_from_address}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 sm:col-span-2">
                                        <input type="hidden" name="ai_enabled" value="0" />
                                        <input
                                            type="checkbox"
                                            id="ai_enabled"
                                            name="ai_enabled"
                                            value="1"
                                            defaultChecked={settings.ai_enabled}
                                        />
                                        <Label htmlFor="ai_enabled">AI assistant enabled</Label>
                                    </div>
                                </DialogBody>
                                <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>
                                        Save settings
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
