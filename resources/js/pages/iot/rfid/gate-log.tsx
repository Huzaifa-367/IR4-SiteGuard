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
import { index as gateLogIndex } from '@/routes/iot/rfid/gate-log';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';

type Props = {
    site: { id: number; name: string };
    gateLog: {
        id: number;
        tag_epc: string;
        worker: string | null;
        direction: string;
        occurred_at: string;
    }[];
};

export default function RfidGateLog({ site, gateLog }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Gate log — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Gate entry / exit log"
                    description={`Gate passage events for ${siteName}`}
                />

                <ConceptTableCard>
                    <div className="border-b p-4"><h2 className="font-semibold">Gate entry / exit log</h2></div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead>Worker</TableHead>
                                <TableHead>Tag</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gateLog.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell><IotRelativeTime iso={row.occurred_at} /></TableCell>
                                    <TableCell>
                                        <IotHealthBadge status={row.direction} />
                                    </TableCell>
                                    <TableCell>{row.worker ?? 'Unknown'}</TableCell>
                                    <TableCell className="font-mono text-[10px]">{row.tag_epc}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

RfidGateLog.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Gate log', href: gateLogIndex() },
    ],
});
