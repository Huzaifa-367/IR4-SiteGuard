import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { IotModuleSection, IotViewLink } from '@/components/iot/iot-module-layout';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
    TimeRangeSelect,
    type TimeRangeFilters,
} from '@/components/concepts';
import type { Paginator } from '@/types/pagination';
import { IotSectionTabs } from '@/components/iot/iot-ui';
import { EnumSelect } from '@/components/siteguard/enum-select';
import { show as deploymentApprovalShow } from '@/routes/iot/deployment-approvals';
import { HorizontalCategoryChart, IotKpiStrip } from '@/components/iot/iot-charts';
import { IotEmptyState, IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import DeploymentApprovalController from '@/actions/App/Http/Controllers/DeploymentApprovalController';
import { index as deploymentApprovalsIndex } from '@/routes/iot/deployment-approvals';

type ApprovalRow = {
    id: number;
    approval_type: string;
    status: string;
    submitted_at: string | null;
    approved_at: string | null;
    notes: string | null;
};

type Props = {
    site: { id: number; name: string };
    approvals: Paginator<ApprovalRow>;
    filters: TimeRangeFilters;
    summary: { total: number; submitted: number; approved: number };
    analytics: { byStatus: { label: string; count: number }[]; byType: { label: string; count: number }[] };
    commissioning_gate: string;
    approval_types: { value: string; label: string }[];
};

export default function DeploymentApprovals({
    site,
    approvals,
    filters,
    summary,
    analytics,
    commissioning_gate,
    approval_types,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    const [tab, setTab] = useState('overview');

    return (
        <>
            <Head title={`Deployment approvals — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="SA deployment approvals"
                    description={`${summary.total.toLocaleString()} in ${filters.label.toLowerCase()} · ${siteName}`}
                >
                    <TimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <IotKpiStrip
                    className="mb-4"
                    kpis={[
                        { key: 'register', label: 'Register', value: summary.total, hint: 'All submissions' },
                        { key: 'submitted', label: 'Submitted', value: summary.submitted, hint: 'Awaiting review' },
                        { key: 'approved', label: 'Approved', value: summary.approved, hint: 'Signed off' },
                        {
                            key: 'gate',
                            label: 'Gate',
                            value: formatHumanLabel(commissioning_gate),
                            hint: 'CCTV GI commissioning',
                        },
                    ]}
                />

                <IotSectionTabs
                    className="mb-4"
                    active={tab}
                    onChange={setTab}
                    items={[
                        { key: 'overview', label: 'Overview' },
                        { key: 'register', label: 'Register', count: summary.total },
                        { key: 'submit', label: 'Submit new' },
                    ]}
                />

                {tab === 'overview' && analytics.byType.length > 0 ? (
                    <IotModuleSection title="Submission analytics" description="Approvals by type and status">
                        <div className="grid gap-3 lg:grid-cols-2">
                            <HorizontalCategoryChart
                                title="By approval type"
                                data={analytics.byType.map((row) => ({
                                    ...row,
                                    label: formatHumanLabel(row.label),
                                }))}
                                valueLabel="Submissions"
                            />
                            {analytics.byStatus.length > 0 ? (
                                <HorizontalCategoryChart
                                    title="By status"
                                    data={analytics.byStatus.map((row) => ({
                                        ...row,
                                        label: formatHumanLabel(row.label),
                                    }))}
                                    valueLabel="Records"
                                />
                            ) : null}
                        </div>
                    </IotModuleSection>
                ) : null}

                {tab === 'submit' ? (
                <ConceptTableCard className="mb-4">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">Submit approval</h2>
                        <p className="text-xs text-muted-foreground">
                            Photography, CCTV GI, portable devices, placement plan (IR4 §18)
                        </p>
                    </div>
                    <Form {...DeploymentApprovalController.store.form()} className="space-y-3 p-4">
                        {({ processing, errors }) => (
                            <>
                                <div>
                                    <Label htmlFor="approval-type">Approval type</Label>
                                    <EnumSelect
                                        id="approval-type"
                                        name="approval_type"
                                        options={approval_types}
                                        defaultValue={approval_types[0]?.value}
                                        required
                                    />
                                    <InputError message={errors.approval_type} />
                                </div>
                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input id="notes" name="notes" />
                                    <InputError message={errors.notes} />
                                </div>
                                <div>
                                    <Label htmlFor="document">Supporting document</Label>
                                    <Input id="document" name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                                    <InputError message={errors.document} />
                                </div>
                                <Button type="submit" disabled={processing} size="sm">
                                    Submit
                                </Button>
                            </>
                        )}
                    </Form>
                </ConceptTableCard>
                ) : null}

                {tab === 'register' ? (
                <ConceptTableCard>
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">Approval register</h2>
                        <p className="text-xs text-muted-foreground">{summary.total.toLocaleString()} records</p>
                    </div>
                    {approvals.data.length === 0 ? (
                        <IotEmptyState message="No deployment approvals submitted yet" />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Approved</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvals.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="text-sm">
                                                {formatHumanLabel(row.approval_type)}
                                            </TableCell>
                                            <TableCell>
                                                <IotHealthBadge status={row.status} />
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <IotRelativeTime iso={row.submitted_at} />
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <IotRelativeTime iso={row.approved_at} />
                                            </TableCell>
                                            <TableCell className="max-w-[12rem] truncate text-sm text-muted-foreground">
                                                {row.notes ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <IotViewLink href={deploymentApprovalShow(row.id)} />
                                                    {row.status === 'submitted' ? (
                                                        <Form
                                                            {...DeploymentApprovalController.approve.form({
                                                                approval: row.id,
                                                            })}
                                                        >
                                                            {({ processing }) => (
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={processing}
                                                                >
                                                                    Approve
                                                                </Button>
                                                            )}
                                                        </Form>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <div className="px-4 pb-4">
                        <ConceptPagination links={approvals.links} />
                    </div>
                </ConceptTableCard>
                ) : null}
            </ConceptPageShell>
        </>
    );
}

DeploymentApprovals.layout = () => ({
    breadcrumbs: [{ title: 'Deployment approvals', href: deploymentApprovalsIndex() }],
});
