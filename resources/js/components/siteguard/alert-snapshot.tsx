import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type AlertSnapshotProps = {
    url: string | null | undefined;
    alt: string;
    className?: string;
    compact?: boolean;
};

export default function AlertSnapshot({ url, alt, className, compact = false }: AlertSnapshotProps) {
    const [hasError, setHasError] = useState(false);

    if (! url || hasError) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 text-muted-foreground',
                    compact ? 'size-14' : 'aspect-video w-full',
                    className,
                )}
            >
                <ImageIcon className={compact ? 'size-5' : 'size-8'} aria-hidden />
            </div>
        );
    }

    return (
        <img
            src={url}
            alt={alt}
            className={cn(
                'rounded-lg border border-border/70 bg-black/5 object-cover',
                compact ? 'size-14 shrink-0' : 'aspect-video w-full max-h-80',
                className,
            )}
            loading="lazy"
            onError={() => setHasError(true)}
        />
    );
}
