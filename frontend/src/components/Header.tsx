import AccountMenu from './AccountMenu';

interface HeaderProps {
  connected: boolean;
  toolCount: number;
  authEmail: string | null;
  onLogout: () => void;
  onSwitchAccount: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.42 0l.7.7a1 1 0 0 1-1.42 1.42l-.7-.7a1 1 0 0 1 0-1.42zm13.44 13.44a1 1 0 0 1 1.42 0l.7.7a1 1 0 0 1-1.42 1.42l-.7-.7a1 1 0 0 1 0-1.42zM2 12a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1zM4.22 19.78a1 1 0 0 1 0-1.42l.7-.7a1 1 0 0 1 1.42 1.42l-.7.7a1 1 0 0 1-1.42 0zm13.44-13.44a1 1 0 0 1 0-1.42l.7-.7a1 1 0 0 1 1.42 1.42l-.7.7a1 1 0 0 1-1.42 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  );
}

export default function Header({ connected, toolCount, authEmail, onLogout, onSwitchAccount, isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/6 px-5 py-2.5 flex items-center justify-between shrink-0 relative z-20">
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
            <span className="text-slate-900 dark:text-slate-100">Filazero</span>{' '}
            <span className="gradient-text">MCP</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-600 leading-tight">Agente de agendamento conversacional</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
            connected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse-soft'}`} />
          <span className="font-medium">{connected ? `${toolCount} tools` : 'Conectando…'}</span>
        </div>

        <button
          onClick={onToggleTheme}
          title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {authEmail && (
          <AccountMenu email={authEmail} onLogout={onLogout} onSwitchAccount={onSwitchAccount} />
        )}
      </div>
    </header>
  );
}
