import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptSummaryGrid,
    ConceptTableCard,
} from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import AlertSnapshot from '@/components/siteguard/alert-snapshot';
import CreateInvestigationFromAlertDialog from '@/components/siteguard/create-investigation-from-alert-dialog';
import LinkAlertInvestigationDialog from '@/components/siteguard/link-alert-investigation-dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    acknowledge,
    dismiss,
    index as alertsIndex,
    show as alertShow,
} from '@/routes/alerts';
import { show as investigationShow } from '@/routes/investigations';

type LinkedInvestigation = {
    id: number;
    title: string;
    status: string;
    assigned_user: string | null;
    opened_at: string | null;
};

type AlertDetail = {
    id: number;
    title: string;
    severity: string;
    status: string;
    occurrence_count: number;
    opened_at: string | null;
    closed_at: string | null;
    captured_at: string | null;
    snapshot_url: string | null;
    site: { id: number; name: string } | null;
    camera: { id: number; name: string } | null;
    rule: { id: number; name: string; code: string; severity: string } | null;
    assigned_user: { id: number; name: string } | null;
    investigations: LinkedInvestigation[];
};

type AlertActionRow = {
    id: number;
    action: string;
    note: string | null;
    reason_code: string | null;
    user: string | null;
    created_at: string | null;
};

type AlertShowProps = {
    alert: AlertDetail;
    actions: AlertActionRow[];
    permissions: {
        canAcknowledge: boolean;
        canDismiss: boolean;
        canManageInvestigations: boolean;
    };
    users: { id: number; name: string }[];
    openInvestigations: { id: number; title: string }[];
};

export default function AlertShow({
    alert,
    actions,
    permissions,
    users,
    openInvestigations,
}: AlertShowProps) {
    const isOpen = alert.status === 'open';
    const [acknowledgeOpen, setAcknowledgeOpen] = useState(false);
    const [dismissOpen, setDismissOpen] = useState(false);
    const [createInvestigationOpen, setCreateInvestigationOpen] = useState(false);
    const [linkInvestigationOpen, setLinkInvestigationOpen] = useState(false);

    return (
        <>
            <Head title={alert.title} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={alert.title}
                    description={[alert.site?.name, alert.camera?.name, alert.rule?.code]
                        .filter(Boolean)
                        .join(' · ')}
                >
                    <div className="flex flex-wrap gap-2">
                        {permissions.canManageInvestigations ? (
                            <>
                                <Button onClick={() => setCreateInvestigationOpen(true)}>
                                    Open investigation
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setLinkInvestigationOpen(true)}
                                >
                                    Link to investigation
                                </Button>
                            </>
                        ) : null}
                        {isOpen && permissions.canAcknowledge ? (
                            <Button variant="outline" onClick={() => setAcknowledgeOpen(true)}>
                                Acknowledge
                            </Button>
                        ) : null}
                        {isOpen && permissions.canDismiss ? (
                            <Button variant="destructive" onClick={() => setDismissOpen(true)}>
                                Dismiss
                            </Button>
                        ) : null}
                    </div>
                </ConceptPageHeader>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
                    <AlertSnapshot
                        url={alert.snapshot_url}
                        alt={`Camera snapshot for ${alert.title}`}
                    />
                    <ConceptSummaryGrid
                        items={[
                            {
                                label: 'Severity',
                                value: (
                                    <ConceptStatusBadge
                                        tone={
                                            alert.severity === 'critical' ||
                                            alert.severity === 'high'
                                                ? 'danger'
                                                : 'warning'
                                        }
                                    >
                                        {alert.severity}
                                    </ConceptStatusBadge>
                                ),
                            },
                            {
                                label: 'Status',
                                value: (
                                    <ConceptStatusBadge
                                        tone={
                                            alert.status === 'open'
                                                ? 'danger'
                                                : 'neutral'
                                        }
                                    >
                                        {alert.status}
                                    </ConceptStatusBadge>
                                ),
                            },
                            { label: 'Occurrences', value: alert.occurrence_count },
                            { label: 'Opened', value: alert.opened_at ?? '—' },
                            { label: 'Captured', value: alert.captured_at ?? '—' },
                        ]}
                    />
                </div>

                <ConceptTableCard title="Linked investigations">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Investigation</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned</TableHead>
                                <TableHead>Opened</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alert.investigations.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-muted-foreground"
                                    >
                                        No investigations linked yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                alert.investigations.map((investigation) => (
                                    <TableRow key={investigation.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={investigationShow(investigation.id)}
                                                className="hover:underline"
                                            >
                                                {investigation.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{investigation.status}</TableCell>
                                        <TableCell>
                                            {investigation.assigned_user ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {investigation.opened_at ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ConceptTableCard>

                <ConceptTableCard title="Action history">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead>When</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {actions.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-muted-foreground"
                                    >
                                        No actions recorded.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                actions.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.action}</TableCell>
                                        <TableCell>{row.user ?? '—'}</TableCell>
                                        <TableCell>{row.note ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {row.created_at ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ConceptTableCard>

                <Button variant="outline" asChild>
                    <Link href={alertsIndex()}>Back to alerts</Link>
                </Button>
            </ConceptPageShell>

            {permissions.canManageInvestigations ? (
                <>
                    <CreateInvestigationFromAlertDialog
                        open={createInvestigationOpen}
                        onOpenChange={setCreateInvestigationOpen}
                        alertId={alert.id}
                        defaultTitle={alert.title}
                        users={users}
                    />
                    <LinkAlertInvestigationDialog
                        open={linkInvestigationOpen}
                        onOpenChange={setLinkInvestigationOpen}
                        alertId={alert.id}
                        investigations={openInvestigations}
                    />
                </>
            ) : null}

            <Dialog open={acknowledgeOpen} onOpenChange={setAcknowledgeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Acknowledge alert</DialogTitle>
                        <DialogDescription>
                            Mark this alert as acknowledged. It remains visible until dismissed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Form {...acknowledge.form({ alert: alert.id })}>
                            {({ processing }) => (
                                <Button type="submit" disabled={processing}>
                                    Confirm
                                </Button>
                            )}
                        </Form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={dismissOpen} onOpenChange={setDismissOpen}>
                <DialogContent className="flex max-h-[min(90vh,28rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                    {dismissOpen ? (
                        <Form
                            {...dismiss.form({ alert: alert.id })}
                            options={{ preserveScroll: true }}
                            onSuccess={() => setDismissOpen(false)}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            {({ processing }) => (
                                <>
                                    <DialogHeader className="border-b px-6 py-4">
                                        <DialogTitle>Dismiss alert</DialogTitle>
                                        <DialogDescription>
                                            Close this alert and optionally record a note.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogBody className="py-5">
                                        <div className="grid gap-2">
                                            <Label htmlFor="note">Note (optional)</Label>
                                            <Textarea id="note" name="note" rows={3} />
                                        </div>
                                    </DialogBody>
                                    <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-end">
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            Dismiss alert
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}

AlertShow.layout = (props: AlertShowProps) => ({
    breadcrumbs: [
        { title: 'Alerts', href: alertsIndex() },
        { title: props.alert.title, href: alertShow(props.alert.id) },
    ],
});
