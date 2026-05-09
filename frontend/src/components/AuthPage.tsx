import { useState } from 'react';
import type { McpConnection } from '../lib/types';
import { callTool } from '../lib/mcpClient';

interface AuthPageProps {
  conn: McpConnection | null;
  connecting: boolean;
  connError: string | null;
  onAuthenticated: (token: string, email: string) => void;
}

type Mode = 'login' | 'register';

const GOOGLE_DEMO_EMAIL = 'usuario.demo@gmail.com';

export default function AuthPage({ conn, connecting, connError, onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function extractToken(text: string): { token: string | null; email: string | null } {
    try {
      const json = JSON.parse(text);
      return { token: json.access_token ?? null, email: json.userName ?? json.email ?? null };
    } catch {
      return { token: null, email: null };
    }
  }

  async function submitEmailFlow(e: React.FormEvent) {
    e.preventDefault();
    if (!conn) return;
    setLoading(true);
    setError(null);
    try {
      const args = mode === 'login' ? { email, password } : { email, password, name };
      const result = await callTool(conn, mode, args);
      const text = result.content.map((c) => c.text ?? '').join('\n');
      if (result.isError) throw new Error(text);
      const { token } = extractToken(text);
      if (!token) throw new Error('Servidor não retornou access_token.');
      onAuthenticated(token, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    if (!conn) return;
    setLoading(true);
    setError(null);
    try {
      const result = await callTool(conn, 'login', { email: GOOGLE_DEMO_EMAIL, password: 'demo-google' });
      const text = result.content.map((c) => c.text ?? '').join('\n');
      if (result.isError) throw new Error(text);
      const { token } = extractToken(text);
      if (!token) throw new Error('Servidor não retornou access_token.');
      onAuthenticated(token, GOOGLE_DEMO_EMAIL);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const ready = conn !== null;
  const submitDisabled = !ready || loading || !email || !password || (mode === 'register' && !name);

  const mcpStatus = conn ? 'ok' : connecting ? 'connecting' : 'error';
  const mcpColors = {
    ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    connecting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  }[mcpStatus];
  const dotColors = {
    ok: 'bg-emerald-400',
    connecting: 'bg-amber-400 animate-pulse-soft',
    error: 'bg-red-400',
  }[mcpStatus];
  const mcpLabel = conn
    ? `Conectado · ${conn.tools.filter((t) => t.name !== 'login' && t.name !== 'register').length} tools`
    : connecting
    ? 'Conectando ao servidor MCP…'
    : (connError ?? 'Servidor MCP indisponível');

  const inputCls =
    'w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 ' +
    'placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/70 ' +
    'focus:border-blue-500/50 focus:bg-white/8 transition-all';

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden relative">

      {/* Orbs de fundo animados */}
      <div className="absolute top-[-180px] left-[-80px] w-[550px] h-[550px] bg-blue-600/18 rounded-full blur-[110px] animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-60px] w-[480px] h-[480px] bg-violet-600/14 rounded-full blur-[100px] animate-orb-2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-900/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Conteúdo */}
      <div className="relative w-full max-w-sm z-10">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-14 h-14 mb-4">
            <div className="absolute inset-0 bg-blue-600 rounded-2xl animate-avatar-glow" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-black select-none">F</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Filazero <span className="gradient-text">MCP</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Agente conversacional de agendamento</p>
        </div>

        {/* Card glassmorphism */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-2xl p-7 shadow-2xl space-y-5">

          {/* Status MCP */}
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${mcpColors}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors}`} />
            <span className="truncate">{mcpLabel}</span>
          </div>

          {/* Toggle */}
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-blue-600/80 text-white shadow-sm shadow-blue-900/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* Botão Google */}
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={!ready || loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white/5 border border-white/10 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-slate-100 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-xs text-slate-600">ou</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Formulário */}
          <form onSubmit={submitEmailFlow} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Nome completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome" autoComplete="name" className={inputCls} />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" autoComplete="email" className={inputCls} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={`${inputCls} pr-12`}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="btn-primary w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-800/50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Aguarde…
                </>
              ) : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-slate-700 text-center mt-5 px-2">
          Servidor em modo demo — qualquer credencial é aceita.
        </p>
      </div>
    </div>
  );
}
