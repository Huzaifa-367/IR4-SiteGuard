import { Form, Head } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { Button } from '@/components/ui/button';
import { useSiteContext } from '@/hooks/use-site-context';
import { index as modulesIndex, update as updateModule } from '@/routes/modules';

type ModuleRow = {
    id: number;
    key: string;
    name: string;
    description: string | null;
    is_enabled: boolean;
};

type Props = {
    site: { id: number; name: string; code: string | null };
    modules: ModuleRow[];
    canConfigure: boolean;
};

export default function ModulesIndex({ site, modules, canConfigure }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Modules — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Detection modules"
                    description={`Enabled modules for ${siteName}`}
                />
                <ConceptTableCard>
                    <ul className="divide-y">
                        {modules.map((mod) => (
                            <li key={mod.id} className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="font-medium">{mod.name}</p>
                                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{mod.key}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ConceptStatusBadge tone={mod.is_enabled ? 'success' : 'muted'}>
                                        {mod.is_enabled ? 'Enabled' : 'Disabled'}
                                    </ConceptStatusBadge>
                                    {canConfigure ? (
                                        <Form {...updateModule.form({ module: mod.id })}>
                                            {({ processing }) => (
                                                <Button type="submit" size="sm" variant="outline" disabled={processing}>
                                                    <input type="hidden" name="is_enabled" value={mod.is_enabled ? '0' : '1'} />
                                                    {mod.is_enabled ? 'Disable' : 'Enable'}
                                                </Button>
                                            )}
                                        </Form>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

ModulesIndex.layout = () => ({
    breadcrumbs: [{ title: 'Modules', href: modulesIndex() }],
});
