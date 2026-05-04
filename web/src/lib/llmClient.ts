import type { LLMRequest, LLMResponse, McpTool, OpenAITool } from './types';

// Erro tipado para o front conseguir contextualizar a mensagem
export class LLMError extends Error {
  status: number;
  raw: string;
  constructor(status: number, message: string, raw: string) {
    super(message);
    this.status = status;
    this.raw = raw;
    this.name = 'LLMError';
  }
}

// Alguns providers (Groq, Gemini) rejeitam campos de schema desconhecidos
// como `additionalProperties`, `$schema`, `definitions`. Sanitização recursiva
// remove esses campos antes de mandar.
export function sanitizeSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(sanitizeSchema);
  if (schema !== null && typeof schema === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
      if (k === 'additionalProperties' || k === '$schema' || k === 'definitions') continue;
      out[k] = sanitizeSchema(v);
    }
    return out;
  }
  return schema;
}

export function mcpToolsToOpenAI(tools: McpTool[]): OpenAITool[] {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: sanitizeSchema(t.inputSchema) as Record<string, unknown>,
    },
  }));
}

function buildHeaders(baseUrl: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  // OpenRouter recomenda esses headers — sem eles, requests anônimas
  // entram em fila de prioridade mais baixa nos providers upstream
  // (https://openrouter.ai/docs/api-reference/overview).
  if (baseUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    headers['X-Title'] = 'Filazero MCP Web Client';
  }
  // Anthropic exige version + a chave também via x-api-key (aceita ambos)
  // no endpoint OpenAI-compat oficial.
  if (baseUrl.includes('api.anthropic.com')) {
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
    headers['x-api-key'] = apiKey;
  }
  return headers;
}

export interface RemoteModel {
  id: string;
  label: string;
}

// Lista os modelos que a chave do usuário tem acesso de fato. Cada provider
// expõe /v1/models no padrão OpenAI. Falha de rede ou 401 retorna lista vazia
// e o caller cai pro fallback hardcoded em providers.ts.
export async function listModels(baseUrl: string, apiKey: string): Promise<RemoteModel[]> {
  if (!apiKey) return [];
  const url = `${baseUrl.replace(/\/$/, '')}/models`;
  try {
    const res = await fetch(url, { headers: buildHeaders(baseUrl, apiKey) });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Array<{ id: string; name?: string }> };
    const items = json.data ?? [];
    return items
      .map((m) => ({ id: m.id, label: m.name ?? m.id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    return [];
  }
}

function extractErrorMessage(status: number, errText: string): string {
  let parsed: { error?: { message?: string; code?: string } } = {};
  try {
    parsed = JSON.parse(errText);
  } catch {
    // not json
  }
  return parsed.error?.message ?? errText.slice(0, 300) ?? `HTTP ${status}`;
}

async function doChat(req: LLMRequest): Promise<LLMResponse> {
  const url = `${req.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
    temperature: 0.2,
    max_tokens: 1024,
  };
  if (req.tools && req.tools.length > 0) {
    body['tools'] = req.tools;
    body['tool_choice'] = 'auto';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(req.baseUrl, req.apiKey),
    body: JSON.stringify(body),
    signal: req.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new LLMError(res.status, extractErrorMessage(res.status, errText), errText);
  }

  const data = (await res.json()) as {
    choices: Array<{
      message: {
        role: string;
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason: string;
    }>;
  };

  const choice = data.choices?.[0];
  if (!choice) throw new LLMError(500, 'LLM não retornou nenhuma escolha', JSON.stringify(data));

  return {
    content: choice.message.content ?? '',
    toolCalls: choice.message.tool_calls ?? [],
    finishReason: choice.finish_reason ?? 'stop',
  };
}

export async function chat(req: LLMRequest): Promise<LLMResponse> {
  // Retry curto em 429 — saturação transiente do provider upstream costuma
  // resolver em poucos segundos. Não retry em outros códigos.
  try {
    return await doChat(req);
  } catch (err) {
    if (err instanceof LLMError && err.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      return await doChat(req);
    }
    throw err;
  }
}
