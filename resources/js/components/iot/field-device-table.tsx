import { Form } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { ConceptPagination, ConceptTableCard } from '@/components/concepts';
import type { Paginator } from '@/types/pagination';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import FieldDeviceController from '@/actions/App/Http/Controllers/FieldDeviceController';

export type IngestToken = {
    prefix: string;
    revoked: boolean;
    last_used_at: string | null;
} | null;

export type DeviceRow = {
    id: number;
    name: string;
    code: string;
    health_status: string;
    ingest_token: IngestToken;
    token_type: string;
    last_heartbeat_at?: string | null;
    last_ingest_at?: string | null;
    mount_type?: string;
    zone?: string | null;
    vehicle_label?: string | null;
    device_type?: string;
};

export function TokenCell({
    device,
    canManageTokens,
}: {
    device: DeviceRow;
    canManageTokens: boolean;
}) {
    if (!canManageTokens) {
        return device.ingest_token ? (
            <span className="font-mono text-xs">{device.ingest_token.prefix}…</span>
        ) : (
            <span className="text-muted-foreground">—</span>
        );
    }

    return (
        <Form
            {...FieldDeviceController.issueToken.form({
                type: device.token_type,
                id: device.id,
            })}
        >
            {({ processing }) => (
                <Button type="submit" size="sm" variant="outline" disabled={processing}>
                    <KeyRound className="mr-1 size-3.5" />
                    {device.ingest_token ? 'Rotate' : 'Issue'}
                </Button>
            )}
        </Form>
    );
}

export function DeviceTableSection({
    title,
    description,
    devices,
    addDialog,
    columns,
    renderRow,
}: {
    title: string;
    description: string;
    devices: Paginator<DeviceRow>;
    addDialog?: ReactNode;
    columns: string[];
    renderRow: (device: DeviceRow) => ReactNode;
}) {
    return (
        <ConceptTableCard className="mb-6">
            <div className="flex items-start justify-between gap-4 border-b p-4">
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {description}
                        {devices.total > 0 ? ` · ${devices.total.toLocaleString()} total` : ''}
                    </p>
                </div>
                {addDialog}
            </div>
            {devices.data.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No devices registered yet.</p>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableHead key={col}>{col}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {devices.data.map((d) => (
                                <TableRow key={d.id}>{renderRow(d)}</TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="px-4 pb-4">
                        <ConceptPagination links={devices.links} />
                    </div>
                </>
            )}
        </ConceptTableCard>
    );
}
