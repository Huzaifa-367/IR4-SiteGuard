import { Form, Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { IotViewLink } from '@/components/iot/iot-module-layout';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
} from '@/components/concepts';
import { IotTimeRangeSelect, type IotTimeRangeFilters } from '@/components/iot/iot-time-range-select';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';
import InputError from '@/components/input-error';
import { show as alertShow } from '@/routes/alerts';
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
import LsrViolationController from '@/actions/App/Http/Controllers/LsrViolationController';
import { overview as lsrOverview, show as lsrShow } from '@/routes/iot/lsr';
import { index as lsrViolationsIndex } from '@/routes/iot/lsr/violations';

type ViolationRow = {
    id: number;
    lsr_category: string;
    detection_mode: string;
    description: string;
    actions_taken: string | null;
    occurred_at: string;
    alert_id: number | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    site: { id: number; name: string };
    violations: Paginator<ViolationRow>;
    filters: IotTimeRangeFilters;
    lsrCategoryOptions: EnumOption[];
    permissions: {
        canLogManual: boolean;
        canUpdateActions: boolean;
    };
};

export default function LsrViolations({ site, violations, filters, lsrCategoryOptions, permissions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [manualOpen, setManualOpen] = useState(false);

    return (
        <>
            <Head title={`LSR violations — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="LSR violations"
                    description={`${violations.total.toLocaleString()} violations in ${filters.label.toLowerCase()} — ${siteName}`}
                >
                    <IotTimeRangeSelect filters={filters} />
                    {permissions.canLogManual ? (
                        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-1 size-4" />
                                    Log manual LSR
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Manual LSR violation</DialogTitle>
                                </DialogHeader>
                                <Form
                                    {...LsrViolationController.store.form()}
                                    onSuccess={() => setManualOpen(false)}
                                >
                                    {({ processing, errors }) => (
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="lsr-category">Category</Label>
                                                <EnumSelect
                                                    id="lsr-category"
                                                    name="lsr_category"
                                                    options={lsrCategoryOptions}
                                                    required
                                                />
                                                <InputError message={errors.lsr_category} />
                                            </div>
                                            <div>
                                                <Label htmlFor="occurred-at">Occurred at</Label>
                                                <Input
                                                    id="occurred-at"
                                                    name="occurred_at"
                                                    type="datetime-local"
                                                    required
                                                />
                                                <InputError message={errors.occurred_at} />
                                            </div>
                                            <div>
                                                <Label htmlFor="description">Description</Label>
                                                <Input id="description" name="description" required />
                                                <InputError message={errors.description} />
                                            </div>
                                            <Button type="submit" disabled={processing}>
                                                Log violation
                                            </Button>
                                        </div>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    ) : null}
                </ConceptPageHeader>

                <ConceptTableCard>
                    <div className="border-b p-4">
                        <h2 className="font-semibold">LSR violations</h2>
                        <p className="text-sm text-muted-foreground">
                            Page {violations.current_page} of {violations.last_page} — open any row for traceability
                        </p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Actions</TableHead>
                                <TableHead>Occurred</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {violations.data.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell className="font-mono text-xs">
                                        {v.alert_id ? (
                                            <Link href={alertShow(v.alert_id)} className="text-primary hover:underline">
                                                {v.lsr_category}
                                            </Link>
                                        ) : (
                                            v.lsr_category
                                        )}
                                    </TableCell>
                                    <TableCell><IotHealthBadge status={v.detection_mode} /></TableCell>
                                    <TableCell>{v.description}</TableCell>
                                    <TableCell>
                                        {v.actions_taken ?? (
                                            permissions.canUpdateActions ? (
                                                <Form
                                                    {...LsrViolationController.updateActions.form({
                                                        violation: v.id,
                                                    })}
                                                >
                                                    {({ processing }) => (
                                                        <div className="flex gap-2">
                                                            <Input
                                                                name="actions_taken"
                                                                placeholder="Actions taken"
                                                                className="h-8"
                                                            />
                                                            <Button type="submit" size="sm" disabled={processing}>
                                                                Save
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Form>
                                            ) : (
                                                '—'
                                            )
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IotRelativeTime iso={v.occurred_at} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <IotViewLink href={lsrShow(v.id)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="px-4 pb-4">
                        <ConceptPagination links={violations.links} />
                    </div>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

LsrViolations.layout = () => ({
    breadcrumbs: [
        { title: 'LSR log', href: lsrOverview() },
        { title: 'Violations', href: lsrViolationsIndex() },
    ],
});
