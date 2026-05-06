import SuggestionChips from './SuggestionChips';

interface EmptyStateProps {
  hasApiKey: boolean;
  hasMcp: boolean;
  onSuggestion: (s: string) => void;
}

export default function EmptyState({ hasApiKey, hasMcp, onSuggestion }: EmptyStateProps) {
  if (!hasMcp) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Conectando ao MCP server</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Verifique se o servidor está rodando. Se o erro persistir, suba com{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">docker compose up</code>.
        </p>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.65 10A6 6 0 0 0 1 12a6 6 0 0 0 11.65 2H17v4h4v-4h2v-4H12.65zM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Configure sua chave de IA</h2>
        <p className="text-sm text-gray-500 max-w-md mb-2">
          Cole no painel à esquerda uma chave gratuita do provider escolhido. Ela fica salva só no seu navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Pronto para conversar</h2>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        Pergunte em linguagem natural sobre empresas, serviços, agendamentos.
        O agente vai usar as tools do MCP automaticamente.
      </p>
      <SuggestionChips onSelect={onSuggestion} />
    </div>
  );
}
