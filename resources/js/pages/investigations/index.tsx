import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import InvestigationFormDialog from '@/components/siteguard/investigation-form-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSiteContext } from '@/hooks/use-site-context';
import { index as investigationsIndex, show as investigationShow } from '@/routes/investigations';

type InvestigationRow = {
    id: number;
    title: string;
    status: string;
    assigned_user: string | null;
    opened_at: string | null;
    alerts_count: number;
};

type Props = {
    site: { id: number; name: string };
    investigations: InvestigationRow[];
    users: { id: number; name: string }[];
};

export default function InvestigationsIndex({ site, investigations, users }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Investigations — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader title="Investigations" description={siteName}>
                    <Button size="sm" onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-1 size-4" />
                        New investigation
                    </Button>
                </ConceptPageHeader>
                <ConceptTableCard>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Alerts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {investigations.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell>
                                        <Link
                                            href={investigationShow(inv.id)}
                                            className="font-medium hover:underline"
                                        >
                                            {inv.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <ConceptStatusBadge
                                            tone={inv.status === 'open' ? 'warning' : 'success'}
                                        >
                                            {inv.status}
                                        </ConceptStatusBadge>
                                    </TableCell>
                                    <TableCell>{inv.assigned_user ?? '—'}</TableCell>
                                    <TableCell>{inv.alerts_count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
            <InvestigationFormDialog open={dialogOpen} onOpenChange={setDialogOpen} users={users} />
        </>
    );
}

InvestigationsIndex.layout = () => ({
    breadcrumbs: [{ title: 'Investigations', href: investigationsIndex() }],
});
