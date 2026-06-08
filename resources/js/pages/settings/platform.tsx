import { Head } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { ConceptPageHeader, ConceptPageShell, ConceptSummaryGrid, ConceptTableCard } from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import PlatformSettingsFormDialog from '@/components/siteguard/platform-settings-form-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as platformSettingsIndex } from '@/routes/settings/platform';

type Props = {
    settings: {
        retention_days: number;
        default_confidence_min: number;
        ai_enabled: boolean;
        ai_max_messages_per_hour_user: number;
        ai_model: string;
        has_openai_api_key: boolean;
        openai_api_key_masked: string | null;
        mail_from_address: string;
    };
    notificationChannels: {
        id: number;
        site: string;
        type: string;
        min_severity: string;
        is_active: boolean;
    }[];
};

export default function PlatformSettings({ settings, notificationChannels }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <Head title="Platform settings" />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Platform settings"
                    description="Retention, AI provider, and notification channels"
                >
                    <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                        <Pencil className="mr-1 size-4" />
                        Edit settings
                    </Button>
                </ConceptPageHeader>
                <ConceptSummaryGrid
                    items={[
                        { label: 'Retention', value: `${settings.retention_days} days` },
                        {
                            label: 'Min confidence',
                            value: settings.default_confidence_min.toString(),
                        },
                        {
                            label: 'AI assistant',
                            value: settings.ai_enabled ? 'Enabled' : 'Disabled',
                        },
                        {
                            label: 'OpenAI key',
                            value: settings.has_openai_api_key
                                ? (settings.openai_api_key_masked ?? 'Configured')
                                : 'Not set',
                        },
                        { label: 'AI model', value: settings.ai_model },
                        {
                            label: 'AI rate limit',
                            value: `${settings.ai_max_messages_per_hour_user} / hour`,
                        },
                        { label: 'Mail from', value: settings.mail_from_address || '—' },
                    ]}
                />
                <ConceptTableCard title="Notification channels">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Site</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Min severity</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notificationChannels.map((channel) => (
                                <TableRow key={channel.id}>
                                    <TableCell>{channel.site}</TableCell>
                                    <TableCell>{channel.type}</TableCell>
                                    <TableCell>{channel.min_severity}</TableCell>
                                    <TableCell>
                                        <ConceptStatusBadge
                                            tone={channel.is_active ? 'success' : 'muted'}
                                        >
                                            {channel.is_active ? 'Active' : 'Inactive'}
                                        </ConceptStatusBadge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
            <PlatformSettingsFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                settings={settings}
            />
        </>
    );
}

PlatformSettings.layout = () => ({
    breadcrumbs: [{ title: 'Platform settings', href: platformSettingsIndex() }],
});
