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
  const dotColor =
    status === 'ok' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-400 animate-pulse-soft' : 'bg-red-500';

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1.5">URL do MCP</label>
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
        />
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-xs text-gray-700">
            {status === 'ok'
              ? `Conectado · ${conn?.tools.filter((t) => t.name !== 'login' && t.name !== 'register').length ?? 0} tools`
              : status === 'connecting'
              ? 'Conectando…'
              : 'Desconectado'}
          </span>
        </div>
        <button onClick={onReconnect} disabled={connecting} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
          reconectar
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
