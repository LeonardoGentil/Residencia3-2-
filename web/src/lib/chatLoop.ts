import { callTool } from './mcpClient';
import { chat, mcpToolsToOpenAI } from './llmClient';
import type {
  ChatMessage,
  McpConnection,
  OpenAIToolCall,
  Provider,
  ToolCall,
} from './types';

const MAX_ITERATIONS = 10;

export interface ChatLoopOptions {
  provider: Provider;
  apiKey: string;
  model: string;
  conn: McpConnection;
  systemPrompt: string;
  history: ChatMessage[];
  userInput: string;
  signal?: AbortSignal;
  onMessage: (msg: ChatMessage) => void;
  onToolCallStart: (call: ToolCall, messageId: string) => void;
  onToolCallEnd: (call: ToolCall, messageId: string) => void;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

function toOpenAIMessages(
  systemPrompt: string,
  history: ChatMessage[],
  newUser: string,
): OpenAIMessage[] {
  const msgs: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const m of history) {
    if (m.role === 'system') continue;
    if (m.role === 'tool') {
      msgs.push({
        role: 'tool',
        content: m.content,
        tool_call_id: m.toolCallId ?? '',
      });
    } else if (m.role === 'assistant') {
      const tcs: OpenAIToolCall[] | undefined = m.toolCalls?.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: JSON.stringify(tc.args) },
      }));
      msgs.push({
        role: 'assistant',
        content: m.content || null,
        ...(tcs && tcs.length > 0 ? { tool_calls: tcs } : {}),
      });
    } else {
      msgs.push({ role: m.role, content: m.content });
    }
  }

  msgs.push({ role: 'user', content: newUser });
  return msgs;
}

export async function runChatLoop(opts: ChatLoopOptions): Promise<void> {
  const { provider, apiKey, model, conn, systemPrompt, history, userInput, signal } = opts;

  // 1. Adiciona mensagem do usuário no histórico visível
  const userMsg: ChatMessage = {
    id: makeId('user'),
    role: 'user',
    content: userInput,
  };
  opts.onMessage(userMsg);

  // Histórico interno acumulando assistant + tool messages para próximas iterações
  const internalHistory: ChatMessage[] = [...history, userMsg];

  const tools = mcpToolsToOpenAI(conn.tools);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const messages = toOpenAIMessages(systemPrompt, internalHistory.slice(0, -1), userInput);

    // Hack: se já estamos em iterações > 0, precisamos enviar todo o histórico
    // incluindo o user e os assistant/tool intermediários
    const fullMessages =
      i === 0
        ? messages
        : ([
            { role: 'system' as const, content: systemPrompt },
            ...internalHistory.flatMap<OpenAIMessage>((m) => {
              if (m.role === 'system') return [];
              if (m.role === 'tool') {
                return [{
                  role: 'tool' as const,
                  content: m.content,
                  tool_call_id: m.toolCallId ?? '',
                }];
              }
              if (m.role === 'assistant') {
                const tcs: OpenAIToolCall[] | undefined = m.toolCalls?.map((tc) => ({
                  id: tc.id,
                  type: 'function',
                  function: { name: tc.name, arguments: JSON.stringify(tc.args) },
                }));
                return [{
                  role: 'assistant' as const,
                  content: m.content || null,
                  ...(tcs && tcs.length > 0 ? { tool_calls: tcs } : {}),
                }];
              }
              return [{ role: m.role as 'user' | 'assistant', content: m.content }];
            }),
          ] as OpenAIMessage[]);

    const response = await chat({
      baseUrl: provider.baseUrl,
      apiKey,
      model,
      messages: fullMessages,
      tools,
      signal,
    });

    // Sem tool calls → resposta final do assistente
    if (response.toolCalls.length === 0) {
      const finalMsg: ChatMessage = {
        id: makeId('asst'),
        role: 'assistant',
        content: response.content || '(sem resposta)',
      };
      opts.onMessage(finalMsg);
      internalHistory.push(finalMsg);
      return;
    }

    // Tem tool calls — registra a mensagem do assistant pedindo as tools
    const assistantMsgId = makeId('asst');
    const toolCalls: ToolCall[] = response.toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      args: safeParseArgs(tc.function.arguments),
      status: 'running' as const,
    }));

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: response.content,
      toolCalls,
    };
    opts.onMessage(assistantMsg);
    internalHistory.push(assistantMsg);

    // Executa cada tool call sequencialmente
    for (const tc of toolCalls) {
      opts.onToolCallStart(tc, assistantMsgId);
      const start = Date.now();
      try {
        const result = await callTool(conn, tc.name, tc.args);
        const text = result.content
          .map((c) => c.text ?? '')
          .filter(Boolean)
          .join('\n');
        tc.result = text;
        tc.status = result.isError ? 'error' : 'done';
        tc.durationMs = Date.now() - start;

        opts.onToolCallEnd(tc, assistantMsgId);

        // Mensagem `role: tool` pra alimentar o próximo turno do LLM
        const toolMsg: ChatMessage = {
          id: makeId('tool'),
          role: 'tool',
          content: text,
          toolCallId: tc.id,
        };
        internalHistory.push(toolMsg);
      } catch (err) {
        tc.status = 'error';
        tc.result = err instanceof Error ? err.message : String(err);
        tc.durationMs = Date.now() - start;
        opts.onToolCallEnd(tc, assistantMsgId);
        internalHistory.push({
          id: makeId('tool'),
          role: 'tool',
          content: `Erro: ${tc.result}`,
          toolCallId: tc.id,
        });
      }
    }
  }

  // Se chegamos aqui é porque estourou MAX_ITERATIONS sem o LLM concluir
  opts.onMessage({
    id: makeId('asst'),
    role: 'assistant',
    content: '(Limite de iterações atingido — o agente fez muitas chamadas de ferramenta sem concluir. Tente reformular a pergunta.)',
  });
}

function safeParseArgs(raw: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { _raw: raw };
  }
}
