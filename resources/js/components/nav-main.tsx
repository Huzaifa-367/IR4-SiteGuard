import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import { cn } from '@/lib/utils';

export type NavMainSection = {
    label: string;
    items: NavItem[];
};

function navItemIsActive(
    item: NavItem,
    isCurrentOrParentUrl: (href: NonNullable<NavItem['href']>) => boolean,
): boolean {
    if (item.href && isCurrentOrParentUrl(item.href)) {
        return true;
    }

    return (item.items ?? []).some((child) => navItemIsActive(child, isCurrentOrParentUrl));
}

function NavMenuItem({ item }: { item: NavItem }) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const children = item.items ?? [];
    const isActive = navItemIsActive(item, isCurrentOrParentUrl);

    if (children.length === 0 && item.href) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={isCurrentUrl(item.href)}
                    tooltip={{ children: item.title }}
                >
                    <Link href={item.href} prefetch>
                        {item.icon ? <item.icon /> : null}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    if (children.length === 0) {
        return null;
    }

    return (
        <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={{ children: item.title }} isActive={isActive}>
                        {item.icon ? <item.icon /> : null}
                        <span>{item.title}</span>
                        <ChevronRight
                            className={cn(
                                'ml-auto size-4 transition-transform duration-200',
                                'group-data-[state=open]/collapsible:rotate-90',
                            )}
                        />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {children.map((child) =>
                            child.href ? (
                                <SidebarMenuSubItem key={child.title}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={isCurrentUrl(child.href)}
                                    >
                                        <Link href={child.href} prefetch>
                                            <span>{child.title}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ) : null,
                        )}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function NavMain({ sections = [] }: { sections: NavMainSection[] }) {
    return (
        <Fragment>
            {sections.map((section) => (
                <SidebarGroup key={section.label} className="px-2 py-0">
                    <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                    <SidebarMenu>
                        {section.items.map((item) => (
                            <NavMenuItem key={item.title} item={item} />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </Fragment>
    );
}
