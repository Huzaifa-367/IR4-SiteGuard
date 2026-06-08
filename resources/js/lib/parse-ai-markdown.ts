import type { CalloutVariant, MarkdownBlock } from '@/lib/ai-markdown-types';

function isTableRow(line: string): boolean {
    const trimmed = line.trim();

    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|');
}

function isTableSeparator(line: string): boolean {
    return /^\|?[\s\-:|]+\|?$/.test(line.trim()) && line.includes('-');
}

function parseTableRow(line: string): string[] {
    return line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());
}

function detectCalloutVariant(firstLine: string): CalloutVariant {
    const normalized = firstLine.toLowerCase();

    if (/\[!?\s*warning\]|\*\*warning\*\*/i.test(firstLine)) {
        return 'warning';
    }

    if (/\[!?\s*tip\]|\*\*tip\*\*/i.test(firstLine)) {
        return 'tip';
    }

    if (/\[!?\s*note\]|\*\*note\*\*/i.test(firstLine)) {
        return 'note';
    }

    if (/\[!?\s*important\]|\*\*important\*\*/i.test(firstLine)) {
        return 'important';
    }

    if (normalized.includes('critical') || normalized.includes('caution')) {
        return 'warning';
    }

    return 'default';
}

function stripCalloutPrefix(line: string): string {
    return line
        .replace(/^>\s*/, '')
        .replace(/^\[!?\s*\w+\]\s*/i, '')
        .replace(/^\*\*(Note|Tip|Warning|Important)\*\*:?\s*/i, '')
        .trim();
}

export function parseAiMarkdown(content: string): MarkdownBlock[] {
    const lines = content.split('\n');
    const blocks: MarkdownBlock[] = [];
    let index = 0;
    let listItems: { text: string; checked?: boolean }[] = [];
    let listOrdered = false;
    let codeLines: string[] = [];
    let codeLanguage = '';
    let inCodeBlock = false;

    const flushList = (): void => {
        if (listItems.length === 0) {
            return;
        }

        blocks.push({
            type: 'list',
            ordered: listOrdered,
            items: listItems.map(({ text, checked }) => ({ text, checked })),
        });
        listItems = [];
        listOrdered = false;
    };

    const flushCode = (): void => {
        if (codeLines.length === 0) {
            return;
        }

        blocks.push({
            type: 'code',
            language: codeLanguage,
            code: codeLines.join('\n'),
        });
        codeLines = [];
        codeLanguage = '';
    };

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trimEnd();

        if (inCodeBlock) {
            if (trimmed.startsWith('```')) {
                inCodeBlock = false;
                flushCode();
            } else {
                codeLines.push(line);
            }

            index += 1;
            continue;
        }

        if (trimmed.startsWith('```')) {
            flushList();
            inCodeBlock = true;
            codeLanguage = trimmed.slice(3).trim();
            index += 1;
            continue;
        }

        if (trimmed === '') {
            flushList();
            index += 1;
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            flushList();
            blocks.push({ type: 'hr' });
            index += 1;
            continue;
        }

        const imageOnly = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageOnly) {
            flushList();
            blocks.push({ type: 'image', alt: imageOnly[1], src: imageOnly[2] });
            index += 1;
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushList();
            blocks.push({
                type: 'heading',
                level: headingMatch[1].length,
                text: headingMatch[2],
            });
            index += 1;
            continue;
        }

        if (isTableRow(trimmed) && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
            flushList();
            const headers = parseTableRow(trimmed);
            const rows: string[][] = [];
            index += 2;

            while (index < lines.length && isTableRow(lines[index].trimEnd())) {
                rows.push(parseTableRow(lines[index].trimEnd()));
                index += 1;
            }

            blocks.push({ type: 'table', headers, rows });
            continue;
        }

        if (trimmed.startsWith('>')) {
            flushList();
            const quoteLines: string[] = [];
            let variant: CalloutVariant = 'default';

            while (index < lines.length && lines[index].trimStart().startsWith('>')) {
                const quoteLine = lines[index].trimStart().slice(1).trimStart();

                if (quoteLines.length === 0) {
                    variant = detectCalloutVariant(quoteLine);
                }

                quoteLines.push(stripCalloutPrefix(quoteLine));
                index += 1;
            }

            blocks.push({ type: 'blockquote', lines: quoteLines, variant });
            continue;
        }

        const taskMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (taskMatch) {
            if (listItems.length > 0 && listOrdered) {
                flushList();
            }

            listOrdered = false;
            listItems.push({
                text: taskMatch[2],
                checked: taskMatch[1].toLowerCase() === 'x',
            });
            index += 1;
            continue;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
            if (listItems.length > 0 && listOrdered) {
                flushList();
            }

            listOrdered = false;
            listItems.push({ text: bulletMatch[1] });
            index += 1;
            continue;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            if (listItems.length > 0 && ! listOrdered) {
                flushList();
            }

            listOrdered = true;
            listItems.push({ text: orderedMatch[1] });
            index += 1;
            continue;
        }

        flushList();
        blocks.push({ type: 'paragraph', text: trimmed });
        index += 1;
    }

    flushList();
    flushCode();

    return blocks;
}
