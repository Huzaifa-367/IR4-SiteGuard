import { Form, Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptTableCard,
} from '@/components/concepts';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as zonesIndex } from '@/routes/iot/rfid/zones';
import { IotUtilizationBar } from '@/components/iot/iot-ui';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';

type Props = {
    site: { id: number; name: string };
    zones: {
        id: number;
        name: string;
        code: string;
        zone_type: string;
        max_occupancy: number | null;
        on_site_count: number;
        readers_count: number;
    }[];
    permissions: { canManageZones: boolean };
    zoneTypeOptions: EnumOption[];
};

export default function RfidZones({ site, zones, permissions, zoneTypeOptions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [zoneOpen, setZoneOpen] = useState(false);

    return (
        <>
            <Head title={`RFID zones — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Zone occupancy"
                    description={`RFID zones and reader coverage for ${siteName}`}
                />

                <ConceptTableCard>
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Zone occupancy</h2>
                        {permissions.canManageZones ? (
                            <Dialog open={zoneOpen} onOpenChange={setZoneOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline"><Plus className="mr-1 size-4" />Add zone</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>New RFID zone</DialogTitle></DialogHeader>
                                    <Form {...RfidOperationsController.storeZone.form()} onSuccess={() => setZoneOpen(false)}>
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div><Label htmlFor="zone-name">Name</Label><Input id="zone-name" name="name" required /><InputError message={errors.name} /></div>
                                                <div><Label htmlFor="zone-code">Code</Label><Input id="zone-code" name="code" required /><InputError message={errors.code} /></div>
                                                <div>
                                                    <Label htmlFor="zone-type">Zone type</Label>
                                                    <EnumSelect
                                                        id="zone-type"
                                                        name="zone_type"
                                                        options={zoneTypeOptions}
                                                        defaultValue={
                                                            zoneTypeOptions.find((o) => o.value === 'general')?.value
                                                            ?? zoneTypeOptions[0]?.value
                                                        }
                                                    />
                                                </div>
                                                <Button type="submit" disabled={processing}>Create zone</Button>
                                            </div>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        ) : null}
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Zone</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Utilization</TableHead>
                                <TableHead className="text-center">Readers</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {zones.map((z) => (
                                <TableRow key={z.id}>
                                    <TableCell>
                                        <p className="font-medium">{z.name}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">{z.code}</p>
                                    </TableCell>
                                    <TableCell className="text-xs">{z.zone_type.replace(/_/g, ' ')}</TableCell>
                                    <TableCell>
                                        <IotUtilizationBar
                                            value={z.on_site_count}
                                            max={z.max_occupancy}
                                            utilization={
                                                z.max_occupancy
                                                    ? Math.round((z.on_site_count / z.max_occupancy) * 1000) / 10
                                                    : null
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="tabular-nums text-center">{z.readers_count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

RfidZones.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Zones', href: zonesIndex() },
    ],
});
