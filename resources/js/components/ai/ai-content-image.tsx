import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type AiContentImageProps = {
    alt: string;
    src: string;
};

export default function AiContentImage({ alt, src }: AiContentImageProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <figure className="my-3 flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                <ImageIcon className="size-5 shrink-0" aria-hidden />
                <figcaption>{alt || 'Image unavailable'}</figcaption>
            </figure>
        );
    }

    return (
        <figure className="my-3 overflow-hidden rounded-lg border border-border/70 bg-muted/20">
            <img
                src={src}
                alt={alt}
                className="max-h-80 w-full object-contain"
                loading="lazy"
                onError={() => setHasError(true)}
            />
            {alt ? (
                <figcaption className={cn('border-t border-border/60 px-3 py-2 text-xs text-muted-foreground')}>
                    {alt}
                </figcaption>
            ) : null}
        </figure>
    );
}
