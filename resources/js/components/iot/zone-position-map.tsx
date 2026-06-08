import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { ConceptTableCard } from '@/components/concepts';
import { IotEmptyState } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { show as zoneShow } from '@/routes/iot/rfid/zones';
import 'leaflet/dist/leaflet.css';

export type ZoneMapPin = {
    id: number;
    name: string;
    code: string;
    zone_type: string;
    count: number;
    lat: number | null;
    lng: number | null;
};

type SiteMapCenter = {
    lat: number;
    lng: number;
};

const ZONE_TYPE_COLORS: Record<string, { stroke: string; fill: string }> = {
    gate: { stroke: '#334155', fill: '#475569' },
    general: { stroke: '#0f766e', fill: '#0d9488' },
    restricted: { stroke: '#b91c1c', fill: '#dc2626' },
    height_work: { stroke: '#b45309', fill: '#d97706' },
    muster: { stroke: '#1d4ed8', fill: '#2563eb' },
};

function FitMapBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length === 0) {
            return;
        }

        if (positions.length === 1) {
            map.setView(positions[0], 16);

            return;
        }

        map.fitBounds(positions, { padding: [40, 40], maxZoom: 17 });
    }, [map, positions]);

    return null;
}

function ZoneLeafletMap({
    zones,
    mapCenter,
}: {
    zones: ZoneMapPin[];
    mapCenter: SiteMapCenter | null;
}) {
    const withCoords = zones.filter((zone) => zone.lat !== null && zone.lng !== null) as Array<
        ZoneMapPin & { lat: number; lng: number }
    >;
    const maxCount = Math.max(...zones.map((zone) => zone.count), 1);

    const positions = useMemo(
        () => withCoords.map((zone) => [zone.lat, zone.lng] as [number, number]),
        [withCoords],
    );

    const defaultCenter = useMemo((): [number, number] => {
        if (mapCenter) {
            return [mapCenter.lat, mapCenter.lng];
        }

        if (positions.length > 0) {
            const avgLat = positions.reduce((sum, [lat]) => sum + lat, 0) / positions.length;
            const avgLng = positions.reduce((sum, [, lng]) => sum + lng, 0) / positions.length;

            return [avgLat, avgLng];
        }

        return [25.2048, 55.2708];
    }, [mapCenter, positions]);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={15}
            scrollWheelZoom={false}
            className="z-0 h-[min(22rem,50vh)] w-full rounded-lg"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitMapBounds positions={positions} />
            {withCoords.map((zone) => {
                const colors = ZONE_TYPE_COLORS[zone.zone_type] ?? {
                    stroke: 'hsl(var(--primary))',
                    fill: 'hsl(var(--primary))',
                };
                const radius = 10 + Math.round((zone.count / maxCount) * 18);

                return (
                    <CircleMarker
                        key={zone.id}
                        center={[zone.lat, zone.lng]}
                        radius={radius}
                        pathOptions={{
                            color: colors.stroke,
                            fillColor: colors.fill,
                            fillOpacity: 0.75,
                            weight: 2,
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                            <span className="text-xs font-medium">
                                {zone.name}: {zone.count} on site
                            </span>
                        </Tooltip>
                        <Popup>
                            <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.875rem', lineHeight: 1.4 }}>
                                <strong>{zone.name}</strong>
                                <span style={{ color: '#64748b' }}>{zone.code}</span>
                                <span>
                                    {zone.count} on site · {formatHumanLabel(zone.zone_type)}
                                </span>
                                <Link href={zoneShow(zone.id)} className="text-primary hover:underline">
                                    View zone details
                                </Link>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}

export function ZonePositionMap({
    zones,
    mapCenter = null,
}: {
    zones: ZoneMapPin[];
    mapCenter?: SiteMapCenter | null;
}) {
    const [mounted, setMounted] = useState(false);
    const withCoords = zones.filter((zone) => zone.lat !== null && zone.lng !== null);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <ConceptTableCard
            title="Zone map"
            description="OpenStreetMap · bubble size = on-site headcount"
        >
            {withCoords.length > 0 ? (
                mounted ? (
                    <div className="p-3">
                        <ZoneLeafletMap zones={zones} mapCenter={mapCenter} />
                    </div>
                ) : (
                    <div className="m-3 h-[min(22rem,50vh)] animate-pulse rounded-lg bg-muted/40" />
                )
            ) : (
                <IotEmptyState message="No map coordinates configured for zones" />
            )}
            <div className="grid gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3">
                {zones.map((zone) => (
                    <div
                        key={zone.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-xs"
                    >
                        <div className="min-w-0">
                            <Link href={zoneShow(zone.id)} className="truncate font-medium text-primary hover:underline">
                                {zone.name}
                            </Link>
                            <p className="text-muted-foreground">{formatHumanLabel(zone.zone_type)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-semibold tabular-nums">
                            {zone.count}
                        </span>
                    </div>
                ))}
            </div>
        </ConceptTableCard>
    );
}
