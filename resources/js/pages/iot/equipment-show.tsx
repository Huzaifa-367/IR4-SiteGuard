import { Form, Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';
import { IotEmptyState, IotHealthBadge, IotMiniStat, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
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
import { index as equipmentAssetsIndex } from '@/routes/iot/equipment/assets';

type Props = {
    site: { id: number; name: string };
    asset: {
        id: number;
        equipment_id: string;
        name: string;
        equipment_type: string;
        status: string;
        manufacturer: string | null;
        model: string | null;
        serial_number: string | null;
        qr_slug: string;
        scan_url: string;
        location_note: string | null;
        registered_at: string | null;
    };
    inspections: {
        id: number;
        inspected_at: string;
        inspector_name: string;
        outcome: string;
        notes: string | null;
        next_inspection_due: string | null;
    }[];
    maintenance: {
        id: number;
        performed_at: string;
        maintenance_type: string;
        description: string;
        performed_by: string | null;
        next_service_due: string | null;
    }[];
    documents: {
        id: number;
        document_type: string;
        title: string;
        external_url: string | null;
        uploaded_at: string;
    }[];
    permissions: { canManage: boolean };
    inspectionOutcomeOptions: EnumOption[];
    maintenanceTypeOptions: EnumOption[];
    documentTypeOptions: EnumOption[];
    users: { id: number; name: string }[];
};

export default function EquipmentShow({
    site,
    asset,
    inspections,
    maintenance,
    documents,
    permissions,
    inspectionOutcomeOptions,
    maintenanceTypeOptions,
    documentTypeOptions,
    users,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [inspectionOpen, setInspectionOpen] = useState(false);
    const [maintenanceOpen, setMaintenanceOpen] = useState(false);
    const [documentOpen, setDocumentOpen] = useState(false);

    return (
        <>
            <Head title={`${asset.name} — Equipment`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={asset.name}
                    description={`${asset.equipment_id} · ${siteName}`}
                >
                    <div className="flex flex-wrap gap-2">
                        <Link href={equipmentAssetsIndex()} className="text-sm text-primary hover:underline">
                            Back to registry
                        </Link>
                        <Button size="sm" variant="outline" asChild>
                            <a href={`/iot/equipment/${asset.id}/print-label`}>Print QR label (ZPL)</a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                            <a href={asset.scan_url} target="_blank" rel="noreferrer">
                                Preview scan page
                            </a>
                        </Button>
                    </div>
                </ConceptPageHeader>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <IotMiniStat label="Type" value={formatHumanLabel(asset.equipment_type)} />
                    <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-muted/20 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Status
                        </p>
                        <div className="mt-1">
                            <IotHealthBadge status={asset.status} />
                        </div>
                    </div>
                    <IotMiniStat label="QR slug" value={asset.qr_slug} sub="Scan identifier" />
                    <IotMiniStat
                        label="Registered"
                        value={asset.registered_at ? <IotRelativeTime iso={asset.registered_at} /> : '—'}
                        sub={asset.location_note ?? 'No location note'}
                    />
                </div>

                {(asset.manufacturer || asset.model || asset.serial_number) && (
                    <ConceptTableCard className="mt-6">
                        <div className="border-b p-4">
                            <h2 className="font-semibold">Asset details</h2>
                        </div>
                        <dl className="grid gap-2 p-4 text-sm sm:grid-cols-3">
                            <div><dt className="text-muted-foreground">Manufacturer</dt><dd>{asset.manufacturer ?? '—'}</dd></div>
                            <div><dt className="text-muted-foreground">Model</dt><dd>{asset.model ?? '—'}</dd></div>
                            <div><dt className="text-muted-foreground">Serial</dt><dd>{asset.serial_number ?? '—'}</dd></div>
                        </dl>
                    </ConceptTableCard>
                )}

                <ConceptTableCard className="mt-6">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Inspection records</h2>
                        {permissions.canManage ? (
                            <Dialog open={inspectionOpen} onOpenChange={setInspectionOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="mr-1 size-4" />Add inspection</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Record inspection</DialogTitle></DialogHeader>
                                    <Form
                                        {...EquipmentController.storeInspection.form({ asset: asset.id })}
                                        onSuccess={() => setInspectionOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="inspected-at">Date</Label>
                                                    <Input id="inspected-at" name="inspected_at" type="date" required />
                                                    <InputError message={errors.inspected_at} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="inspector">Inspector</Label>
                                                    <EnumSelect
                                                        id="inspector"
                                                        name="inspector_name"
                                                        options={users.map((u) => ({ value: u.name, label: u.name }))}
                                                        required
                                                    />
                                                    <InputError message={errors.inspector_name} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="outcome">Outcome</Label>
                                                    <EnumSelect
                                                        id="outcome"
                                                        name="outcome"
                                                        options={inspectionOutcomeOptions}
                                                        defaultValue="pass"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="next-inspection">Next due</Label>
                                                    <Input id="next-inspection" name="next_inspection_due" type="date" />
                                                </div>
                                                <Button type="submit" disabled={processing}>Save</Button>
                                            </div>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        ) : null}
                    </div>
                    {inspections.length === 0 ? (
                        <IotEmptyState message="No inspections recorded" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Inspector</TableHead>
                                    <TableHead>Outcome</TableHead>
                                    <TableHead>Next due</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inspections.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="text-sm">
                                            <IotRelativeTime iso={row.inspected_at} />
                                        </TableCell>
                                        <TableCell className="text-sm">{row.inspector_name}</TableCell>
                                        <TableCell>
                                            <IotHealthBadge status={row.outcome} />
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {row.next_inspection_due ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ConceptTableCard>

                <ConceptTableCard className="mt-6">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Maintenance history</h2>
                        {permissions.canManage ? (
                            <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="mr-1 size-4" />Add maintenance</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Record maintenance</DialogTitle></DialogHeader>
                                    <Form
                                        {...EquipmentController.storeMaintenance.form({ asset: asset.id })}
                                        onSuccess={() => setMaintenanceOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="performed-at">Date</Label>
                                                    <Input id="performed-at" name="performed_at" type="date" required />
                                                    <InputError message={errors.performed_at} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="maint-type">Type</Label>
                                                    <EnumSelect
                                                        id="maint-type"
                                                        name="maintenance_type"
                                                        options={maintenanceTypeOptions}
                                                        defaultValue="preventive"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="description">Description</Label>
                                                    <Input id="description" name="description" required />
                                                    <InputError message={errors.description} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="performed-by">Performed by</Label>
                                                    <EnumSelect
                                                        id="performed-by"
                                                        name="performed_by"
                                                        options={users.map((u) => ({ value: u.name, label: u.name }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="next-service">Next service due</Label>
                                                    <Input id="next-service" name="next_service_due" type="date" />
                                                </div>
                                                <Button type="submit" disabled={processing}>Save</Button>
                                            </div>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        ) : null}
                    </div>
                    {maintenance.length === 0 ? (
                        <IotEmptyState message="No maintenance records" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Next service</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {maintenance.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="text-sm">
                                            <IotRelativeTime iso={row.performed_at} />
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatHumanLabel(row.maintenance_type)}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm">
                                            {row.description}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {row.next_service_due ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ConceptTableCard>

                <ConceptTableCard className="mt-6">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Manuals & documents</h2>
                        {permissions.canManage ? (
                            <Dialog open={documentOpen} onOpenChange={setDocumentOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="mr-1 size-4" />Add document</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
                                    <Form
                                        {...EquipmentController.storeDocument.form({ asset: asset.id })}
                                        onSuccess={() => setDocumentOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="doc-type">Type</Label>
                                                    <EnumSelect
                                                        id="doc-type"
                                                        name="document_type"
                                                        options={documentTypeOptions}
                                                        defaultValue="manual"
                                                        required
                                                    />
                                                    <InputError message={errors.document_type} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="doc-title">Title</Label>
                                                    <Input id="doc-title" name="title" required />
                                                    <InputError message={errors.title} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="doc-file">File (PDF or image)</Label>
                                                    <Input id="doc-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                                                    <InputError message={errors.file} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="doc-url">Or external URL</Label>
                                                    <Input id="doc-url" name="external_url" type="url" placeholder="https://…" />
                                                    <InputError message={errors.external_url} />
                                                </div>
                                                <Button type="submit" disabled={processing}>Upload</Button>
                                            </div>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        ) : null}
                    </div>
                    {documents.length === 0 ? (
                        <IotEmptyState message="No documents attached" />
                    ) : (
                        <ul className="divide-y">
                            {documents.map((doc) => (
                                <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    <div>
                                        <p className="font-medium">{doc.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatHumanLabel(doc.document_type)} ·{' '}
                                            <IotRelativeTime iso={doc.uploaded_at} />
                                        </p>
                                    </div>
                                    {doc.external_url ? (
                                        <a
                                            href={doc.external_url}
                                            className="shrink-0 text-xs text-primary hover:underline"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open
                                        </a>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

EquipmentShow.layout = () => ({
    breadcrumbs: [
        { title: 'Equipment', href: equipmentAssetsIndex() },
        { title: 'Asset detail', href: '#' },
    ],
});
