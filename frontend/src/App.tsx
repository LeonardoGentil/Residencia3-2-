import { useEffect, useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import AuthPage from './components/AuthPage';
import { connect } from './lib/mcpClient';
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
  getAuthToken,
  setAuthToken,
  getAuthEmail,
  setAuthEmail,
} from './lib/storage';
import type { ChatMessage, McpConnection } from './lib/types';

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente da Filazero, plataforma brasileira que elimina filas presenciais.

Você tem acesso a tools para autenticar (login), listar empresas, ver serviços, buscar dias e horários disponíveis, obter o formulário de agendamento, agendar consultas e consultar status de tickets.

Regras:
- Sempre responda em português brasileiro.
- NUNCA escreva chamadas de função como texto puro na resposta (ex: sintaxe de XML/JSON com nome de tool, blocos de código com tool call). Use APENAS o mecanismo nativo de tool calling. Se quiser chamar uma tool, chame-a diretamente — nunca a imprima como texto.

PRINCÍPIO DE MÍNIMO ESFORÇO (mais importante que qualquer outra regra):
- Faça O MÍNIMO de tool calls necessárias pra responder o que o usuário pediu nesta mensagem.
- Se o usuário pediu listar/consultar algo: rode A tool específica e PARE. Mostre a resposta e pergunte o que fazer. NÃO chame tools "preventivamente" pra adiantar próximos passos.
- Encadeamento de múltiplas tools só quando o usuário explicitou intent agregada — ex: "quero agendar uma consulta na empresa X", "me leve até o horário disponível mais próximo". Aí sim segue: list_companies → get_company_services → get_available_dates → get_available_sessions → get_booking_form → schedule_appointment.
- Em dúvida sobre intent: faça apenas a primeira tool, mostre o resultado e pergunte o próximo passo em 1 linha.

Validação de parâmetros:
- TODOS os parâmetros (slug, serviceId, locationId, sessionId, providerId, date) DEVEM vir literais de uma tool anterior. Se você não tem o valor, NÃO INVENTE — chame a tool anterior primeiro (get_available_dates retorna locationId, get_available_sessions retorna sessionId).
- Use abstractServiceId quando o serviço tiver esse campo.
- schedule_appointment e list_my_tickets exigem Bearer token (tool 'login'). list_my_tickets já retorna tickets do usuário logado — não pode ser usada sem token.

REGRAS ANTI-LOOP (críticas):
- Se uma tool retornar "Nenhuma vaga disponível", "não encontrado" ou similar, ISSO NÃO É ERRO TÉCNICO. É resposta válida. PARE imediatamente, informe o usuário em 1 linha e pergunte se quer tentar outro serviço/empresa. NÃO tente outros meses, IDs ou variações automaticamente.
- NUNCA chame a mesma tool com argumentos parecidos mais de 2 vezes seguidas. Se algo falhou 2x, pare e explique pro usuário.

Quando tool falhar de verdade (timeout, erro 500, auth), leia a mensagem, explique em 1 frase ao usuário e pergunte como prosseguir.`;

function getInitialTheme(): boolean {
  const stored = localStorage.getItem('theme');
  if (stored !== null) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  // Tema
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  function toggleTheme() {
    setIsDark((prev) => !prev);
  }

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

  // Auth — gate antes do chat
  const [authToken, setAuthTokenState] = useState<string | null>(() => getAuthToken());
  const [authEmail, setAuthEmailState] = useState<string | null>(() => getAuthEmail());

  const systemPrompt = authToken
    ? `${DEFAULT_SYSTEM_PROMPT}\n\nUsuário já autenticado. E-mail: ${authEmail}. Use este Bearer token quando precisar (schedule_appointment, list_my_tickets): ${authToken}`
    : DEFAULT_SYSTEM_PROMPT;

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function handleAuthenticated(token: string, email: string) {
    setAuthTokenState(token);
    setAuthEmailState(email);
    setAuthToken(token);
    setAuthEmail(email);
  }

  function handleLogout() {
    setAuthTokenState(null);
    setAuthEmailState(null);
    setAuthToken(null);
    setAuthEmail(null);
    setMessages([]);
  }

  const reconnect = useCallback(async (url: string) => {
    setConnecting(true);
    setConnError(null);
    setConn(null);
    try {
      const c = await connect(url);
      setConn(c);
    } catch (e) {
      setConnError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  }, []);

  const lastUrl = useRef(mcpUrl);
  useEffect(() => {
    void reconnect(mcpUrl);
    lastUrl.current = mcpUrl;
  }, [reconnect, mcpUrl]);

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

  if (!authToken) {
    return (
      <AuthPage
        conn={conn}
        connecting={connecting}
        connError={connError}
        onAuthenticated={handleAuthenticated}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        connected={!!conn}
        toolCount={conn?.tools.filter((t) => t.name !== 'login' && t.name !== 'register').length ?? 0}
        authEmail={authEmail}
        onLogout={handleLogout}
        onSwitchAccount={handleLogout}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          providerId={providerId}
          modelId={modelId}
          apiKey={apiKey}
          mcpUrl={mcpUrl}
          conn={conn}
          connecting={connecting}
          connError={connError}
          authEmail={authEmail}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          onApiKeyChange={handleApiKeyChange}
          onMcpUrlChange={handleMcpUrlChange}
          onReconnect={() => reconnect(mcpUrl)}
          onClearChat={() => setMessages([])}
          onLogout={handleLogout}
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
