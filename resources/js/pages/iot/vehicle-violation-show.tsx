import { Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import {
    IotDetailStat,
    IotDetailStatGrid,
    IotLinkedResource,
    IotModuleSection,
} from '@/components/iot/iot-module-layout';
import { IotRelativeTime } from '@/components/iot/iot-ui';
import { useSiteContext } from '@/hooks/use-site-context';
import { show as equipmentShow } from '@/routes/iot/equipment';
import { overview as lsrOverview } from '@/routes/iot/lsr';
import {
    index as vehicleViolationsIndex,
    show as vehicleViolationShow,
} from '@/routes/iot/lsr/vehicle-violations';

type Props = {
    site: { id: number; name: string };
    violation: {
        id: number;
        vehicle_description: string;
        violation_type: string;
        violation_type_label: string;
        description: string;
        actions_taken: string;
        occurred_at: string;
    };
    equipmentAsset: {
        id: number;
        name: string;
        equipment_id: string;
        equipment_type: string;
    } | null;
    camera: { id: number; name: string } | null;
    loggedBy: { name: string } | null;
};

export default function VehicleViolationShow({
    site,
    violation,
    equipmentAsset,
    camera,
    loggedBy,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`${violation.vehicle_description} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={violation.vehicle_description}
                    description={`${violation.violation_type_label} · UDPM §vii · ${siteName}`}
                >
                    <Link href={vehicleViolationsIndex()} className="text-sm text-primary hover:underline">
                        Back to vehicle violations
                    </Link>
                </ConceptPageHeader>

                <IotDetailStatGrid className="mb-4">
                    <IotDetailStat
                        label="Occurred"
                        value={<IotRelativeTime iso={violation.occurred_at} />}
                    />
                    <IotDetailStat
                        label="Violation type"
                        value={violation.violation_type_label}
                        sub={violation.violation_type}
                    />
                    <IotDetailStat
                        label="Logged by"
                        value={loggedBy?.name ?? '—'}
                    />
                    <IotDetailStat
                        label="Equipment link"
                        value={equipmentAsset ? equipmentAsset.equipment_id : '—'}
                        sub={equipmentAsset?.name}
                    />
                </IotDetailStatGrid>

                <IotModuleSection title="Violation details" description="Description and corrective actions">
                    <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Description
                            </p>
                            <p className="mt-1 text-sm">{violation.description}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Actions taken
                            </p>
                            <p className="mt-1 text-sm">{violation.actions_taken}</p>
                        </div>
                    </div>
                </IotModuleSection>

                <IotModuleSection
                    title="Traceability"
                    description="Linked equipment and monitoring"
                    className="mt-4"
                >
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {equipmentAsset ? (
                            <IotLinkedResource
                                label="Equipment asset"
                                href={equipmentShow(equipmentAsset.id)}
                                hint={`${equipmentAsset.equipment_id} — ${equipmentAsset.name}`}
                            />
                        ) : null}
                        <IotLinkedResource
                            label="LSR log"
                            href={lsrOverview()}
                            hint="View all life-saving rule violations"
                        />
                        {camera ? (
                            <IotLinkedResource
                                label="Camera"
                                href={lsrOverview()}
                                hint={camera.name}
                            />
                        ) : null}
                    </div>
                </IotModuleSection>
            </ConceptPageShell>
        </>
    );
}

VehicleViolationShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'LSR log', href: lsrOverview() },
        { title: 'Vehicle violations', href: vehicleViolationsIndex() },
        {
            title: props.violation.vehicle_description,
            href: vehicleViolationShow(props.violation.id),
        },
    ],
});
