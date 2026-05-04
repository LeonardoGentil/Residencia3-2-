import { useEffect, useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { connect, readResource } from './lib/mcpClient';
import { getProvider } from './lib/providers';
import {
  getApiKey,
  setApiKey,
  getMcpUrl,
  setMcpUrl as persistMcpUrl,
  getSelectedModel,
  getSelectedProvider,
  setSelectedModel,
  setSelectedProvider,
} from './lib/storage';
import type { ChatMessage, McpConnection } from './lib/types';

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente da Filazero, plataforma brasileira que elimina filas presenciais.

Você tem acesso a tools para autenticar (login), listar empresas, ver serviços, buscar dias e horários disponíveis, obter o formulário de agendamento, agendar consultas e consultar status de tickets.

Regras:
- Sempre responda em português brasileiro.
- NUNCA invente nomes de empresas, serviços, datas ou horários — use SOMENTE dados retornados pelas tools.
- Sempre que possível, siga a ordem: list_companies → get_company_services → get_available_dates → get_available_sessions → get_booking_form → schedule_appointment.
- Use abstractServiceId nos passos onde for fornecido.
- Para schedule_appointment e list_my_tickets é necessário um Bearer token. Você pode obtê-lo chamando a tool 'login' (que pode estar bloqueada se o servidor estiver em modo HTTP).
- Quando uma tool falhar, explique o erro e proponha próximos passos.`;

export default function App() {
  // Provider / modelo / chave
  const [providerId, setProviderId] = useState<string>(() => getSelectedProvider());
  const provider = getProvider(providerId);
  const [modelId, setModelId] = useState<string>(
    () => getSelectedModel(providerId) ?? provider.defaultModel,
  );
  const [apiKey, setApiKeyState] = useState<string>(() => getApiKey(providerId));

  // MCP
  const [mcpUrl, setMcpUrlState] = useState<string>(() => getMcpUrl());
  const [conn, setConn] = useState<McpConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);

  // System prompt — tenta ler do MCP, com fallback
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Conecta ao MCP
  const reconnect = useCallback(async (url: string) => {
    setConnecting(true);
    setConnError(null);
    setConn(null);
    try {
      const c = await connect(url);
      setConn(c);

      // Tenta enriquecer o system prompt com o resource scheduling-flow
      try {
        const flow = await readResource(c, 'filazero://scheduling-flow');
        if (flow) {
          setSystemPrompt(`${DEFAULT_SYSTEM_PROMPT}\n\n--- Guia interno ---\n${flow}`);
        }
      } catch {
        // Resource é opcional
      }
    } catch (e) {
      setConnError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  }, []);

  // Conecta no mount e quando mudar URL
  const lastUrl = useRef(mcpUrl);
  useEffect(() => {
    void reconnect(mcpUrl);
    lastUrl.current = mcpUrl;
  }, [reconnect, mcpUrl]);

  // Persiste mudanças
  function handleProviderChange(id: string) {
    setProviderId(id);
    setSelectedProvider(id);
    const p = getProvider(id);
    const persistedModel = getSelectedModel(id);
    const newModel = persistedModel ?? p.defaultModel;
    setModelId(newModel);
    setApiKeyState(getApiKey(id));
  }

  function handleModelChange(id: string) {
    setModelId(id);
    setSelectedModel(providerId, id);
  }

  function handleApiKeyChange(key: string) {
    setApiKeyState(key);
    setApiKey(providerId, key);
  }

  function handleMcpUrlChange(url: string) {
    setMcpUrlState(url);
    persistMcpUrl(url);
  }

  return (
    <div className="h-screen flex flex-col">
      <Header connected={!!conn} toolCount={conn?.tools.length ?? 0} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          providerId={providerId}
          modelId={modelId}
          apiKey={apiKey}
          mcpUrl={mcpUrl}
          conn={conn}
          connecting={connecting}
          connError={connError}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          onApiKeyChange={handleApiKeyChange}
          onMcpUrlChange={handleMcpUrlChange}
          onReconnect={() => reconnect(mcpUrl)}
          onClearChat={() => setMessages([])}
        />
        <Chat
          provider={provider}
          apiKey={apiKey}
          modelId={modelId}
          conn={conn}
          systemPrompt={systemPrompt}
          messages={messages}
          setMessages={setMessages}
        />
      </div>
    </div>
  );
}
