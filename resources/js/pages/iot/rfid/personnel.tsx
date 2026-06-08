import { Head } from '@inertiajs/react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptTableCard,
} from '@/components/concepts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as personnelIndex } from '@/routes/iot/rfid/personnel';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';

type Props = {
    site: { id: number; name: string };
    onSiteCount: number;
    onSitePersonnel: {
        tag_epc: string;
        worker: string | null;
        contractor: string | null;
        role: string | null;
        zone: string | null;
        last_seen_at: string;
        is_stale: boolean;
        is_stationary: boolean;
    }[];
};

export default function RfidPersonnel({ site, onSitePersonnel }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`On-site personnel — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="On-site personnel"
                    description={`Live RFID headcount and zone positions for ${siteName}`}
                />

                <ConceptTableCard>
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">On-site personnel</h2>
                        <p className="text-xs text-muted-foreground">{onSitePersonnel.length} tagged workers with live zone position</p>
                    </div>
                    {onSitePersonnel.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No personnel currently on site.</p>
                    ) : (
                        <Table className="text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Worker</TableHead>
                                    <TableHead>Zone</TableHead>
                                    <TableHead>Last seen</TableHead>
                                    <TableHead>Flags</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {onSitePersonnel.map((p) => (
                                    <TableRow key={p.tag_epc}>
                                        <TableCell>
                                            <p>{p.worker ?? 'Unknown tag'}</p>
                                            <p className="text-xs text-muted-foreground">{p.contractor ?? p.tag_epc}</p>
                                        </TableCell>
                                        <TableCell>{p.zone ?? '—'}</TableCell>
                                        <TableCell><IotRelativeTime iso={p.last_seen_at} /></TableCell>
                                        <TableCell className="flex gap-1">
                                            {p.is_stale ? <IotHealthBadge status="stale" /> : null}
                                            {p.is_stationary ? <IotHealthBadge status="stationary" /> : null}
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

RfidPersonnel.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'On-site personnel', href: personnelIndex() },
    ],
});
