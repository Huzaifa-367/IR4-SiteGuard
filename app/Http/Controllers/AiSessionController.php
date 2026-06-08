<?php

namespace App\Http\Controllers;

use App\Ai\Agents\SiteSafetyAssistant;
use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Models\AiMessage;
use App\Models\AiSession;
use App\Models\Setting;
use App\Support\AiEnrichmentNormalizer;
use App\Support\PlatformAiConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Ai\Responses\StreamableAgentResponse;
use Laravel\Ai\Responses\StreamedAgentResponse;
use Throwable;

class AiSessionController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    /**
     * @return array<string, mixed>
     */
    private function formatMessage(AiMessage $message): array
    {
        return [
            'id' => $message->id,
            'role' => $message->role,
            'content' => $message->content,
            'chart_spec' => $message->chart_spec,
            'proposed_actions' => AiEnrichmentNormalizer::proposedActions($message->proposed_actions),
            'citations' => AiEnrichmentNormalizer::citations($message->citations),
        ];
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:ai.assistant.use'),
        ];
    }

    public function index(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $user = $request->user();

        $sessions = AiSession::query()
            ->where('site_id', $site->id)
            ->where('user_id', $user?->id)
            ->latest('last_message_at')
            ->limit(20)
            ->get()
            ->map(fn (AiSession $session): array => [
                'id' => $session->id,
                'title' => $session->title,
                'last_message_at' => $session->last_message_at?->toIso8601String(),
            ]);

        $activeSession = $sessions->first()
            ? AiSession::query()
                ->with(['messages' => fn ($q) => $q->orderBy('id')])
                ->find($sessions->first()['id'])
            : null;

        return Inertia::render('ai/index', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'aiEnabled' => (bool) Setting::getValue('ai_enabled', true),
            'aiConfigured' => PlatformAiConfig::isConfigured(),
            'sessions' => $sessions,
            'messages' => $activeSession?->messages
                ->map(fn (AiMessage $m): array => $this->formatMessage($m))
                ->all() ?? [],
            'activeSessionId' => $activeSession?->id,
        ]);
    }

    public function show(Request $request, AiSession $session): JsonResponse
    {
        $site = $this->selectedSite($request);
        abort_unless($session->site_id === $site->id, 404);
        abort_unless($session->user_id === $request->user()?->id, 403);

        $messages = $session->messages()
            ->orderBy('id')
            ->get()
            ->map(fn (AiMessage $m): array => $this->formatMessage($m));

        return response()->json(['messages' => $messages]);
    }

    public function store(Request $request): RedirectResponse
    {
        $site = $this->selectedSite($request);

        AiSession::query()->create([
            'site_id' => $site->id,
            'user_id' => $request->user()?->id,
            'title' => 'New chat',
            'last_message_at' => now(),
        ]);

        return to_route('ai.index');
    }

    public function messageStream(Request $request, AiSession $session): StreamableAgentResponse|JsonResponse
    {
        $site = $this->selectedSite($request);
        abort_unless($session->site_id === $site->id, 404);
        abort_unless($session->user_id === $request->user()?->id, 403);

        if (! (bool) Setting::getValue('ai_enabled', true)) {
            return response()->json([
                'message' => 'AI assistant is disabled in platform settings.',
            ], 403);
        }

        if (! PlatformAiConfig::isConfigured()) {
            return response()->json([
                'message' => 'Add an OpenAI API key in Platform settings before using the assistant.',
            ], 422);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:4000'],
        ]);

        $rateLimit = (int) Setting::getValue('ai_max_messages_per_hour_user', 60);
        $recentUserMessages = AiMessage::query()
            ->where('role', 'user')
            ->where('created_at', '>=', now()->subHour())
            ->whereHas('session', fn ($q) => $q->where('user_id', $request->user()?->id))
            ->count();

        if ($recentUserMessages >= $rateLimit) {
            return response()->json([
                'message' => "Rate limit reached ({$rateLimit} messages per hour).",
            ], 429);
        }

        PlatformAiConfig::apply();

        /** @var Collection<int, AiMessage> $history */
        $history = $session->messages()->orderBy('id')->get();

        AiMessage::query()->create([
            'ai_session_id' => $session->id,
            'role' => 'user',
            'content' => $validated['content'],
        ]);

        try {
            $agent = SiteSafetyAssistant::make(
                site: $site,
                history: $history,
            );

            return $agent
                ->stream($validated['content'], provider: 'openai', model: PlatformAiConfig::model(), timeout: 120)
                ->then(function (StreamedAgentResponse $response) use ($session, $validated): void {
                    AiMessage::query()->create([
                        'ai_session_id' => $session->id,
                        'role' => 'assistant',
                        'content' => $response->text,
                    ]);

                    $session->update([
                        'title' => str($validated['content'])->limit(60)->toString(),
                        'last_message_at' => now(),
                    ]);
                });
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'The assistant could not complete your request. Check the API key and try again.',
            ], 502);
        }
    }
}
