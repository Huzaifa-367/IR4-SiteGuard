import { usePage } from '@inertiajs/react';
import { Shield } from 'lucide-react';

export default function AppLogo() {
    const { name } = usePage().props as { name?: string };
    const appName = name ?? 'SiteGuard';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Shield className="size-5" aria-hidden />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {appName}
                </span>
            </div>
        </>
    );
}
