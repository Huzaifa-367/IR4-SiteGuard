import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ConceptFormSectionProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
};

/**
 * Grouped form blocks like Ecme product/order edit pages (General, Pricing, …).
 */
export function ConceptFormSection({
    title,
    description,
    children,
    className,
}: ConceptFormSectionProps) {
    return (
        <Card className={cn('border-border/80 shadow-sm', className)}>
            <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {description !== undefined && description !== '' && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-4 p-6">{children}</CardContent>
        </Card>
    );
}
