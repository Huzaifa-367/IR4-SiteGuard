import { Head, router } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import RuleFormDialog, { type RuleFormValues } from '@/components/siteguard/rule-form-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSiteContext } from '@/hooks/use-site-context';
import { index as rulesIndex, update as updateRule } from '@/routes/rules';

type RuleRow = RuleFormValues;

type Props = {
    site: { id: number; name: string };
    rules: RuleRow[];
    modules: { id: number; name: string }[];
    canManage: boolean;
};

export default function RulesIndex({ site, rules, modules, canManage }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<RuleFormValues | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    const dialogOpen = createOpen || editingRule !== null;

    const handleDialogOpenChange = (open: boolean): void => {
        if (!open) {
            setCreateOpen(false);
            setEditingRule(null);
        }
    };

    const toggleRuleActive = (rule: RuleRow, checked: boolean): void => {
        setTogglingId(rule.id);
        router.patch(
            updateRule.url({ rule: rule.id }),
            { is_active: checked },
            {
                preserveScroll: true,
                onFinish: () => setTogglingId(null),
            },
        );
    };

    return (
        <>
            <Head title={`Rules — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Safety rules"
                    description={`Rule catalog for ${siteName}`}
                >
                    {canManage && modules.length > 0 ? (
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-1 size-4" />
                            Add rule
                        </Button>
                    ) : null}
                </ConceptPageHeader>
                <ConceptTableCard>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                {canManage ? (
                                    <TableHead className="w-[1%] text-right">Actions</TableHead>
                                ) : null}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-mono text-sm">{rule.code}</TableCell>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>{rule.module ?? '—'}</TableCell>
                                    <TableCell>{rule.severity}</TableCell>
                                    <TableCell>
                                        {canManage ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="inline-flex items-center gap-2">
                                                        <Switch
                                                            id={`rule-active-${rule.id}`}
                                                            checked={rule.is_active}
                                                            disabled={togglingId === rule.id}
                                                            onCheckedChange={(checked) =>
                                                                toggleRuleActive(rule, checked)
                                                            }
                                                            aria-label={
                                                                rule.is_active
                                                                    ? 'Disable rule'
                                                                    : 'Enable rule'
                                                            }
                                                        />
                                                        <span className="sr-only">
                                                            {rule.is_active
                                                                ? 'Active'
                                                                : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {rule.is_active
                                                        ? 'Disable rule'
                                                        : 'Enable rule'}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <ConceptStatusBadge
                                                tone={rule.is_active ? 'success' : 'muted'}
                                            >
                                                {rule.is_active ? 'Active' : 'Disabled'}
                                            </ConceptStatusBadge>
                                        )}
                                    </TableCell>
                                    {canManage ? (
                                        <TableCell className="text-right">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => setEditingRule(rule)}
                                                        aria-label="Edit rule"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit rule</TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
            {canManage ? (
                <RuleFormDialog
                    open={dialogOpen}
                    onOpenChange={handleDialogOpenChange}
                    modules={modules}
                    rule={editingRule}
                />
            ) : null}
        </>
    );
}

RulesIndex.layout = () => ({
    breadcrumbs: [{ title: 'Rules', href: rulesIndex() }],
});
