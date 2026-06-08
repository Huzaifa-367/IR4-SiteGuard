import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { index as sitesIndex } from '@/routes/sites';

export default function SitesCreateRedirect() {
    useEffect(() => {
        router.visit(sitesIndex.url({ query: { create: '1' } }), { replace: true });
    }, []);

    return null;
}
