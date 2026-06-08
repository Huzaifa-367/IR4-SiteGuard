import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Bot,
    Building2,
    FileBarChart,
    LayoutGrid,
    Search,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    Users,
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
import { index as modulesIndex } from '@/routes/modules';
import { index as reportsIndex } from '@/routes/reports';
import { index as rulesIndex } from '@/routes/rules';
import { index as platformSettingsIndex } from '@/routes/settings/platform';
import { index as rolesIndex } from '@/routes/roles';
import { index as sitesIndex } from '@/routes/sites';
import { index as usersIndex } from '@/routes/users';
import type { NavItem } from '@/types';
import { NavUser } from './nav-user';

type SidebarNavItem = NavItem & {
    permission?: string | string[];
};

const mainNavSections: { label: string; items: SidebarNavItem[] }[] = [
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

function buildSiteOperationsSection(
    can: (permission: string) => boolean,
    canAny: (...permissions: string[]) => boolean,
): NavMainSection | null {
    const items: SidebarNavItem[] = [
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
    ].filter((item) => isNavItemVisible(item, can, canAny));

    if (items.length === 0) {
        return null;
    }

    return {
        label: 'Site operations',
        items,
    };
}

export function AppSidebar() {
    const { can, canAny } = usePermissions();
    const { selectedSite } = useSiteContext();

    const visibleMainSections: NavMainSection[] = mainNavSections
        .map((section) => ({
            label: section.label,
            items: section.items.filter((item) =>
                isNavItemVisible(item, can, canAny),
            ),
        }))
        .filter((section) => section.items.length > 0);

    const siteOperationsSection =
        selectedSite !== null
            ? buildSiteOperationsSection(can, canAny)
            : null;

    const sections: NavMainSection[] = siteOperationsSection
        ? [
              ...visibleMainSections.slice(0, 1),
              siteOperationsSection,
              ...visibleMainSections.slice(1),
          ]
        : visibleMainSections;

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
