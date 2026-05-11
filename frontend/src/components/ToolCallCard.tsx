import { useState } from 'react';
import type { ToolCall } from '../lib/types';

interface ToolCallCardProps {
  call: ToolCall;
}

export default function ToolCallCard({ call }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const safeArgs = call.args ?? {};
  const argsStr = Object.keys(safeArgs).length > 0 ? JSON.stringify(safeArgs) : '';

  const isRunning = call.status === 'running';
  const isError = call.status === 'error';
  const isDone = call.status === 'done';

  const containerCls = isRunning
    ? 'border-blue-500/30 bg-blue-500/5'
    : isDone
    ? 'border-emerald-500/30 bg-emerald-500/5'
    : 'border-red-500/30 bg-red-500/5';

  return (
    <div className={`border rounded-xl overflow-hidden text-xs transition-all ${containerCls}`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
      >
        {isRunning && (
          <svg className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 animate-spin-slow flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {isDone && (
          <svg className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.55 18 3.5 11.95l1.45-1.45 4.6 4.6 9.45-9.45L20.45 7Z" />
          </svg>
        )}
        {isError && (
          <svg className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12Z" />
          </svg>
        )}

        <code className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{call.name}</code>

        {argsStr && (
          <span className="text-[11px] text-slate-500 dark:text-slate-600 truncate font-mono flex-1 min-w-0">
            {argsStr}
          </span>
        )}

        {call.durationMs !== undefined && (
          <span className="text-[10px] text-slate-400 dark:text-slate-600 ml-auto flex-shrink-0 tabular-nums">
            {call.durationMs < 1000 ? `${call.durationMs}ms` : `${(call.durationMs / 1000).toFixed(1)}s`}
          </span>
        )}

        <svg
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-black/8 dark:border-white/5 bg-black/5 dark:bg-black/20 px-3 py-3 space-y-3">
          {Object.keys(safeArgs).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-wider mb-1.5">Argumentos</p>
              <pre className="text-[11px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 overflow-x-auto">
                {JSON.stringify(safeArgs, null, 2)}
              </pre>
            </div>
          )}
          {call.result && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-wider mb-1.5">
                {isError ? 'Erro' : 'Resultado'}
              </p>
              <pre
                className={`text-[11px] font-mono rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap break-words max-h-56 overflow-y-auto border ${
                  isError
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {call.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
