import { useState } from 'react';
import type { ToolCall } from '../lib/types';

interface ToolCallCardProps {
  call: ToolCall;
}

export default function ToolCallCard({ call }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    call.status === 'running' ? (
      <svg className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ) : call.status === 'done' ? (
      <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.55 18 3.5 11.95l1.45-1.45 4.6 4.6 9.45-9.45L20.45 7Z" />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12Z" />
      </svg>
    );

  const statusColor =
    call.status === 'running'
      ? 'border-blue-200 bg-blue-50'
      : call.status === 'done'
      ? 'border-green-200 bg-green-50'
      : 'border-red-200 bg-red-50';

  const safeArgs = call.args ?? {};
  const argsStr = Object.keys(safeArgs).length > 0 ? JSON.stringify(safeArgs) : '';

  return (
    <div className={`border rounded-xl ${statusColor} overflow-hidden`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-black/5 transition-colors text-left"
      >
        {statusIcon}
        <code className="text-xs font-mono text-gray-800 font-medium">{call.name}</code>
        {argsStr && <span className="text-[11px] text-gray-500 truncate font-mono flex-1">{argsStr}</span>}
        {call.durationMs !== undefined && (
          <span className="text-[10px] text-gray-500 ml-auto">
            {call.durationMs < 1000 ? `${call.durationMs}ms` : `${(call.durationMs / 1000).toFixed(1)}s`}
          </span>
        )}
        <svg className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-black/5 bg-white/60 px-3 py-2 space-y-2">
          {Object.keys(safeArgs).length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Argumentos</div>
              <pre className="text-[11px] font-mono bg-white border border-gray-200 rounded p-2 overflow-x-auto">
                {JSON.stringify(safeArgs, null, 2)}
              </pre>
            </div>
          )}
          {call.result && (
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                {call.status === 'error' ? 'Erro' : 'Resultado'}
              </div>
              <pre className="text-[11px] font-mono bg-white border border-gray-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {call.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
