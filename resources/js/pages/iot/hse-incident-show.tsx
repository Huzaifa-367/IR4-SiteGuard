import { Form, Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';
import { IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSiteContext } from '@/hooks/use-site-context';
import HseIncidentController from '@/actions/App/Http/Controllers/HseIncidentController';
import { show as alertShow } from '@/routes/alerts';
import { index as hseRegisterIndex } from '@/routes/iot/hse-incidents/register';
import { show as zoneShow } from '@/routes/iot/rfid/zones';

type LinkedAlert = {
    id: number;
    title: string;
    severity: string;
    status: string;
    opened_at: string | null;
};

type Props = {
    site: { id: number; name: string };
    incident: {
        id: number;
        incident_number: string;
        status: string;
        severity: string | null;
        incident_type: string | null;
        occurred_at: string;
        classification: Record<string, string> | null;
        workers_involved: { name?: string; contractor?: string; role?: string }[] | null;
    };
    linkedAlerts: LinkedAlert[];
    camera: { id: number; name: string } | null;
    rfidZone: { id: number; name: string; code: string } | null;
    incidentTypeOptions: EnumOption[];
    severityOptions: EnumOption[];
    rootCauseOptions: EnumOption[];
    permissions: { canClassify: boolean };
};

const CLASSIFICATION_FIELDS = [
    ['nature_of_incident', 'Nature of incident'],
    ['immediate_action_taken', 'Immediate action taken'],
    ['corrective_action', 'Corrective action'],
    ['actions_taken', 'Actions taken (UDPM)'],
] as const;

export default function HseIncidentShow({
    site,
    incident,
    linkedAlerts,
    camera,
    rfidZone,
    incidentTypeOptions,
    severityOptions,
    rootCauseOptions,
    permissions,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const isClassified = incident.status === 'classified';
    const draftTitle = incident.classification?.draft_title;

    return (
        <>
            <Head title={`${incident.incident_number} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={incident.incident_number}
                    description={`${formatHumanLabel(incident.status)} · ${siteName} · ${formatHumanLabel(incident.incident_type ?? 'untyped')}`}
                >
                    <Link href={hseRegisterIndex()} className="text-sm text-primary hover:underline">
                        Back to incidents
                    </Link>
                </ConceptPageHeader>

                <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border px-3 py-2.5 text-sm">
                        <p className="text-[11px] text-muted-foreground">Occurred</p>
                        <IotRelativeTime iso={incident.occurred_at} />
                    </div>
                    <div className="rounded-lg border px-3 py-2.5 text-sm">
                        <p className="text-[11px] text-muted-foreground">Severity</p>
                        <p>{incident.severity ? formatHumanLabel(incident.severity) : 'Pending'}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2.5 text-sm">
                        <p className="text-[11px] text-muted-foreground">Linked alerts</p>
                        <p className="font-medium tabular-nums">{linkedAlerts.length}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2.5 text-sm">
                        <p className="text-[11px] text-muted-foreground">Zone / camera</p>
                        <p className="truncate">
                            {rfidZone?.name ?? camera?.name ?? '—'}
                        </p>
                    </div>
                </div>

                {linkedAlerts.length > 0 || rfidZone ? (
                    <ConceptTableCard className="mb-4">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Traceability</h2>
                        </div>
                        <div className="space-y-3 p-4 text-sm">
                            {linkedAlerts.length > 0 ? (
                                <ul className="space-y-2">
                                    {linkedAlerts.map((alert) => (
                                        <li key={alert.id} className="flex flex-wrap items-center gap-2">
                                            <Link href={alertShow(alert.id)} className="font-medium text-primary hover:underline">
                                                {alert.title}
                                            </Link>
                                            <ConceptStatusBadge tone={alert.severity === 'critical' ? 'danger' : 'warning'}>
                                                {alert.severity}
                                            </ConceptStatusBadge>
                                            <span className="text-muted-foreground">
                                                <IotRelativeTime iso={alert.opened_at} />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                            {rfidZone ? (
                                <p className="text-muted-foreground">
                                    RFID zone:{' '}
                                    <Link href={zoneShow(rfidZone.id)} className="text-primary hover:underline">
                                        {rfidZone.name} ({rfidZone.code})
                                    </Link>
                                </p>
                            ) : null}
                        </div>
                    </ConceptTableCard>
                ) : null}

                {!isClassified && permissions.canClassify ? (
                    <ConceptTableCard className="mb-4">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Classify incident</h2>
                            {draftTitle ? (
                                <p className="text-xs text-muted-foreground">{draftTitle}</p>
                            ) : null}
                        </div>
                        <Form
                            {...HseIncidentController.classify.form({ incident: incident.id })}
                            className="space-y-3 p-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="incident-type">Type</Label>
                                            <EnumSelect
                                                id="incident-type"
                                                name="incident_type"
                                                options={incidentTypeOptions}
                                                defaultValue={incident.incident_type ?? 'other'}
                                                required
                                            />
                                            <InputError message={errors.incident_type} />
                                        </div>
                                        <div>
                                            <Label htmlFor="severity">Severity</Label>
                                            <EnumSelect
                                                id="severity"
                                                name="severity"
                                                options={severityOptions}
                                                defaultValue={incident.severity ?? 'minor'}
                                                required
                                            />
                                            <InputError message={errors.severity} />
                                        </div>
                                    </div>
                                    {CLASSIFICATION_FIELDS.map(([name, label]) => (
                                        <div key={name}>
                                            <Label htmlFor={name}>{label}</Label>
                                            <Textarea id={name} name={name} rows={2} required />
                                            <InputError message={errors[name]} />
                                        </div>
                                    ))}
                                    <div>
                                        <Label htmlFor="root_cause_category">Root cause category</Label>
                                        <EnumSelect
                                            id="root_cause_category"
                                            name="root_cause_category"
                                            options={rootCauseOptions}
                                            required
                                        />
                                        <InputError message={errors.root_cause_category} />
                                    </div>
                                    <Button type="submit" disabled={processing} size="sm">
                                        Submit classification
                                    </Button>
                                </>
                            )}
                        </Form>
                    </ConceptTableCard>
                ) : null}

                {incident.workers_involved && incident.workers_involved.length > 0 ? (
                    <ConceptTableCard className="mb-4">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Workers involved</h2>
                        </div>
                        <ul className="divide-y text-sm">
                            {incident.workers_involved.map((worker, index) => (
                                <li key={index} className="px-4 py-2.5">
                                    <p className="font-medium">{worker.name ?? 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {[worker.contractor, worker.role].filter(Boolean).join(' · ')}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </ConceptTableCard>
                ) : null}

                {isClassified && incident.classification ? (
                    <ConceptTableCard>
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Classification record</h2>
                        </div>
                        <dl className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                            {Object.entries(incident.classification)
                                .filter(([key]) => key !== 'draft_title' && key !== 'correlated_stationary')
                                .map(([key, value]) => (
                                    <div key={key} className="sm:col-span-2">
                                        <dt className="text-xs font-medium text-muted-foreground">
                                            {formatHumanLabel(key)}
                                        </dt>
                                        <dd className="mt-1 whitespace-pre-wrap">{value}</dd>
                                    </div>
                                ))}
                        </dl>
                    </ConceptTableCard>
                ) : null}
            </ConceptPageShell>
        </>
    );
}

HseIncidentShow.layout = () => ({
    breadcrumbs: [
        { title: 'HSE incidents', href: hseRegisterIndex() },
        { title: 'Incident detail', href: '#' },
    ],
});
