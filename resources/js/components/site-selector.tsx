import { router } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useSiteContext } from '@/hooks/use-site-context';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { update as updateSiteContext } from '@/routes/site-context';

export function SiteSelector() {
    const { selectedSite, sites } = useSiteContext();

    if (sites.length === 0) {
        return null;
    }

    const value = selectedSite?.id?.toString() ?? '';

    return (
        <Select
            value={value}
            onValueChange={(siteId: string) => {
                router.post(
                    updateSiteContext.url(),
                    { site_id: Number(siteId) },
                    { preserveScroll: false },
                );
            }}
        >
            <SelectTrigger size="sm" className="min-w-[12rem] max-w-[16rem]">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent align="end">
                {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                        {site.name}
                        {site.code ? ` (${site.code})` : ''}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
