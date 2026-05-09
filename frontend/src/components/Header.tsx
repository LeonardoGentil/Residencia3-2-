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
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-white/6 px-5 py-2.5 flex items-center justify-between shrink-0 relative z-20">
      {/* Linha de gradiente sutil na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-blue-600 rounded-xl opacity-40 blur-[6px]" />
          <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm select-none">F</span>
          </div>
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">
            <span className="text-slate-100">Filazero</span>{' '}
            <span className="gradient-text">MCP</span>
          </h1>
          <p className="text-[11px] text-slate-600 leading-tight">Agente de agendamento conversacional</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
            connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse-soft'}`} />
          <span className="font-medium">{connected ? `${toolCount} tools` : 'Conectando…'}</span>
        </div>

        {authEmail && (
          <AccountMenu email={authEmail} onLogout={onLogout} onSwitchAccount={onSwitchAccount} />
        )}
      </div>
    </header>
  );
}
