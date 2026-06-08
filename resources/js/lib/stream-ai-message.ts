type StreamCallbacks = {
    onDelta: (delta: string) => void;
    onDone: () => void;
    onError: (message: string) => void;
};

type StreamEventPayload = {
    type?: string;
    delta?: string;
    message?: string;
    error?: string;
};

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function parseEventData(line: string): StreamEventPayload | null {
    const payload = line.replace(/^data:\s*/, '').trim();

    if (payload === '' || payload === '[DONE]') {
        return null;
    }

    try {
        return JSON.parse(payload) as StreamEventPayload;
    } catch {
        return null;
    }
}

export async function streamAiMessage(
    sessionId: number,
    content: string,
    callbacks: StreamCallbacks,
): Promise<void> {
    let response: Response;

    try {
        response = await fetch(`/ai/sessions/${sessionId}/messages/stream`, {
            method: 'POST',
            headers: {
                Accept: 'text/event-stream',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ content }),
        });
    } catch {
        callbacks.onError('Network error — could not reach the server.');

        return;
    }

    if (!response.ok) {
        let message = `Request failed (${response.status}).`;

        try {
            const body = (await response.json()) as { message?: string; error?: string };
            message = body.message ?? body.error ?? message;
        } catch {
            if (response.status === 419) {
                message = 'Session expired — refresh the page and try again.';
            }
        }

        callbacks.onError(message);

        return;
    }

    const reader = response.body?.getReader();

    if (!reader) {
        callbacks.onError('Streaming is not supported in this browser.');

        return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (! line.startsWith('data:')) {
                continue;
            }

            const event = parseEventData(line);

            if (event === null) {
                continue;
            }

            if (event.type === 'text_delta' && event.delta) {
                callbacks.onDelta(event.delta);
            }
        }
    }

    callbacks.onDone();
}
