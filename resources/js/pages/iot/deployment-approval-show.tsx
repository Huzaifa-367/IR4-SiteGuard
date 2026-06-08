import { Form, Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import {
    IotDetailStat,
    IotDetailStatGrid,
    IotModuleSection,
} from '@/components/iot/iot-module-layout';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { Button } from '@/components/ui/button';
import { useSiteContext } from '@/hooks/use-site-context';
import DeploymentApprovalController from '@/actions/App/Http/Controllers/DeploymentApprovalController';
import {
    index as deploymentApprovalsIndex,
    show as deploymentApprovalShow,
} from '@/routes/iot/deployment-approvals';

type Props = {
    site: { id: number; name: string };
    approval: {
        id: number;
        approval_type: string;
        approval_type_label: string;
        status: string;
        submitted_at: string | null;
        approved_at: string | null;
        notes: string | null;
        has_document: boolean;
    };
    submittedBy: { name: string } | null;
    approvedBy: { name: string } | null;
    commissioning_gate: string;
    permissions: { canApprove: boolean };
};

export default function DeploymentApprovalShow({
    site,
    approval,
    submittedBy,
    approvedBy,
    commissioning_gate,
    permissions,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const isPending = approval.status === 'submitted';

    return (
        <>
            <Head title={`${approval.approval_type_label} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={approval.approval_type_label}
                    description={`${formatHumanLabel(approval.status)} · Commissioning gate: ${formatHumanLabel(commissioning_gate)}`}
                >
                    <div className="flex items-center gap-3">
                        {permissions.canApprove && isPending ? (
                            <Form {...DeploymentApprovalController.approve.form({ approval: approval.id })}>
                                {({ processing }) => (
                                    <Button type="submit" size="sm" disabled={processing}>
                                        Approve submission
                                    </Button>
                                )}
                            </Form>
                        ) : null}
                        <Link href={deploymentApprovalsIndex()} className="text-sm text-primary hover:underline">
                            Back to register
                        </Link>
                    </div>
                </ConceptPageHeader>

                <IotDetailStatGrid className="mb-4">
                    <IotDetailStat
                        label="Status"
                        value={<IotHealthBadge status={approval.status} />}
                    />
                    <IotDetailStat
                        label="Submitted"
                        value={approval.submitted_at ? <IotRelativeTime iso={approval.submitted_at} /> : '—'}
                        sub={submittedBy?.name}
                    />
                    <IotDetailStat
                        label="Approved"
                        value={approval.approved_at ? <IotRelativeTime iso={approval.approved_at} /> : '—'}
                        sub={approvedBy?.name}
                    />
                    <IotDetailStat
                        label="Document"
                        value={approval.has_document ? 'Attached' : 'None'}
                    />
                </IotDetailStatGrid>

                <IotModuleSection title="Submission notes" description="SA representative comments and evidence">
                    <div className="rounded-lg border border-border/80 bg-card p-4 text-sm">
                        {approval.notes ? approval.notes : (
                            <p className="text-muted-foreground">No notes provided with this submission.</p>
                        )}
                    </div>
                </IotModuleSection>
            </ConceptPageShell>
        </>
    );
}

DeploymentApprovalShow.layout = (page: { props: Props }) => ({
    breadcrumbs: [
        { title: 'Deployment approvals', href: deploymentApprovalsIndex() },
        {
            title: page.props.approval.approval_type_label,
            href: deploymentApprovalShow(page.props.approval.id),
        },
    ],
});
