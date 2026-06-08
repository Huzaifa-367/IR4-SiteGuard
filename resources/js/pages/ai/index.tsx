import { Form, Head, router } from '@inertiajs/react';
import { Loader2, Send } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import AiChatMessage from '@/components/ai/ai-chat-message';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSiteContext } from '@/hooks/use-site-context';
import type { AiMessageEnrichment } from '@/lib/ai-markdown-types';
import { streamAiMessage } from '@/lib/stream-ai-message';
import { index as aiIndex } from '@/routes/ai';
import { store as storeSession } from '@/routes/ai/sessions';

type Message = AiMessageEnrichment & { id: number; role: string; content: string };
type Session = { id: number; title: string; last_message_at: string | null };

type Props = {
    site: { id: number; name: string };
    aiEnabled: boolean;
    aiConfigured: boolean;
    sessions: Session[];
    messages: Message[];
    activeSessionId: number | null;
};

export default function AiIndex({
    site,
    aiEnabled,
    aiConfigured,
    sessions,
    messages: initialMessages,
    activeSessionId,
}: Props) {
    const [sessionId, setSessionId] = useState<number | null>(activeSessionId);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [draft, setDraft] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const [streamError, setStreamError] = useState<string | null>(null);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    useEffect(() => {
        setSessionId(activeSessionId);
        setMessages(initialMessages);
    }, [activeSessionId, initialMessages]);

    useEffect(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    }, [messages, isStreaming, streamingMessageId]);

    const loadSession = useCallback(async (id: number) => {
        setSessionId(id);
        setStreamError(null);
        setStreamingMessageId(null);

        const response = await fetch(`/ai/sessions/${id}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        });

        if (! response.ok) {
            return;
        }

        const data = (await response.json()) as { messages: Message[] };
        setMessages(data.messages);
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (! sessionId || ! draft.trim() || isStreaming) {
            return;
        }

        const content = draft.trim();
        setDraft('');
        setStreamError(null);
        setIsStreaming(true);

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content,
        };
        const assistantMessageId = Date.now() + 1;
        const assistantPlaceholder: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
        };

        setStreamingMessageId(assistantMessageId);
        setMessages((current) => [...current, userMessage, assistantPlaceholder]);

        await streamAiMessage(sessionId, content, {
            onDelta: (delta) => {
                setMessages((current) =>
                    current.map((message) =>
                        message.id === assistantMessageId
                            ? { ...message, content: message.content + delta }
                            : message,
                    ),
                );
            },
            onDone: () => {
                setIsStreaming(false);
                setStreamingMessageId(null);
                router.reload({ only: ['sessions'] });
            },
            onError: (message) => {
                setStreamError(message);
                setIsStreaming(false);
                setStreamingMessageId(null);
                setMessages((current) => current.filter((m) => m.id !== assistantMessageId));
            },
        });
    };

    if (! aiEnabled) {
        return (
            <>
                <Head title={`AI — ${siteName}`} />
                <ConceptPageShell>
                    <ConceptPageHeader
                        title="Safety assistant"
                        description="AI is disabled in platform settings."
                    />
                </ConceptPageShell>
            </>
        );
    }

    return (
        <>
            <Head title={`AI — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Safety assistant"
                    description={`Ask about ${siteName} — alerts, cameras, rules, investigations, and trends. Answers use live site data only.`}
                />
                {! aiConfigured ? (
                    <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        Add an OpenAI API key in{' '}
                        <a href="/settings/platform" className="font-medium underline">
                            Platform settings
                        </a>{' '}
                        to enable live responses.
                    </p>
                ) : null}
                <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                    <ConceptTableCard title="Sessions">
                        <div className="flex flex-col gap-2 p-3">
                            <Form {...storeSession.form()}>
                                {({ processing }) => (
                                    <Button type="submit" size="sm" variant="outline" disabled={processing}>
                                        New chat
                                    </Button>
                                )}
                            </Form>
                            <ul className="space-y-1 text-sm">
                                {sessions.map((session) => (
                                    <li key={session.id}>
                                        <button
                                            type="button"
                                            className={`w-full rounded px-2 py-1 text-left hover:bg-muted ${
                                                sessionId === session.id ? 'bg-muted font-medium' : ''
                                            }`}
                                            onClick={() => loadSession(session.id)}
                                        >
                                            {session.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ConceptTableCard>
                    <ConceptTableCard
                        title="Chat"
                        className="min-h-[32rem] gap-0 py-0 [&>[data-slot=card-content]]:flex [&>[data-slot=card-content]]:min-h-0 [&>[data-slot=card-content]]:flex-1 [&>[data-slot=card-content]]:flex-col"
                    >
                        {sessionId ? (
                            <div className="flex min-h-[28rem] flex-1 flex-col">
                                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-sm text-muted-foreground">
                                            Ask a question about alerts, cameras, or safety trends for{' '}
                                            {siteName}.
                                        </p>
                                    ) : null}
                                    {messages.map((message) => (
                                        <AiChatMessage
                                            key={message.id}
                                            role={message.role}
                                            content={message.content}
                                            chart_spec={message.chart_spec}
                                            proposed_actions={message.proposed_actions}
                                            citations={message.citations}
                                            isStreaming={
                                                isStreaming &&
                                                message.id === streamingMessageId &&
                                                message.role === 'assistant'
                                            }
                                        />
                                    ))}
                                    <div ref={scrollAnchorRef} className="h-px shrink-0" aria-hidden />
                                </div>
                                {streamError ? (
                                    <p className="border-t px-4 py-2 text-sm text-destructive">{streamError}</p>
                                ) : null}
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex gap-2 border-t bg-muted/20 p-4"
                                >
                                    <div className="flex-1">
                                        <Label htmlFor="content" className="sr-only">
                                            Message
                                        </Label>
                                        <Input
                                            id="content"
                                            value={draft}
                                            onChange={(event) => setDraft(event.target.value)}
                                            placeholder="e.g. How many critical alerts are open? Which cameras are offline?"
                                            required
                                            disabled={isStreaming || ! aiConfigured}
                                            className="bg-background"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="shrink-0"
                                        disabled={isStreaming || ! aiConfigured || ! draft.trim()}
                                        aria-label="Send message"
                                    >
                                        {isStreaming ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Send className="size-4" />
                                        )}
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <p className="p-4 text-sm text-muted-foreground">
                                Start a new chat to use the assistant.
                            </p>
                        )}
                    </ConceptTableCard>
                </div>
            </ConceptPageShell>
        </>
    );
}

AiIndex.layout = () => ({
    breadcrumbs: [{ title: 'AI assistant', href: aiIndex() }],
});
