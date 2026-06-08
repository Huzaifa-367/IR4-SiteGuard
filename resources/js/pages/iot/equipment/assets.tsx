import { Form, Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { IotViewLink } from '@/components/iot/iot-module-layout';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptTableCard,
} from '@/components/concepts';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
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
import EquipmentController from '@/actions/App/Http/Controllers/EquipmentController';
import { overview as equipmentOverview, show as equipmentShow } from '@/routes/iot/equipment';
import { index as equipmentAssetsIndex } from '@/routes/iot/equipment/assets';

type Props = {
    site: { id: number; name: string };
    assets: {
        id: number;
        equipment_id: string;
        name: string;
        equipment_type: string;
        status: string;
        inspections_count: number;
        last_inspection_at: string | null;
    }[];
    permissions: { canManage: boolean };
    equipmentTypeOptions: EnumOption[];
};

export default function EquipmentAssets({ site, assets, permissions, equipmentTypeOptions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [open, setOpen] = useState(false);

    return (
        <>
            <Head title={`Equipment assets — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Equipment assets"
                    description={`QR-labelled plant and vehicles for ${siteName}`}
                >
                    {permissions.canManage ? (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-1 size-4" />Register equipment</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Register equipment</DialogTitle></DialogHeader>
                                <Form {...EquipmentController.store.form()} onSuccess={() => setOpen(false)}>
                                    {({ processing, errors }) => (
                                        <div className="space-y-4">
                                            <div><Label htmlFor="equipment-id">Equipment ID</Label><Input id="equipment-id" name="equipment_id" required /><InputError message={errors.equipment_id} /></div>
                                            <div><Label htmlFor="equipment-name">Name</Label><Input id="equipment-name" name="name" required /><InputError message={errors.name} /></div>
                                            <div>
                                                <Label htmlFor="equipment-type">Type</Label>
                                                <EnumSelect
                                                    id="equipment-type"
                                                    name="equipment_type"
                                                    options={equipmentTypeOptions}
                                                    defaultValue="plant"
                                                    required
                                                />
                                            </div>
                                            <div><Label htmlFor="location">Location note</Label><Input id="location" name="location_note" /></div>
                                            <div><Label htmlFor="manufacturer">Manufacturer</Label><Input id="manufacturer" name="manufacturer" /></div>
                                            <div><Label htmlFor="model">Model</Label><Input id="model" name="model" /></div>
                                            <Button type="submit" disabled={processing}>Register</Button>
                                        </div>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    ) : null}
                </ConceptPageHeader>

                <ConceptTableCard>
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Equipment assets</h2>
                        <p className="text-sm text-muted-foreground">Each item has a unique QR slug for weatherproof Zebra ZT411 labels</p>
                    </div>
                    <Table className="text-sm">
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Inspections</TableHead>
                                <TableHead>Last inspection</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map((a) => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-mono text-xs">{a.equipment_id}</TableCell>
                                    <TableCell>{a.name}</TableCell>
                                    <TableCell>{a.equipment_type}</TableCell>
                                    <TableCell>
                                        <IotHealthBadge status={a.status} />
                                    </TableCell>
                                    <TableCell className="tabular-nums">{a.inspections_count}</TableCell>
                                    <TableCell><IotRelativeTime iso={a.last_inspection_at} /></TableCell>
                                    <TableCell className="text-right">
                                        <IotViewLink href={equipmentShow({ asset: a.id })} label="Manage" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

EquipmentAssets.layout = () => ({
    breadcrumbs: [
        { title: 'Equipment', href: equipmentOverview() },
        { title: 'Assets', href: equipmentAssetsIndex() },
    ],
});
