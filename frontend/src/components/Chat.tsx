import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import type { ChatMessage, CustomEndpoint, McpConnection, Provider } from '../lib/types';
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
  customEndpoints?: CustomEndpoint[];
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in-up">
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-blue-600 rounded-full opacity-40 blur-[5px] animate-avatar-glow" />
        <div className="relative w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px] font-black">F</span>
        </div>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/6 backdrop-blur-sm flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-400/70 dot-1" />
        <div className="w-2 h-2 rounded-full bg-blue-400/70 dot-2" />
        <div className="w-2 h-2 rounded-full bg-blue-400/70 dot-3" />
      </div>
    </div>
  );
}

export default function Chat({
  provider,
  apiKey,
  modelId,
  conn,
  systemPrompt,
  messages,
  setMessages,
  customEndpoints,
}: ChatProps) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, busy]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
  }, [input]);

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

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

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
          signal: controller.signal,
          customEndpoints,
          onMessage: (m) => setMessages((prev) => [...prev, m]),
          onToolCallStart: (call, msgId) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId
                  ? { ...m, toolCalls: m.toolCalls?.map((tc) => (tc.id === call.id ? { ...tc } : tc)) }
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
        if (e instanceof Error && e.name === 'AbortError') return;

        const raw = e instanceof Error ? e.message : String(e);
        const statusMatch = raw.match(/^LLM (\d+):/);
        const status = statusMatch ? Number(statusMatch[1]) : 0;

        let hint = '';
        if (status === 429) hint = ' — modelo saturado. Troque o modelo na sidebar ou use Groq.';
        else if (status === 404 && /model/i.test(raw)) hint = ' — ID de modelo inválido. Escolha outro no dropdown.';
        else if (status === 401 || status === 403) hint = ' — chave da API inválida ou expirada.';
        else if (status === 400) hint = ' — request rejeitada. Modelo pode não suportar tool calling.';

        setError(raw + hint);
      } finally {
        setBusy(false);
      }
    },
    [provider, apiKey, modelId, conn, systemPrompt, messages, setMessages, busy, customEndpoints],
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

  const placeholder = ready
    ? 'Pergunte algo… (Enter para enviar, Shift+Enter para nova linha)'
    : !hasMcp
    ? 'Aguardando conexão com o MCP…'
    : 'Cole sua chave de IA na barra lateral para começar';

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#020617]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
        {visible.length === 0 ? (
          <EmptyState hasApiKey={hasApiKey} hasMcp={hasMcp} onSuggestion={send} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {visible.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {busy && <TypingIndicator />}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 pb-1">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Área de input */}
      <div className="border-t border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-white/8 rounded-2xl px-3 py-2 transition-all focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-slate-800/90 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_0_20px_rgba(59,130,246,0.08)] backdrop-blur-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              disabled={!ready || busy}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none disabled:opacity-40 py-1"
            />
            <button
              onClick={() => send(input)}
              disabled={!ready || !input.trim() || busy}
              className="btn-primary flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-blue-900/40 hover:shadow-blue-800/50"
              title="Enviar (Enter)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-700 text-center mt-1.5 select-none">
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-white/6 font-mono text-[9px] text-slate-500 dark:text-slate-600">Ctrl/⌘ K</kbd>
            {' '}para focar &nbsp;·&nbsp;
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-white/6 font-mono text-[9px] text-slate-500 dark:text-slate-600">Shift+Enter</kbd>
            {' '}para nova linha
          </p>
        </div>
      </div>
    </main>
  );
}
