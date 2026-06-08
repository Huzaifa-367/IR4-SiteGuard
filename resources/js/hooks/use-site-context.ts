import { usePage } from '@inertiajs/react';
import type { SiteContext } from '@/types/site-context';

export function useSiteContext(): SiteContext {
    const { siteContext } = usePage().props;

    return siteContext ?? { selectedSite: null, sites: [] };
}
