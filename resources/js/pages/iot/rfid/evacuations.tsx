import { Form, Head, Link } from '@inertiajs/react';
import { Siren } from 'lucide-react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptTableCard,
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
import RfidOperationsController from '@/actions/App/Http/Controllers/RfidOperationsController';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as evacuationsIndex } from '@/routes/iot/rfid/evacuations';
import { show as evacuationShow } from '@/routes/iot/rfid/evacuation';

type Props = {
    site: { id: number; name: string };
    evacuationReports: {
        id: number;
        generated_at: string;
        on_site_count: number;
        accounted: number;
    }[];
    permissions: { canEvacuate: boolean };
};

export default function RfidEvacuations({ site, evacuationReports, permissions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Evacuations — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Evacuation reports"
                    description={`Muster snapshots and evacuation history for ${siteName}`}
                >
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
                    <div className="border-b p-4"><h2 className="font-semibold">Recent evacuation reports</h2></div>
                    {evacuationReports.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No evacuation reports generated yet.</p>
                    ) : (
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
                                {evacuationReports.map((r) => (
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
