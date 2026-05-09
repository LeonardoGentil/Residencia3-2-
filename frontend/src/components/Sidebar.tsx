import ProviderSelector from './ProviderSelector';
import ApiKeyField from './ApiKeyField';
import McpStatus from './McpStatus';
import { getProvider } from '../lib/providers';
import type { McpConnection } from '../lib/types';

interface SidebarProps {
  providerId: string;
  modelId: string;
  apiKey: string;
  mcpUrl: string;
  conn: McpConnection | null;
  connecting: boolean;
  connError: string | null;
  authEmail: string | null;
  onProviderChange: (id: string) => void;
  onModelChange: (id: string) => void;
  onApiKeyChange: (key: string) => void;
  onMcpUrlChange: (url: string) => void;
  onReconnect: () => void;
  onClearChat: () => void;
  onLogout: () => void;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />;
}

export default function Sidebar(props: SidebarProps) {
  const provider = getProvider(props.providerId);
  const visibleTools = props.conn?.tools.filter((t) => t.name !== 'login' && t.name !== 'register') ?? [];

  return (
    <aside className="w-72 bg-slate-900/95 border-r border-white/5 flex flex-col h-full overflow-y-auto chat-scroll shrink-0 relative">
      {/* Linha de gradiente vertical sutil */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none" />

      <div className="p-5 space-y-5 flex-1">
        <section>
          <SectionTitle>Conexão MCP</SectionTitle>
          <McpStatus
            url={props.mcpUrl}
            onUrlChange={props.onMcpUrlChange}
            conn={props.conn}
            connecting={props.connecting}
            error={props.connError}
            onReconnect={props.onReconnect}
          />
        </section>

        <Divider />

        <section>
          <SectionTitle>Modelo de IA</SectionTitle>
          <ProviderSelector
            providerId={props.providerId}
            modelId={props.modelId}
            apiKey={props.apiKey}
            onProviderChange={props.onProviderChange}
            onModelChange={props.onModelChange}
          />
        </section>

        <ApiKeyField
          value={props.apiKey}
          onChange={props.onApiKeyChange}
          signupUrl={provider.signupUrl}
          providerName={provider.name}
        />

        {visibleTools.length > 0 && (
          <>
            <Divider />
            <section>
              <SectionTitle>Tools disponíveis</SectionTitle>
              <ul className="space-y-1">
                {visibleTools.map((t) => (
                  <li
                    key={t.name}
                    title={t.description}
                    className="flex items-center gap-2 text-xs text-slate-500 bg-white/4 border border-white/5 rounded-lg px-2.5 py-1.5 font-mono truncate hover:bg-white/6 hover:text-slate-400 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                    {t.name}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      {/* Rodapé */}
      <div className="p-4 border-t border-white/5 space-y-2 shrink-0 bg-slate-950/40 backdrop-blur-sm">
        {props.authEmail && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="relative w-7 h-7 flex-shrink-0">
              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-30 blur-[4px]" />
              <div className="relative w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white text-[11px] font-bold uppercase">
                  {props.authEmail[0]}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-600 leading-tight">Logado como</p>
              <p className="text-xs text-slate-300 font-medium truncate">{props.authEmail}</p>
            </div>
          </div>
        )}

        <button
          onClick={props.onClearChat}
          className="w-full text-xs text-slate-500 hover:text-slate-200 border border-white/6 hover:border-white/12 hover:bg-white/5 rounded-xl py-2 transition-all font-medium"
        >
          Limpar conversa
        </button>

        <button
          onClick={props.onLogout}
          className="w-full text-xs text-red-500 hover:text-red-400 border border-red-500/15 hover:border-red-500/30 hover:bg-red-500/8 rounded-xl py-2 transition-all font-medium"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
