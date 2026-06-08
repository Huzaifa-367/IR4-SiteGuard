import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    Bot,
    Building2,
    ClipboardList,
    Cpu,
    FileBarChart,
    Gauge,
    LayoutGrid,
    List,
    MapPin,
    Radio,
    Search,
    Settings,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    Table2,
    UserCheck,
    Users,
    Wind,
    Wrench,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import type { NavMainSection } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { useSiteContext } from '@/hooks/use-site-context';
import { dashboard } from '@/routes';
import { index as aiIndex } from '@/routes/ai';
import { index as alertsIndex } from '@/routes/alerts';
import { index as investigationsIndex } from '@/routes/investigations';
import { index as deploymentApprovalsIndex } from '@/routes/iot/deployment-approvals';
import { index as equipmentAssetsIndex } from '@/routes/iot/equipment/assets';
import { overview as equipmentOverview } from '@/routes/iot/equipment';
import { index as edgeDevicesIndex } from '@/routes/iot/field-devices/edge';
import { index as gasGatewaysIndex } from '@/routes/iot/field-devices/gas-gateways';
import { index as rfidReadersIndex } from '@/routes/iot/field-devices/rfid-readers';
import { index as sensorDevicesIndex } from '@/routes/iot/field-devices/sensors';
import { overview as fieldDevicesOverview } from '@/routes/iot/field-devices';
import { index as gasReadingsIndex } from '@/routes/iot/gas/readings';
import { overview as gasOverview } from '@/routes/iot/gas';
import { index as hseRegisterIndex } from '@/routes/iot/hse-incidents/register';
import { overview as hseOverview } from '@/routes/iot/hse-incidents';
import { index as lsrViolationsIndex } from '@/routes/iot/lsr/violations';
import { overview as lsrOverview } from '@/routes/iot/lsr';
import { index as vehicleViolationsIndex } from '@/routes/iot/lsr/vehicle-violations';
import { index as evacuationsIndex } from '@/routes/iot/rfid/evacuations';
import { index as gateLogIndex } from '@/routes/iot/rfid/gate-log';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as personnelIndex } from '@/routes/iot/rfid/personnel';
import { index as portableDevicesIndex } from '@/routes/iot/rfid/portable-devices';
import { index as workersIndex } from '@/routes/iot/rfid/workers';
import { index as zonesIndex } from '@/routes/iot/rfid/zones';
import { index as udpmIndex } from '@/routes/iot/udpm';
import { index as modulesIndex } from '@/routes/modules';
import { index as reportsIndex } from '@/routes/reports';
import { index as rulesIndex } from '@/routes/rules';
import { index as platformSettingsIndex } from '@/routes/settings/platform';
import { index as rolesIndex } from '@/routes/roles';
import { index as sitesIndex } from '@/routes/sites';
import { index as usersIndex } from '@/routes/users';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { NavItem } from '@/types';
import { NavUser } from './nav-user';

type SidebarNavItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    permission?: string | string[];
    items?: SidebarNavItem[];
};

type SidebarNavSection = {
    label: string;
    items: SidebarNavItem[];
    requiresSelectedSite?: boolean;
};

const mainNavSections: SidebarNavSection[] = [
    {
        label: 'Overview',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
                permission: 'alerts.view',
            },
        ],
    },
    {
        label: 'Site operations',
        requiresSelectedSite: true,
        items: [
            {
                title: 'Modules',
                href: modulesIndex(),
                icon: SlidersHorizontal,
                permission: 'modules.view',
            },
            {
                title: 'Rules',
                href: rulesIndex(),
                icon: ShieldCheck,
                permission: 'rules.view',
            },
            {
                title: 'Investigations',
                href: investigationsIndex(),
                icon: Search,
                permission: 'investigations.manage',
            },
            {
                title: 'AI assistant',
                href: aiIndex(),
                icon: Bot,
                permission: 'ai.assistant.use',
            },
        ],
    },
    {
        label: 'IoT & compliance',
        requiresSelectedSite: true,
        items: [
            {
                title: 'Field devices',
                icon: Cpu,
                permission: ['rfid.view', 'gas.view', 'environmental.view'],
                items: [
                    { title: 'Overview', href: fieldDevicesOverview(), icon: BarChart3 },
                    { title: 'Edge devices', href: edgeDevicesIndex(), icon: Cpu },
                    { title: 'RFID readers', href: rfidReadersIndex(), icon: Radio },
                    { title: 'Gas gateways', href: gasGatewaysIndex(), icon: Wind },
                    { title: 'Sensors', href: sensorDevicesIndex(), icon: Gauge },
                ],
            },
            {
                title: 'RFID / SSMS',
                icon: Radio,
                permission: ['rfid.view', 'gate_log.view'],
                items: [
                    { title: 'Overview', href: rfidOverview(), icon: BarChart3 },
                    { title: 'Zones', href: zonesIndex(), icon: MapPin, permission: 'rfid.view' },
                    { title: 'Workers', href: workersIndex(), icon: Users, permission: 'workers.manage' },
                    {
                        title: 'Portable devices',
                        href: portableDevicesIndex(),
                        icon: UserCheck,
                        permission: ['portable_devices.manage', 'workers.manage'],
                    },
                    { title: 'On-site personnel', href: personnelIndex(), icon: Users },
                    { title: 'Gate log', href: gateLogIndex(), icon: List, permission: 'gate_log.view' },
                    {
                        title: 'Evacuations',
                        href: evacuationsIndex(),
                        icon: AlertTriangle,
                        permission: 'evacuation.generate',
                    },
                ],
            },
            {
                title: 'Gas & environmental',
                icon: Wind,
                permission: ['gas.view', 'environmental.view'],
                items: [
                    { title: 'Overview', href: gasOverview(), icon: BarChart3 },
                    { title: 'Readings & alarms', href: gasReadingsIndex(), icon: Table2 },
                ],
            },
            {
                title: 'Equipment',
                icon: Wrench,
                permission: 'equipment.view',
                items: [
                    { title: 'Overview', href: equipmentOverview(), icon: BarChart3 },
                    { title: 'Asset register', href: equipmentAssetsIndex(), icon: List },
                ],
            },
            {
                title: 'UDPM reports',
                href: udpmIndex(),
                icon: FileBarChart,
                permission: 'udpm.view',
            },
            {
                title: 'HSE incidents',
                icon: ShieldAlert,
                permission: 'hse_incidents.view',
                items: [
                    { title: 'Overview', href: hseOverview(), icon: BarChart3 },
                    { title: 'Incident register', href: hseRegisterIndex(), icon: List },
                ],
            },
            {
                title: 'LSR log',
                icon: ShieldCheck,
                permission: 'lsr.view',
                items: [
                    { title: 'Overview', href: lsrOverview(), icon: BarChart3 },
                    { title: 'Violations', href: lsrViolationsIndex(), icon: List },
                    {
                        title: 'Vehicle violations',
                        href: vehicleViolationsIndex(),
                        icon: List,
                        permission: 'vehicle_violations.log',
                    },
                ],
            },
            {
                title: 'Deployment approvals',
                href: deploymentApprovalsIndex(),
                icon: ClipboardList,
                permission: 'settings.manage',
            },
        ],
    },
    {
        label: 'SiteGuard',
        items: [
            {
                title: 'Sites',
                href: sitesIndex(),
                icon: Building2,
                permission: 'sites.view',
            },
            {
                title: 'Alerts',
                href: alertsIndex(),
                icon: AlertTriangle,
                permission: 'alerts.view',
            },
            {
                title: 'Reports',
                href: reportsIndex(),
                icon: FileBarChart,
                permission: 'reports.export',
            },
        ],
    },
    {
        label: 'Administration',
        items: [
            {
                title: 'Users',
                href: usersIndex(),
                icon: Users,
                permission: 'users.view',
            },
            {
                title: 'Roles & Permissions',
                href: rolesIndex(),
                icon: ShieldCheck,
                permission: 'roles.view',
            },
            {
                title: 'Platform settings',
                href: platformSettingsIndex(),
                icon: Settings,
                permission: 'settings.manage',
            },
        ],
    },
];

function isNavItemVisible(
    item: SidebarNavItem,
    can: (permission: string) => boolean,
    canAny: (...permissions: string[]) => boolean,
): boolean {
    const permission = item.permission;

    if (!permission) {
        return true;
    }

    if (Array.isArray(permission)) {
        return canAny(...permission);
    }

    return can(permission);
}

function filterSidebarNavItems(
    items: SidebarNavItem[],
    can: (permission: string) => boolean,
    canAny: (...permissions: string[]) => boolean,
): NavItem[] {
    return items
        .filter((item) => isNavItemVisible(item, can, canAny))
        .map((item): NavItem | null => {
            const children = item.items
                ? filterSidebarNavItems(item.items, can, canAny)
                : undefined;

            if (item.items && (!children || children.length === 0)) {
                return null;
            }

            if (!item.href && (!children || children.length === 0)) {
                return null;
            }

            return {
                title: item.title,
                href: item.href,
                icon: item.icon ?? null,
                items: children,
            };
        })
        .filter((item): item is NavItem => item !== null);
}

export function AppSidebar() {
    const { can, canAny } = usePermissions();
    const { selectedSite } = useSiteContext();

    const sections: NavMainSection[] = mainNavSections
        .filter(
            (section) =>
                !section.requiresSelectedSite || selectedSite !== null,
        )
        .map((section) => ({
            label: section.label,
            items: filterSidebarNavItems(section.items, can, canAny),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain sections={sections} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
