import type {
  McpConnection,
  McpPrompt,
  McpResource,
  McpTool,
  McpToolResult,
} from './types';

// ─── MCP HTTP client (StreamableHTTP) ─────────────────────────────────────────
//
// Implementação direta via fetch — evita bundling Node-only do SDK.
// Protocolo: requisições JSON-RPC enviadas como POST /mcp, com cabeçalho
// Accept aceitando JSON ou event-stream. Após initialize o servidor devolve
// um header `mcp-session-id` que precisa ser ecoado nas próximas chamadas.

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

interface InitializeResult {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  serverInfo: { name: string; version: string };
}

interface ListToolsResult {
  tools: McpTool[];
}

interface ListResourcesResult {
  resources: McpResource[];
}

interface ListPromptsResult {
  prompts: McpPrompt[];
}

let nextId = 1;

async function rpc<T>(
  url: string,
  body: JsonRpcRequest,
  sessionId?: string,
): Promise<{ result: T; sessionId?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const newSessionId = res.headers.get('mcp-session-id') ?? undefined;
  const text = await res.text();

  // Pode vir como JSON puro OU como event-stream (data: {...}\n\n)
  let payload: JsonRpcResponse<T> | undefined;
  if (text.startsWith('event:') || text.startsWith('data:')) {
    const dataLine = text.split('\n').find((l) => l.startsWith('data:'));
    if (!dataLine) throw new Error('SSE response sem linha data');
    payload = JSON.parse(dataLine.slice(5).trim()) as JsonRpcResponse<T>;
  } else if (text.trim()) {
    payload = JSON.parse(text) as JsonRpcResponse<T>;
  }

  if (!payload) throw new Error('Resposta vazia');
  if (payload.error) throw new Error(`MCP error ${payload.error.code}: ${payload.error.message}`);
  if (!payload.result) throw new Error('Resposta sem result');

  return { result: payload.result, sessionId: newSessionId };
}

async function notify(url: string, method: string, sessionId: string): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'mcp-session-id': sessionId,
  };
  await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', method }),
  }).catch(() => {
    // notifications são fire-and-forget
  });
}

export async function connect(url: string): Promise<McpConnection> {
  // 1. initialize
  const initRes = await rpc<InitializeResult>(url, {
    jsonrpc: '2.0',
    id: nextId++,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'filazero-mcp-web', version: '0.1.0' },
    },
  });

  const sessionId = initRes.sessionId;
  if (!sessionId) throw new Error('Servidor MCP não retornou mcp-session-id');

  // 2. notifications/initialized
  await notify(url, 'notifications/initialized', sessionId);

  // 3. tools/list, resources/list, prompts/list em paralelo
  const [toolsRes, resourcesRes, promptsRes] = await Promise.all([
    rpc<ListToolsResult>(url, { jsonrpc: '2.0', id: nextId++, method: 'tools/list' }, sessionId),
    rpc<ListResourcesResult>(url, { jsonrpc: '2.0', id: nextId++, method: 'resources/list' }, sessionId).catch(() => ({
      result: { resources: [] },
    })),
    rpc<ListPromptsResult>(url, { jsonrpc: '2.0', id: nextId++, method: 'prompts/list' }, sessionId).catch(() => ({
      result: { prompts: [] },
    })),
  ]);

  return {
    url,
    sessionId,
    tools: toolsRes.result.tools,
    resources: resourcesRes.result.resources,
    prompts: promptsRes.result.prompts,
  };
}

export async function callTool(
  conn: McpConnection,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const res = await rpc<McpToolResult>(
    conn.url,
    {
      jsonrpc: '2.0',
      id: nextId++,
      method: 'tools/call',
      params: { name, arguments: args },
    },
    conn.sessionId,
  );
  return res.result;
}

export async function readResource(conn: McpConnection, uri: string): Promise<string> {
  interface ReadResult {
    contents: Array<{ text?: string }>;
  }
  const res = await rpc<ReadResult>(
    conn.url,
    {
      jsonrpc: '2.0',
      id: nextId++,
      method: 'resources/read',
      params: { uri },
    },
    conn.sessionId,
  );
  return res.result.contents.map((c) => c.text ?? '').join('\n');
}
