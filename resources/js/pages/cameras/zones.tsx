import { Form, Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import ZoneFormDialog from '@/components/siteguard/zone-form-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as sitesIndex, show as siteShow } from '@/routes/sites';
import { destroy as destroyZone, index as zonesIndex } from '@/routes/cameras/zones';

type ZoneRow = {
    id: number;
    name: string;
    zone_type: string;
    is_active: boolean;
    polygon: { x: number; y: number }[];
    rules: string[];
};

type Props = {
    camera: {
        id: number;
        name: string;
        site_id: number;
        site_name: string | null;
        module: string | null;
    };
    zones: ZoneRow[];
    siteRules: { id: number; name: string; code: string }[];
};

export default function CameraZones({ camera, zones, siteRules }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <Head title={`Zones — ${camera.name}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Camera zones"
                    description={`${camera.name} · ${camera.module ?? 'No module'}`}
                >
                    <Button size="sm" onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-1 size-4" />
                        Add zone
                    </Button>
                </ConceptPageHeader>
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href={siteShow(camera.site_id)} className="text-primary hover:underline">
                        {camera.site_name ?? 'Site'}
                    </Link>
                    <span className="text-muted-foreground">·</span>
                    <Link href={sitesIndex()} className="text-primary hover:underline">
                        All sites
                    </Link>
                </div>
                <ConceptTableCard>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Rules</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {zones.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground">
                                        No zones defined.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                zones.map((zone) => (
                                    <TableRow key={zone.id}>
                                        <TableCell className="font-medium">{zone.name}</TableCell>
                                        <TableCell>{zone.zone_type}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {zone.rules.length > 0 ? zone.rules.join(', ') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <ConceptStatusBadge
                                                tone={zone.is_active ? 'success' : 'muted'}
                                            >
                                                {zone.is_active ? 'Active' : 'Inactive'}
                                            </ConceptStatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <Form
                                                {...destroyZone.form({
                                                    camera: camera.id,
                                                    zone: zone.id,
                                                })}
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </Form>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
            <ZoneFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                cameraId={camera.id}
                siteRules={siteRules}
            />
        </>
    );
}

CameraZones.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Sites', href: sitesIndex() },
        {
            title: props.camera.site_name ?? 'Site',
            href: siteShow(props.camera.site_id),
        },
        { title: 'Zones', href: zonesIndex({ camera: props.camera.id }) },
    ],
});
