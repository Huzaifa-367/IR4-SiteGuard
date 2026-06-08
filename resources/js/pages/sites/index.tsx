import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
} from '@/components/concepts';
import type { Paginator } from '@/types/pagination';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import SiteFormDialog from '@/components/siteguard/site-form-dialog';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as sitesIndex, show as siteShow } from '@/routes/sites';

type SiteRow = {
    id: number;
    name: string;
    code: string | null;
    timezone: string;
    status: string;
    cameras_count: number;
    alerts_count: number;
};

type SitesIndexProps = {
    sites: Paginator<SiteRow>;
    canCreate: boolean;
    timezones: string[];
    openCreateDialog?: boolean;
};

export default function SitesIndex({
    sites,
    canCreate,
    timezones,
    openCreateDialog = false,
}: SitesIndexProps) {
    const { can } = usePermissions();
    const showCreate = canCreate || can('sites.create');
    const [createDialogOpen, setCreateDialogOpen] = useState(openCreateDialog);

    useEffect(() => {
        if (openCreateDialog) {
            setCreateDialogOpen(true);
        }
    }, [openCreateDialog]);

    return (
        <>
            <Head title="Sites" />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Sites"
                    description="Construction sites with cameras, modules, and safety rules."
                >
                    {showCreate ? (
                        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-1 size-4" />
                            Add site
                        </Button>
                    ) : null}
                </ConceptPageHeader>
                <ConceptTableCard>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Cameras</TableHead>
                                    <TableHead className="text-right">Alerts</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sites.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground">
                                            No sites yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sites.data.map((site) => (
                                        <TableRow key={site.id}>
                                            <TableCell>
                                                <Link
                                                    href={siteShow(site.id)}
                                                    className="font-medium hover:underline"
                                                >
                                                    {site.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{site.code ?? '—'}</TableCell>
                                            <TableCell>
                                                <ConceptStatusBadge
                                                    tone={
                                                        site.status === 'active'
                                                            ? 'success'
                                                            : 'neutral'
                                                    }
                                                >
                                                    {site.status}
                                                </ConceptStatusBadge>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {site.cameras_count}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {site.alerts_count}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="px-4 pb-4">
                        <ConceptPagination links={sites.links} />
                    </div>
                </ConceptTableCard>
            </ConceptPageShell>
            {showCreate ? (
                <SiteFormDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    timezones={timezones}
                />
            ) : null}
        </>
    );
}

SitesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Sites',
            href: sitesIndex(),
        },
    ],
};
