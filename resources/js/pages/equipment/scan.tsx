import { Head } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptSummaryGrid, ConceptTableCard } from '@/components/concepts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Props = {
    asset: {
        equipment_id: string;
        name: string;
        equipment_type: string;
        status: string;
        manufacturer: string | null;
        model: string | null;
        serial_number: string | null;
        location_note: string | null;
        registered_at: string | null;
    };
    site: { name: string; code: string | null };
    inspections: { inspected_at: string; inspector_name: string; outcome: string }[];
    maintenance: { performed_at: string; maintenance_type: string; description: string; next_service_due?: string | null }[];
    documents: { title: string; document_type: string; external_url: string | null }[];
    next_inspection_due: string | null;
    next_service_due: string | null;
};

export default function EquipmentScan({ asset, site, inspections, maintenance, documents, next_inspection_due, next_service_due }: Props) {
    return (
        <>
            <Head title={asset.name} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={asset.name}
                    description={`${site.name}${site.code ? ` · ${site.code}` : ''} · Scan via site WiFi (no app required)`}
                />
                <ConceptSummaryGrid
                    items={[
                        { label: 'Equipment ID', value: asset.equipment_id },
                        { label: 'Type', value: asset.equipment_type },
                        { label: 'Status', value: asset.status },
                        { label: 'Location', value: asset.location_note ?? '—' },
                    ]}
                />

                {(next_inspection_due || next_service_due) && (
                    <ConceptSummaryGrid
                        className="mt-4"
                        items={[
                            { label: 'Next inspection due', value: next_inspection_due ?? '—' },
                            { label: 'Next service due', value: next_service_due ?? '—' },
                        ]}
                    />
                )}

                {(asset.manufacturer || asset.model || asset.serial_number) && (
                    <ConceptTableCard className="mt-6">
                        <div className="border-b p-4"><h2 className="font-semibold">Asset details</h2></div>
                        <dl className="grid gap-2 p-4 text-sm sm:grid-cols-3">
                            <div><dt className="text-muted-foreground">Manufacturer</dt><dd>{asset.manufacturer ?? '—'}</dd></div>
                            <div><dt className="text-muted-foreground">Model</dt><dd>{asset.model ?? '—'}</dd></div>
                            <div><dt className="text-muted-foreground">Serial</dt><dd>{asset.serial_number ?? '—'}</dd></div>
                        </dl>
                    </ConceptTableCard>
                )}

                {documents.length > 0 ? (
                    <ConceptTableCard className="mt-6">
                        <div className="border-b p-4"><h2 className="font-semibold">Manuals & documents</h2></div>
                        <ul className="divide-y">
                            {documents.map((doc, i) => (
                                <li key={i} className="flex items-center justify-between p-4 text-sm">
                                    <span>{doc.title} <span className="text-muted-foreground">({doc.document_type})</span></span>
                                    {doc.external_url ? (
                                        <a href={doc.external_url} className="text-primary hover:underline" target="_blank" rel="noreferrer">Open PDF</a>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </ConceptTableCard>
                ) : null}

                <ConceptTableCard className="mb-6 mt-6">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Inspection records</h2>
                    </div>
                    {inspections.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No inspections recorded.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Inspector</TableHead>
                                    <TableHead>Outcome</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inspections.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.inspected_at}</TableCell>
                                        <TableCell>{row.inspector_name}</TableCell>
                                        <TableCell>{row.outcome}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ConceptTableCard>

                <ConceptTableCard>
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Maintenance history</h2>
                    </div>
                    {maintenance.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No maintenance records.</p>
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
                                {maintenance.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.performed_at}</TableCell>
                                        <TableCell>{row.maintenance_type}</TableCell>
                                        <TableCell>{row.description}</TableCell>
                                        <TableCell>{row.next_service_due ?? '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ConceptTableCard>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    SiteGuard equipment registry · scan logged · QR slug unchanged when record updates
                </p>
            </ConceptPageShell>
        </>
    );
}
