import { Form, Head, Link } from '@inertiajs/react';
import { Siren } from 'lucide-react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
    TimeRangeSelect,
    type TimeRangeFilters,
} from '@/components/concepts';
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
import type { Paginator } from '@/types/pagination';
import RfidOperationsController from '@/actions/App/Http/Controllers/RfidOperationsController';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as evacuationsIndex } from '@/routes/iot/rfid/evacuations';
import { show as evacuationShow } from '@/routes/iot/rfid/evacuation';

type ReportRow = {
    id: number;
    generated_at: string;
    on_site_count: number;
    accounted: number;
};

type Props = {
    site: { id: number; name: string };
    evacuationReports: Paginator<ReportRow>;
    filters: TimeRangeFilters;
    permissions: { canEvacuate: boolean };
};

export default function RfidEvacuations({ site, evacuationReports, filters, permissions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Evacuations — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Evacuation reports"
                    description={`${evacuationReports.total.toLocaleString()} reports in ${filters.label.toLowerCase()} — ${siteName}`}
                >
                    <TimeRangeSelect filters={filters} />
                    {permissions.canEvacuate ? (
                        <Form {...RfidOperationsController.generateEvacuation.form()}>
                            {({ processing }) => (
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    <Siren className="mr-1 size-4" />
                                    Generate evacuation report
                                </Button>
                            )}
                        </Form>
                    ) : null}
                </ConceptPageHeader>

                <ConceptTableCard>
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Evacuation reports</h2>
                        <p className="text-sm text-muted-foreground">
                            Page {evacuationReports.current_page} of {evacuationReports.last_page}
                        </p>
                    </div>
                    {evacuationReports.data.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No evacuation reports in this period.</p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Generated</TableHead>
                                        <TableHead>On site</TableHead>
                                        <TableHead>Accounted</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {evacuationReports.data.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell>{r.generated_at}</TableCell>
                                            <TableCell>{r.on_site_count}</TableCell>
                                            <TableCell>{r.accounted}</TableCell>
                                            <TableCell>
                                                <Link href={evacuationShow({ report: r.id })} className="text-sm text-primary hover:underline">
                                                    Open muster
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="px-4 pb-4">
                                <ConceptPagination links={evacuationReports.links} />
                            </div>
                        </>
                    )}
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

RfidEvacuations.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Evacuations', href: evacuationsIndex() },
    ],
});
