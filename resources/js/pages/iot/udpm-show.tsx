import { Form, Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { IotKpiStrip, UdpmSectionCards } from '@/components/iot/iot-charts';
import { IotHealthBadge } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { Button } from '@/components/ui/button';
import { useSiteContext } from '@/hooks/use-site-context';
import UdpmReportController from '@/actions/App/Http/Controllers/UdpmReportController';
import { index as alertsIndex } from '@/routes/alerts';
import { overview as fieldDevicesOverview } from '@/routes/iot/field-devices';
import { overview as gasOverview } from '@/routes/iot/gas';
import { overview as hseIncidentsOverview } from '@/routes/iot/hse-incidents';
import { overview as lsrOverview } from '@/routes/iot/lsr';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as udpmIndex } from '@/routes/iot/udpm';

type Props = {
    site: { id: number; name: string };
    report: {
        id: number;
        week_start: string;
        week_end: string;
        status: string;
        generated_at: string | null;
        payload: {
            sections?: Record<string, Record<string, unknown>>;
            compliance_matrix?: Record<string, string>;
        };
        compliance_summary: Record<string, string> | null;
    };
    permissions: { canApprove: boolean; canExport: boolean };
};

const UDPM_SECTION_LINKS: Record<string, () => string> = {
    i: alertsIndex,
    ii: hseIncidentsOverview,
    iii: lsrOverview,
    iv: fieldDevicesOverview,
    v: rfidOverview,
    vi: lsrOverview,
    vii: lsrOverview,
    viii: fieldDevicesOverview,
    ix: gasOverview,
    x: fieldDevicesOverview,
};

function buildSectionSummaries(payload: Props['report']['payload']) {
    const s = payload.sections ?? {};
    const matrix = payload.compliance_matrix ?? {};

    const sections = [
        {
            key: 'i',
            title: 'Daily safety observations',
            status: matrix.i ?? 'automated',
            metrics: [
                { label: 'PPE alerts', value: (s.i_daily_safety_observations as { ppe_alert_count?: number })?.ppe_alert_count ?? 0 },
                { label: 'Days with data', value: ((s.i_daily_safety_observations as { days?: unknown[] })?.days ?? []).length },
            ],
        },
        {
            key: 'ii',
            title: 'HSE incidents',
            status: matrix.ii ?? 'auto_plus_manual',
            metrics: [
                { label: 'Classified', value: ((s.ii_hse_incidents as { classified?: unknown[] })?.classified ?? []).length },
                { label: 'Pending', value: ((s.ii_hse_incidents as { pending_classification?: unknown[] })?.pending_classification ?? []).length },
            ],
        },
        {
            key: 'iii',
            title: 'LSR violations',
            status: matrix.iii ?? 'auto_plus_manual',
            metrics: [
                { label: 'Automated', value: ((s.iii_lsr_violations as { automated?: unknown[] })?.automated ?? []).length },
                { label: 'Manual', value: ((s.iii_lsr_violations as { manual?: unknown[] })?.manual ?? []).length },
            ],
        },
        {
            key: 'iv',
            title: 'Weather conditions',
            status: matrix.iv ?? 'automated',
            metrics: [{ label: 'Parameters', value: ((s.iv_weather as { daily?: unknown[] })?.daily ?? []).length }],
        },
        {
            key: 'v',
            title: 'Site manpower',
            status: matrix.v ?? 'automated',
            metrics: [
                { label: 'On site peak', value: (s.v_manpower as { peak_on_site?: number })?.peak_on_site ?? 0 },
                { label: 'Weekly avg', value: (s.v_manpower as { weekly_avg_on_site?: number })?.weekly_avg_on_site ?? 0 },
                { label: 'Gate events', value: (s.v_manpower as { gate_events?: number })?.gate_events ?? 0 },
            ],
        },
        {
            key: 'vi',
            title: 'Vehicles monitored',
            status: matrix.vi ?? 'automated',
            metrics: [{ label: 'Count', value: (s.vi_vehicles_monitored as { count?: number })?.count ?? 0 }],
        },
        {
            key: 'vii',
            title: 'Vehicle violations',
            status: matrix.vii ?? 'manual',
            metrics: [{ label: 'Entries', value: ((s.vii_vehicle_violations as { entries?: unknown[] })?.entries ?? []).length }],
        },
        {
            key: 'viii',
            title: 'Environmental data',
            status: matrix.viii ?? 'automated',
            metrics: [{ label: 'Parameters', value: ((s.viii_environmental as { parameters?: unknown[] })?.parameters ?? []).length }],
        },
        {
            key: 'ix',
            title: 'Gas monitoring',
            status: matrix.ix ?? 'automated',
            metrics: [
                { label: 'Gateways', value: ((s.ix_gas as { by_gateway?: unknown[] })?.by_gateway ?? []).length },
                { label: 'Alarms', value: ((s.ix_gas as { alarms?: unknown[] })?.alarms ?? []).length },
            ],
        },
        {
            key: 'x',
            title: 'CO₂ monitoring',
            status: matrix.x ?? 'automated',
            metrics: [{ label: 'Devices', value: ((s.x_co2 as { by_device?: unknown[] })?.by_device ?? []).length }],
        },
    ];

    return sections.map((section) => ({
        ...section,
        href: UDPM_SECTION_LINKS[section.key]?.(),
    }));
}

export default function UdpmReportShow({ site, report, permissions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const sections = buildSectionSummaries(report.payload);
    const automatedSections = sections.filter((s) => !s.status.includes('manual')).length;

    return (
        <>
            <Head title={`UDPM ${report.week_start} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={`Week ${report.week_start} — ${report.week_end}`}
                    description={`UDPM-GM-0058 §6.5 report for ${siteName} · ${report.status}`}
                >
                    <div className="flex gap-2">
                        <Link href={udpmIndex()} className="text-sm text-primary hover:underline">Back to reports</Link>
                        {permissions.canApprove && report.status !== 'approved' ? (
                            <Form {...UdpmReportController.approve.form({ report: report.id })}>
                                {({ processing }) => (
                                    <Button type="submit" size="sm" variant="outline" disabled={processing}>Approve</Button>
                                )}
                            </Form>
                        ) : null}
                        {permissions.canExport ? (
                            <>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={`/iot/udpm/${report.id}/export`}>Export JSON</a>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={`/iot/udpm/${report.id}/export-html`}>Export report (HTML)</a>
                                </Button>
                            </>
                        ) : null}
                    </div>
                </ConceptPageHeader>

                <IotKpiStrip
                    className="mb-4"
                    kpis={[
                        { key: 'status', label: 'Status', value: formatHumanLabel(report.status), hint: 'Report workflow' },
                        { key: 'sections', label: 'Sections', value: sections.length, hint: '§6.5 items populated' },
                        { key: 'automated', label: 'Automated', value: automatedSections, hint: 'No manual workflow' },
                        {
                            key: 'generated',
                            label: 'Generated',
                            value: report.generated_at ? new Date(report.generated_at).toLocaleDateString() : '—',
                            hint: `${report.week_start} → ${report.week_end}`,
                        },
                    ]}
                />

                <UdpmSectionCards sections={sections} />

                {report.compliance_summary ? (
                    <ConceptTableCard className="mt-4">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Compliance matrix</h2>
                            <p className="text-xs text-muted-foreground">
                                {Object.keys(report.compliance_summary).length} sections · UDPM-GM-0058
                            </p>
                        </div>
                        <dl className="grid gap-2 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(report.compliance_summary).map(([section, status]) => (
                                <div
                                    key={section}
                                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                                >
                                    <dt className="text-muted-foreground">§{section}</dt>
                                    <dd>
                                        <IotHealthBadge status={status} />
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </ConceptTableCard>
                ) : null}

                <ConceptTableCard className="mt-6">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Full payload</h2>
                        <p className="text-sm text-muted-foreground">Audit-ready JSON for regulatory export</p>
                    </div>
                    <pre className="max-h-[50vh] overflow-auto p-4 text-xs">{JSON.stringify(report.payload, null, 2)}</pre>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

UdpmReportShow.layout = () => ({
    breadcrumbs: [
        { title: 'UDPM reports', href: udpmIndex() },
        { title: 'Report detail', href: '#' },
    ],
});
