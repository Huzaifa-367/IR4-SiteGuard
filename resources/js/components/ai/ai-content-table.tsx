import AiInlineMarkdown from '@/components/ai/ai-inline-markdown';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type AiContentTableProps = {
    headers: string[];
    rows: string[][];
};

export default function AiContentTable({ headers, rows }: AiContentTableProps) {
    return (
        <div className="my-3 overflow-hidden rounded-lg border border-border/70 shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map((header, index) => (
                            <TableHead key={index} className="whitespace-nowrap">
                                <AiInlineMarkdown text={header} />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {headers.map((_, cellIndex) => (
                                <TableCell key={cellIndex} className="align-top">
                                    <AiInlineMarkdown text={row[cellIndex] ?? ''} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
