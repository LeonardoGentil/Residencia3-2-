import { useEffect, useRef, useState } from 'react';

interface AccountMenuProps {
  email: string;
  onLogout: () => void;
  onSwitchAccount: () => void;
}

function initials(email: string): string {
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function AccountMenu({ email, onLogout, onSwitchAccount }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEsc);
      };
    }
    return undefined;
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 group"
        title={email}
        aria-label="Menu da conta"
        aria-expanded={open}
      >
        <div className="absolute inset-0 bg-blue-600 rounded-full opacity-40 blur-[5px] group-hover:opacity-60 transition-opacity" />
        <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {initials(email)}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
          {/* Header do menu */}
          <div className="px-4 py-3 border-b border-white/6 bg-white/3">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 flex-shrink-0">
                <div className="absolute inset-0 bg-blue-600 rounded-full opacity-30 blur-[4px]" />
                <div className="relative w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {initials(email)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Logado como</div>
                <div className="text-sm text-slate-200 truncate" title={email}>{email}</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="py-1.5">
            <button
              onClick={() => { setOpen(false); onSwitchAccount(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/6 hover:text-slate-100 flex items-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 17v-3H9v-4h7V7l5 5-5 5zM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"/>
              </svg>
              Trocar de conta
            </button>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
