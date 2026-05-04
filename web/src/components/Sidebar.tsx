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
  onProviderChange: (id: string) => void;
  onModelChange: (id: string) => void;
  onApiKeyChange: (key: string) => void;
  onMcpUrlChange: (url: string) => void;
  onReconnect: () => void;
  onClearChat: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const provider = getProvider(props.providerId);

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto chat-scroll">
      <div className="p-5 space-y-5">
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Conexão MCP
          </h2>
          <McpStatus
            url={props.mcpUrl}
            onUrlChange={props.onMcpUrlChange}
            conn={props.conn}
            connecting={props.connecting}
            error={props.connError}
            onReconnect={props.onReconnect}
          />
        </section>

        <hr className="border-gray-100" />

        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            IA
          </h2>
          <ProviderSelector
            providerId={props.providerId}
            modelId={props.modelId}
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

        {props.conn && props.conn.tools.length > 0 && (
          <>
            <hr className="border-gray-100" />
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tools disponíveis
              </h2>
              <ul className="space-y-1">
                {props.conn.tools.map((t) => (
                  <li
                    key={t.name}
                    className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 font-mono truncate"
                    title={t.description}
                  >
                    {t.name}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      <div className="mt-auto p-5 border-t border-gray-100">
        <button
          onClick={props.onClearChat}
          className="w-full text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg py-2 transition-colors"
        >
          limpar conversa
        </button>
      </div>
    </aside>
  );
}
