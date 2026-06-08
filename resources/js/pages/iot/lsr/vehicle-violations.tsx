import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
} from '@/components/concepts';
import { IotTimeRangeSelect, type IotTimeRangeFilters } from '@/components/iot/iot-time-range-select';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';
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
import LsrViolationController from '@/actions/App/Http/Controllers/LsrViolationController';
import { overview as lsrOverview } from '@/routes/iot/lsr';
import {
    index as vehicleViolationsIndex,
    show as vehicleViolationShow,
} from '@/routes/iot/lsr/vehicle-violations';
import { IotViewLink } from '@/components/iot/iot-module-layout';
import { IotRelativeTime } from '@/components/iot/iot-ui';

type VehicleViolationRow = {
    id: number;
    vehicle_description: string;
    violation_type: string;
    description: string;
    actions_taken: string;
    occurred_at: string;
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
    vehicleViolations: Paginator<VehicleViolationRow>;
    filters: IotTimeRangeFilters;
    vehicleViolationTypes: EnumOption[];
    permissions: { canLogVehicle: boolean };
};

export default function LsrVehicleViolations({
    site,
    vehicleViolations,
    filters,
    vehicleViolationTypes,
    permissions,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [vehicleOpen, setVehicleOpen] = useState(false);

    return (
        <>
            <Head title={`Vehicle violations — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Vehicle violations"
                    description={`${vehicleViolations.total.toLocaleString()} records in ${filters.label.toLowerCase()} — ${siteName}`}
                >
                    <IotTimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <ConceptTableCard>
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Vehicle violations (UDPM §vii)</h2>
                        {permissions.canLogVehicle ? (
                            <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        Log vehicle violation
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Vehicle violation</DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        {...LsrViolationController.storeVehicle.form()}
                                        onSuccess={() => setVehicleOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="vehicle-desc">Vehicle</Label>
                                                    <Input id="vehicle-desc" name="vehicle_description" required />
                                                    <InputError message={errors.vehicle_description} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="violation-type">Violation type</Label>
                                                    <EnumSelect
                                                        id="violation-type"
                                                        name="violation_type"
                                                        options={vehicleViolationTypes}
                                                        required
                                                    />
                                                    <InputError message={errors.violation_type} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="vehicle-occurred">Occurred at</Label>
                                                    <Input
                                                        id="vehicle-occurred"
                                                        name="occurred_at"
                                                        type="datetime-local"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="vehicle-description">Description</Label>
                                                    <Input id="vehicle-description" name="description" required />
                                                </div>
                                                <div>
                                                    <Label htmlFor="vehicle-actions">Actions taken</Label>
                                                    <Input id="vehicle-actions" name="actions_taken" required />
                                                </div>
                                                <Button type="submit" disabled={processing}>
                                                    Log
                                                </Button>
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
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Actions</TableHead>
                                <TableHead>Occurred</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicleViolations.data.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell>
                                        <Link
                                            href={vehicleViolationShow(v.id)}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {v.vehicle_description}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{v.violation_type.replace(/_/g, ' ')}</TableCell>
                                    <TableCell className="max-w-xs truncate">{v.description}</TableCell>
                                    <TableCell className="max-w-xs truncate">{v.actions_taken}</TableCell>
                                    <TableCell>
                                        <IotRelativeTime iso={v.occurred_at} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <IotViewLink href={vehicleViolationShow(v.id)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="px-4 pb-4">
                        <ConceptPagination links={vehicleViolations.links} />
                    </div>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

LsrVehicleViolations.layout = () => ({
    breadcrumbs: [
        { title: 'LSR log', href: lsrOverview() },
        { title: 'Vehicle violations', href: vehicleViolationsIndex() },
    ],
});
