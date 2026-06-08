import { Form, Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { HorizontalCategoryChart } from '@/components/iot/iot-charts';
import { IotHealthBadge, IotMiniStat, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { index as evacuationsIndex } from '@/routes/iot/rfid/evacuations';

type PersonnelRow = {
    tag_epc: string;
    worker: string | null;
    contractor: string | null;
    last_zone: string | null;
    last_seen_at: string | null;
    status: string;
    muster_point: string | null;
    notes: string | null;
};

type Props = {
    site: { id: number; name: string };
    report: {
        id: number;
        generated_at: string;
        on_site_count: number;
        personnel: PersonnelRow[];
    };
    permissions: { canUpdateMuster: boolean };
    musterStatusOptions: EnumOption[];
};

function statusCounts(personnel: PersonnelRow[]): { label: string; count: number }[] {
    const map = new Map<string, number>();

    for (const person of personnel) {
        const key = person.status || 'unknown';
        map.set(key, (map.get(key) ?? 0) + 1);
    }

    return [...map.entries()]
        .map(([label, count]) => ({ label: formatHumanLabel(label), count }))
        .sort((a, b) => b.count - a.count);
}

export default function RfidEvacuation({ site, report, permissions, musterStatusOptions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    const accounted = report.personnel.filter((p) => p.status === 'accounted').length;
    const unaccounted = report.personnel.filter((p) => p.status === 'unaccounted').length;
    const pending = report.on_site_count - accounted - unaccounted;
    const byStatus = useMemo(() => statusCounts(report.personnel), [report.personnel]);

    return (
        <>
            <Head title={`Evacuation report — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Evacuation muster report"
                    description={`${siteName} · Generated ${report.generated_at}`}
                >
                    <div className="flex gap-3">
                        <Button size="sm" variant="outline" asChild>
                            <a href={`/iot/rfid/evacuation/${report.id}/export`}>Export HTML</a>
                        </Button>
                        <Link href={evacuationsIndex()} className="text-sm text-primary hover:underline">
                            Back to RFID
                        </Link>
                    </div>
                </ConceptPageHeader>

                <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <IotMiniStat label="On site" value={report.on_site_count} sub="At generation" />
                    <IotMiniStat label="Accounted" value={accounted} tone="success" sub="At muster" />
                    <IotMiniStat label="Unaccounted" value={unaccounted} tone="danger" sub="Missing" />
                    <IotMiniStat
                        label="Pending"
                        value={pending}
                        tone={pending > 0 ? 'warning' : undefined}
                        sub="Not yet marked"
                    />
                </div>

                {byStatus.length > 0 ? (
                    <div className="mb-4">
                        <HorizontalCategoryChart
                            title="Muster status breakdown"
                            data={byStatus}
                            valueLabel="Personnel"
                            description={`${report.personnel.length} personnel tracked`}
                        />
                    </div>
                ) : null}

                {permissions.canUpdateMuster ? (
                    <Form
                        {...RfidOperationsController.updateEvacuationMuster.form({ report: report.id })}
                        className="mb-4"
                    >
                        {({ processing }) => (
                            <ConceptTableCard>
                                <div className="border-b px-4 py-3">
                                    <h2 className="text-sm font-semibold">Muster accountability</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Mark each person as accounted or unaccounted at muster point (IR4 §8.3)
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Worker</TableHead>
                                                <TableHead>Last zone</TableHead>
                                                <TableHead>Last seen</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Muster point</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.personnel.map((person, index) => (
                                                <TableRow key={person.tag_epc}>
                                                    <TableCell>
                                                        <input
                                                            type="hidden"
                                                            name={`personnel[${index}][tag_epc]`}
                                                            value={person.tag_epc}
                                                        />
                                                        <p className="text-sm">{person.worker ?? 'Unknown'}</p>
                                                        <p className="font-mono text-[11px] text-muted-foreground">
                                                            {person.tag_epc}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {person.last_zone ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <IotRelativeTime iso={person.last_seen_at} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <EnumSelect
                                                            name={`personnel[${index}][status]`}
                                                            options={musterStatusOptions}
                                                            defaultValue={person.status}
                                                            className="h-8 px-2 text-xs"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <input
                                                            name={`personnel[${index}][muster_point]`}
                                                            defaultValue={person.muster_point ?? ''}
                                                            className="flex h-8 w-full min-w-[6rem] rounded-md border border-input bg-transparent px-2 text-xs"
                                                            placeholder="Muster A"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <input
                                                            name={`personnel[${index}][notes]`}
                                                            defaultValue={person.notes ?? ''}
                                                            className="flex h-8 w-full min-w-[8rem] rounded-md border border-input bg-transparent px-2 text-xs"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="border-t px-4 py-3">
                                    <Button type="submit" disabled={processing} size="sm">
                                        Save muster status
                                    </Button>
                                </div>
                            </ConceptTableCard>
                        )}
                    </Form>
                ) : (
                    <ConceptTableCard>
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Personnel roster</h2>
                            <p className="text-xs text-muted-foreground">{report.personnel.length} on site</p>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Worker</TableHead>
                                        <TableHead>Contractor</TableHead>
                                        <TableHead>Last zone</TableHead>
                                        <TableHead>Last seen</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.personnel.map((person) => (
                                        <TableRow key={person.tag_epc}>
                                            <TableCell className="text-sm">{person.worker ?? 'Unknown'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {person.contractor ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm">{person.last_zone ?? '—'}</TableCell>
                                            <TableCell className="text-sm">
                                                <IotRelativeTime iso={person.last_seen_at} />
                                            </TableCell>
                                            <TableCell>
                                                <IotHealthBadge status={person.status} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ConceptTableCard>
                )}
            </ConceptPageShell>
        </>
    );
}

RfidEvacuation.layout = () => ({
    breadcrumbs: [
        { title: 'Evacuations', href: evacuationsIndex() },
        { title: 'Evacuation report', href: '#' },
    ],
});
