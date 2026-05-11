import SuggestionChips from './SuggestionChips';

interface EmptyStateProps {
  hasApiKey: boolean;
  hasMcp: boolean;
  onSuggestion: (s: string) => void;
}

export default function EmptyState({ hasApiKey, hasMcp, onSuggestion }: EmptyStateProps) {
  if (!hasMcp) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-amber-500 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">Aguardando conexão MCP</h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Verifique se o servidor está rodando. Se o erro persistir, suba com{' '}
          <code className="bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700 dark:text-slate-300">
            docker compose up
          </code>
          .
        </p>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.65 10A6 6 0 0 0 1 12a6 6 0 0 0 11.65 2H17v4h4v-4h2v-4H12.65zM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">Configure sua chave de IA</h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Cole uma chave gratuita no painel à esquerda. Ela fica salva apenas no seu navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">

      {/* Logo com anéis animados */}
      <div className="relative flex items-center justify-center mb-7">
        <div className="absolute w-14 h-14 rounded-2xl border border-blue-500/40 animate-ring-1" />
        <div className="absolute w-14 h-14 rounded-2xl border border-blue-400/25 animate-ring-2" />
        <div className="absolute w-14 h-14 rounded-2xl border border-blue-300/15 animate-ring-3" />
        <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
          <span className="text-white text-2xl font-black select-none">F</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        Pronto para conversar
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-10 leading-relaxed">
        Use linguagem natural para consultar empresas, serviços e horários.
        O agente aciona as tools do MCP automaticamente.
      </p>

      <div className="w-full max-w-lg">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-700 uppercase tracking-widest mb-3">Sugestões</p>
        <SuggestionChips onSelect={onSuggestion} />
      </div>
    </div>
  );
}
