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
        className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        title={email}
        aria-label="Menu da conta"
        aria-expanded={open}
      >
        {initials(email)}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                {initials(email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Logado como</div>
                <div className="text-sm text-gray-800 truncate" title={email}>{email}</div>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onSwitchAccount(); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 17v-3H9v-4h7V7l5 5-5 5zM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"/>
              </svg>
              Trocar de conta
            </button>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
