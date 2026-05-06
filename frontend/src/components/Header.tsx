import AccountMenu from './AccountMenu';

interface HeaderProps {
  connected: boolean;
  toolCount: number;
  authEmail: string | null;
  onLogout: () => void;
  onSwitchAccount: () => void;
}

export default function Header({ connected, toolCount, authEmail, onLogout, onSwitchAccount }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          F
        </div>
        <div>
          <h1 className="font-semibold text-gray-800 text-sm">Filazero MCP — Chat</h1>
          <p className="text-xs text-gray-500">Agente conversacional para agendamento</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400 animate-pulse-soft'}`} />
          <span className="text-gray-600">
            {connected ? `${toolCount} tools conectadas` : 'Conectando ao MCP…'}
          </span>
        </div>
        {authEmail && (
          <AccountMenu email={authEmail} onLogout={onLogout} onSwitchAccount={onSwitchAccount} />
        )}
      </div>
    </header>
  );
}
