import type { LLMRequest, LLMResponse, McpTool, OpenAITool } from './types';

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

export async function chat(req: LLMRequest): Promise<LLMResponse> {
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: req.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let parsed: { error?: { message?: string } } = {};
    try {
      parsed = JSON.parse(errText);
    } catch {
      // not json
    }
    const msg = parsed.error?.message ?? errText.slice(0, 300) ?? `HTTP ${res.status}`;
    throw new Error(`LLM ${res.status}: ${msg}`);
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
  if (!choice) throw new Error('LLM não retornou nenhuma escolha');

  return {
    content: choice.message.content ?? '',
    toolCalls: choice.message.tool_calls ?? [],
    finishReason: choice.finish_reason ?? 'stop',
  };
}
