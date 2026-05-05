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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function extractToken(text: string): { token: string | null; email: string | null } {
    try {
      const json = JSON.parse(text);
      return {
        token: json.access_token ?? null,
        email: json.userName ?? json.email ?? null,
      };
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
      const args =
        mode === 'login'
          ? { email, password }
          : { email, password, name };
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
      // Em demo mode o servidor aceita qualquer email/senha. Em produção,
      // isso exigiria OAuth real do Google — ainda fora de escopo da residência.
      const result = await callTool(conn, 'login', {
        email: GOOGLE_DEMO_EMAIL,
        password: 'demo-google',
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
            F
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">Filazero MCP</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse para usar o agente conversacional</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Status da conexão MCP */}
          <div className="flex items-center gap-2 mb-4 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                conn ? 'bg-green-500' : connecting ? 'bg-yellow-400 animate-pulse-soft' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-600">
              {conn
                ? `Conectado · ${conn.tools.length} tools`
                : connecting
                ? 'Conectando ao MCP…'
                : connError ?? 'Servidor MCP indisponível'}
            </span>
          </div>

          {/* Toggle login/register */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Botão Google */}
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={!ready || loading}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1 border-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          {/* Form email/senha */}
          <form onSubmit={submitEmailFlow} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-4">
          Servidor em modo demo: qualquer credencial é aceita. A demo gera tokens sintéticos para o fluxo de agendamento.
        </p>
      </div>
    </div>
  );
}
