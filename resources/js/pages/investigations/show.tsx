import { Form, Head, Link } from '@inertiajs/react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptSummaryGrid,
    ConceptTableCard,
} from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AlertSnapshot from '@/components/siteguard/alert-snapshot';
import { useSiteContext } from '@/hooks/use-site-context';
import { show as alertShow } from '@/routes/alerts';
import { close as closeInvestigation, index as investigationsIndex } from '@/routes/investigations';

type Props = {
    site: { id: number; name: string };
    investigation: {
        id: number;
        title: string;
        description: string | null;
        status: string;
        opened_at: string | null;
        closed_at: string | null;
        assigned_user: string | null;
        opened_by: string | null;
    };
    linkedAlerts: {
        id: number;
        title: string;
        severity: string;
        status: string;
        camera: string | null;
        snapshot_url: string | null;
    }[];
};

export default function InvestigationShow({ site, investigation, linkedAlerts }: Props) {
    const isOpen = investigation.status === 'open';
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={investigation.title} />
            <ConceptPageShell>
                <ConceptPageHeader title={investigation.title} description={siteName}>
                    {isOpen ? (
                        <Form {...closeInvestigation.form({ investigation: investigation.id })}>
                            {({ processing }) => (
                                <Button type="submit" variant="outline" size="sm" disabled={processing}>
                                    Close investigation
                                </Button>
                            )}
                        </Form>
                    ) : null}
                </ConceptPageHeader>
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href={investigationsIndex()} className="text-primary hover:underline">
                        All investigations
                    </Link>
                </div>
                <ConceptStatusBadge tone={isOpen ? 'warning' : 'success'}>
                    {investigation.status}
                </ConceptStatusBadge>
                <ConceptSummaryGrid
                    items={[
                        { label: 'Opened by', value: investigation.opened_by ?? '—' },
                        { label: 'Assigned to', value: investigation.assigned_user ?? '—' },
                        { label: 'Opened', value: investigation.opened_at ?? '—' },
                        { label: 'Closed', value: investigation.closed_at ?? '—' },
                    ]}
                />
                {investigation.description ? (
                    <p className="text-sm text-muted-foreground">{investigation.description}</p>
                ) : null}
                <ConceptTableCard title="Linked alerts">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Snapshot</TableHead>
                                <TableHead>Alert</TableHead>
                                <TableHead>Camera</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {linkedAlerts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground">
                                        No alerts linked.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                linkedAlerts.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell>
                                            <AlertSnapshot
                                                url={alert.snapshot_url}
                                                alt={alert.title}
                                                compact
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={alertShow(alert.id)}
                                                className="font-medium hover:underline"
                                            >
                                                {alert.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{alert.camera ?? '—'}</TableCell>
                                        <TableCell>{alert.severity}</TableCell>
                                        <TableCell>{alert.status}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

InvestigationShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Investigations', href: investigationsIndex() },
        { title: props.investigation.title, href: investigationsIndex() },
    ],
});
