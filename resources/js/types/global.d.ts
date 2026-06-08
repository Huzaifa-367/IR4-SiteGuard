import type { Auth } from '@/types/auth';
import type { SiteContext } from '@/types/site-context';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            siteContext: SiteContext;
            [key: string]: unknown;
        };
    }
}
