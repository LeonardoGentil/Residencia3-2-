import type { McpConnection } from '../lib/types';

interface McpStatusProps {
  url: string;
  onUrlChange: (url: string) => void;
  conn: McpConnection | null;
  connecting: boolean;
  error: string | null;
  onReconnect: () => void;
}

export default function McpStatus({ url, onUrlChange, conn, connecting, error, onReconnect }: McpStatusProps) {
  const status: 'ok' | 'connecting' | 'error' = conn ? 'ok' : connecting ? 'connecting' : 'error';

  const dotCls = {
    ok: 'bg-emerald-400',
    connecting: 'bg-amber-400 animate-pulse-soft',
    error: 'bg-red-400',
  }[status];

  const labelCls = {
    ok: 'text-emerald-600 dark:text-emerald-400',
    connecting: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  }[status];

  const label = {
    ok: `Conectado · ${conn?.tools.filter((t) => t.name !== 'login' && t.name !== 'register').length ?? 0} tools`,
    connecting: 'Conectando…',
    error: 'Desconectado',
  }[status];

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">URL do servidor</label>
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-2">
        <div className={`flex items-center gap-2 text-xs font-medium ${labelCls}`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
          {label}
        </div>
        <button
          onClick={onReconnect}
          disabled={connecting}
          className="text-[11px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium disabled:opacity-40 transition-colors"
        >
          reconectar
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          <svg className="w-3 h-3 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span className="break-all">{error}</span>
        </div>
      )}
    </div>
  );
}
