import { Form, Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import {
    IotDetailStat,
    IotDetailStatGrid,
    IotLinkedResource,
    IotModuleSection,
} from '@/components/iot/iot-module-layout';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSiteContext } from '@/hooks/use-site-context';
import LsrViolationController from '@/actions/App/Http/Controllers/LsrViolationController';
import { show as alertShow } from '@/routes/alerts';
import { overview as lsrOverview, show as lsrShow } from '@/routes/iot/lsr';
import { overview as rfidOverview } from '@/routes/iot/rfid';

type Props = {
    site: { id: number; name: string };
    violation: {
        id: number;
        lsr_category: string;
        category_label: string;
        detection_mode: string;
        description: string;
        actions_taken: string | null;
        occurred_at: string;
    };
    alert: {
        id: number;
        title: string;
        severity: string;
        status: string;
        opened_at: string | null;
    } | null;
    camera: { id: number; name: string } | null;
    rfidZone: { id: number; name: string; code: string } | null;
    workers: { id: number; full_name: string; contractor: string; role: string }[];
    loggedBy: { name: string } | null;
    permissions: { canUpdateActions: boolean };
};

export default function LsrViolationShow({
    site,
    violation,
    alert,
    camera,
    rfidZone,
    workers,
    loggedBy,
    permissions,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`${violation.lsr_category} — LSR — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={violation.lsr_category}
                    description={`${violation.category_label} · ${formatHumanLabel(violation.detection_mode)} · ${siteName}`}
                >
                    <Link href={lsrOverview()} className="text-sm text-primary hover:underline">
                        Back to LSR log
                    </Link>
                </ConceptPageHeader>

                <IotDetailStatGrid className="mb-4">
                    <IotDetailStat
                        label="Occurred"
                        value={<IotRelativeTime iso={violation.occurred_at} />}
                    />
                    <IotDetailStat
                        label="Detection mode"
                        value={<IotHealthBadge status={violation.detection_mode} />}
                    />
                    <IotDetailStat
                        label="Category"
                        value={violation.category_label}
                        sub={violation.lsr_category}
                    />
                    <IotDetailStat
                        label="Logged by"
                        value={loggedBy?.name ?? (violation.detection_mode === 'automated' ? 'System' : '—')}
                    />
                </IotDetailStatGrid>

                <IotModuleSection title="Violation details" description="Description and UDPM follow-up actions">
                    <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                            <p className="mt-1 text-sm">{violation.description}</p>
                        </div>
                        {violation.actions_taken ? (
                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Actions taken</p>
                                <p className="mt-1 text-sm">{violation.actions_taken}</p>
                            </div>
                        ) : permissions.canUpdateActions ? (
                            <Form {...LsrViolationController.updateActions.form({ violation: violation.id })}>
                                {({ processing, errors }) => (
                                    <div className="space-y-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
                                        <p className="text-sm font-medium">Record corrective actions (UDPM §iii)</p>
                                        <div>
                                            <Label htmlFor="actions-taken">Actions taken</Label>
                                            <Textarea id="actions-taken" name="actions_taken" required rows={3} />
                                            <InputError message={errors.actions_taken} />
                                        </div>
                                        <Button type="submit" size="sm" disabled={processing}>
                                            Save actions
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        ) : (
                            <p className="text-sm text-muted-foreground">No corrective actions recorded yet.</p>
                        )}
                    </div>
                </IotModuleSection>

                <IotModuleSection
                    title="Traceability"
                    description="Linked alerts, zones, and personnel"
                    className="mt-4"
                >
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {alert ? (
                            <IotLinkedResource
                                label="Source alert"
                                href={alertShow(alert.id)}
                                hint={alert.title}
                            />
                        ) : null}
                        {rfidZone ? (
                            <IotLinkedResource
                                label="RFID zone"
                                href={rfidOverview()}
                                hint={`${rfidZone.name} (${rfidZone.code})`}
                            />
                        ) : null}
                        {camera ? (
                            <IotLinkedResource
                                label="Camera"
                                href={alert ? alertShow(alert.id) : lsrIndex()}
                                hint={camera.name}
                            />
                        ) : null}
                    </div>
                </IotModuleSection>

                {workers.length > 0 ? (
                    <ConceptTableCard className="mt-4" title="Workers involved" description="RFID-correlated personnel">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="px-4 py-2 font-medium">Name</th>
                                    <th className="px-4 py-2 font-medium">Contractor</th>
                                    <th className="px-4 py-2 font-medium">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map((w) => (
                                    <tr key={w.id} className="border-b border-border/60">
                                        <td className="px-4 py-2">{w.full_name}</td>
                                        <td className="px-4 py-2">{w.contractor}</td>
                                        <td className="px-4 py-2">{w.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ConceptTableCard>
                ) : null}
            </ConceptPageShell>
        </>
    );
}

LsrViolationShow.layout = (page: { props: Props }) => ({
    breadcrumbs: [
        { title: 'LSR log', href: lsrOverview() },
        { title: page.props.violation.lsr_category, href: lsrShow(page.props.violation.id) },
    ],
});
