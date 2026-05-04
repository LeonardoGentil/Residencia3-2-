import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import type { ChatMessage, McpConnection, Provider } from '../lib/types';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';
import { runChatLoop } from '../lib/chatLoop';

interface ChatProps {
  provider: Provider;
  apiKey: string;
  modelId: string;
  conn: McpConnection | null;
  systemPrompt: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function Chat({
  provider,
  apiKey,
  modelId,
  conn,
  systemPrompt,
  messages,
  setMessages,
}: ChatProps) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll só se já estávamos no fim
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Atalho Ctrl/Cmd+K
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy || !conn || !apiKey) return;

      setBusy(true);
      setError(null);
      setInput('');

      try {
        await runChatLoop({
          provider,
          apiKey,
          model: modelId,
          conn,
          systemPrompt,
          history: messages,
          userInput: trimmed,
          onMessage: (m) => setMessages((prev) => [...prev, m]),
          onToolCallStart: (call, msgId) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId
                  ? {
                      ...m,
                      toolCalls: m.toolCalls?.map((tc) => (tc.id === call.id ? { ...tc } : tc)),
                    }
                  : m,
              ),
            );
          },
          onToolCallEnd: (call, msgId) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId
                  ? {
                      ...m,
                      toolCalls: m.toolCalls?.map((tc) =>
                        tc.id === call.id
                          ? { ...tc, status: call.status, result: call.result, durationMs: call.durationMs }
                          : tc,
                      ),
                    }
                  : m,
              ),
            );
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [provider, apiKey, modelId, conn, systemPrompt, messages, setMessages, busy],
  );

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const hasApiKey = apiKey.length > 0;
  const hasMcp = conn !== null;
  const ready = hasApiKey && hasMcp;
  const visible = messages.filter((m) => m.role !== 'tool' && m.role !== 'system');

  return (
    <main className="flex-1 flex flex-col h-full bg-white">
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-6 py-4">
        {visible.length === 0 ? (
          <EmptyState hasApiKey={hasApiKey} hasMcp={hasMcp} onSuggestion={send} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {visible.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-500 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-500 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                    <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  pensando…
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 pt-2">
          <div className="max-w-3xl mx-auto text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 bg-white px-6 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              ready
                ? 'Pergunte algo… (Enter pra enviar, Shift+Enter pra quebrar linha)'
                : !hasMcp
                ? 'Aguardando conexão com o MCP…'
                : 'Cole sua chave de IA na barra lateral pra começar'
            }
            disabled={!ready || busy}
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 max-h-32"
          />
          <button
            onClick={() => send(input)}
            disabled={!ready || !input.trim() || busy}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Enviar
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Pressione <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200">Ctrl/⌘ K</kbd> para focar
        </p>
      </div>
    </main>
  );
}
