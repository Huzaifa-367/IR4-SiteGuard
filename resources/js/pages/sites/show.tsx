import { Form, Head, Link, router } from '@inertiajs/react';
import { KeyRound, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import SiteFormDialog, { type SiteFormValues } from '@/components/siteguard/site-form-dialog';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptSummaryGrid,
    ConceptTableCard,
} from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
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
import { usePermissions } from '@/hooks/use-permissions';
import { index as zonesIndex } from '@/routes/cameras/zones';
import { destroy as revokeIngestToken, store as issueIngestToken } from '@/routes/cameras/ingest-token';
import { index as sitesIndex, show as siteShow } from '@/routes/sites';
import { store as storeCamera } from '@/routes/sites/cameras';

type SiteDetail = {
    id: number;
    name: string;
    code: string | null;
    timezone: string;
    address: string | null;
    status: string;
    cameras_count: number;
    locations_count: number;
    alerts_count: number;
};

type DetectionModuleOption = {
    id: number;
    name: string;
    key: string;
};

type CameraRow = {
    id: number;
    name: string;
    code: string | null;
    module: string | null;
    health_status: string;
    last_ingest_at: string | null;
    is_active: boolean;
    ingest_token: {
        prefix: string;
        revoked: boolean;
        last_used_at: string | null;
    } | null;
};

type SiteShowProps = {
    site: SiteDetail;
    cameras: CameraRow[];
    detectionModules: DetectionModuleOption[];
    ingestTokenPlain: string | null;
    timezones: string[];
    openEditDialog?: boolean;
    permissions: {
        canUpdateSite: boolean;
        canCreateCamera: boolean;
        canManageTokens: boolean;
    };
};

export default function SiteShow({
    site,
    cameras,
    detectionModules,
    ingestTokenPlain,
    timezones,
    openEditDialog = false,
    permissions,
}: SiteShowProps) {
    const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(openEditDialog);
    const { can } = usePermissions();

    useEffect(() => {
        if (openEditDialog) {
            setEditDialogOpen(true);
        }
    }, [openEditDialog]);

    const siteFormValues: SiteFormValues = {
        id: site.id,
        name: site.name,
        code: site.code,
        timezone: site.timezone,
        address: site.address,
        status: site.status,
    };

    return (
        <>
            <Head title={site.name} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={site.name}
                    description={site.address ?? site.code ?? 'Site detail'}
                >
                    {permissions.canUpdateSite ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditDialogOpen(true)}
                        >
                            <Pencil className="mr-1 size-4" />
                            Edit site
                        </Button>
                    ) : null}
                </ConceptPageHeader>

                {ingestTokenPlain ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
                        <p className="font-medium text-amber-900 dark:text-amber-100">
                            New ingest token (copy now — shown once)
                        </p>
                        <code className="mt-2 block break-all rounded bg-white/80 px-2 py-1 text-xs dark:bg-black/30">
                            {ingestTokenPlain}
                        </code>
                    </div>
                ) : null}

                <ConceptSummaryGrid
                    items={[
                        { label: 'Timezone', value: site.timezone },
                        { label: 'Cameras', value: site.cameras_count },
                        { label: 'Locations', value: site.locations_count },
                        { label: 'Open alerts', value: site.alerts_count },
                    ]}
                />

                <ConceptTableCard
                    title="Cameras"
                    description="Registered cameras and Python ingest tokens."
                >
                    {permissions.canCreateCamera && detectionModules.length > 0 ? (
                        <div className="border-b border-border/60 px-4 py-3">
                            <Dialog
                                open={cameraDialogOpen}
                                onOpenChange={setCameraDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="mr-1 size-4" />
                                        Add camera
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add camera</DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        {...storeCamera.form({ site: site.id })}
                                        onSuccess={() =>
                                            setCameraDialogOpen(false)
                                        }
                                        className="grid gap-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="detection_module_id">
                                                        Module
                                                    </Label>
                                                    <select
                                                        id="detection_module_id"
                                                        name="detection_module_id"
                                                        required
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                                    >
                                                        {detectionModules.map(
                                                            (mod) => (
                                                                <option
                                                                    key={mod.id}
                                                                    value={
                                                                        mod.id
                                                                    }
                                                                >
                                                                    {mod.name}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <InputError
                                                        message={
                                                            errors.detection_module_id
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="camera_name">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="camera_name"
                                                        name="name"
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.name}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="camera_code">
                                                        Code
                                                    </Label>
                                                    <Input
                                                        id="camera_code"
                                                        name="code"
                                                    />
                                                    <InputError
                                                        message={errors.code}
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Add camera
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : null}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>Health</TableHead>
                                <TableHead>Ingest token</TableHead>
                                <TableHead>Last ingest</TableHead>
                                {can('zones.manage') ? <TableHead>Zones</TableHead> : null}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cameras.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={can('zones.manage') ? 6 : 5}
                                        className="text-muted-foreground"
                                    >
                                        No cameras on this site.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cameras.map((camera) => (
                                    <TableRow key={camera.id}>
                                        <TableCell className="font-medium">
                                            {camera.name}
                                            {camera.code ? (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {camera.code}
                                                </span>
                                            ) : null}
                                        </TableCell>
                                        <TableCell>
                                            {camera.module ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <ConceptStatusBadge
                                                tone={
                                                    camera.health_status ===
                                                    'online'
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                            >
                                                {camera.health_status}
                                            </ConceptStatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <CameraTokenActions
                                                camera={camera}
                                                canManage={
                                                    permissions.canManageTokens
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {camera.last_ingest_at ?? 'Never'}
                                        </TableCell>
                                        {can('zones.manage') ? (
                                            <TableCell>
                                                <Link
                                                    href={zonesIndex({ camera: camera.id })}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    Zones
                                                </Link>
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
            {permissions.canUpdateSite ? (
                <SiteFormDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    timezones={timezones}
                    site={siteFormValues}
                />
            ) : null}
        </>
    );
}

function CameraTokenActions({
    camera,
    canManage,
}: {
    camera: CameraRow;
    canManage: boolean;
}) {
    if (!canManage) {
        return camera.ingest_token && !camera.ingest_token.revoked
            ? `${camera.ingest_token.prefix}…`
            : '—';
    }

    const hasActiveToken =
        camera.ingest_token !== null && !camera.ingest_token.revoked;

    return (
        <div className="flex flex-wrap gap-1">
            {hasActiveToken ? (
                <span className="text-xs text-muted-foreground">
                    {camera.ingest_token?.prefix}…
                </span>
            ) : null}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                    router.post(issueIngestToken.url({ camera: camera.id }))
                }
            >
                <KeyRound className="mr-1 size-3" />
                {hasActiveToken ? 'Rotate' : 'Issue'}
            </Button>
            {hasActiveToken ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        router.delete(
                            revokeIngestToken.url({ camera: camera.id }),
                        )
                    }
                >
                    Revoke
                </Button>
            ) : null}
        </div>
    );
}

SiteShow.layout = (props: SiteShowProps) => ({
    breadcrumbs: [
        { title: 'Sites', href: sitesIndex() },
        { title: props.site.name, href: siteShow(props.site.id) },
    ],
});
