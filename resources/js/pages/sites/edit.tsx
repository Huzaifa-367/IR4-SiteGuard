import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { show as siteShow } from '@/routes/sites';

type Props = {
    site: { id: number };
};

export default function SitesEditRedirect({ site }: Props) {
    useEffect(() => {
        router.visit(siteShow.url(site.id, { query: { edit: '1' } }), { replace: true });
    }, [site.id]);

    return null;
}

SitesEditRedirect.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Sites', href: siteShow(props.site.id) },
        { title: 'Edit', href: siteShow(props.site.id) },
    ],
});
