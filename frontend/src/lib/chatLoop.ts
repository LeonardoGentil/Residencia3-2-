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

// Mantém só os últimos N turnos do usuário no contexto enviado ao LLM.
// Cada turno arrasta o assistant + N tool messages. Sem cap, conversa
// longa estoura tokens por minuto em modelos pequenos (Llama 8B = 6k TPM).
const MAX_USER_TURNS_IN_CONTEXT = 8;

// Limite anti-loop: se o LLM chamar a mesma tool com os mesmos args (ou só
// 1 campo diferente) mais de N vezes seguidas, abortamos a iteração e
// devolvemos uma mensagem pro usuário decidir.
const MAX_REPEATED_TOOL_CALLS = 3;

// Tool result muito longo (resposta enorme da API Filazero) é truncado pra
// caber no orçamento de tokens. Caracteres ≈ tokens × 4 em PT-BR.
const MAX_TOOL_RESULT_CHARS = 4000;

// Remove inconsistências do histórico antes de mandar pro LLM.
// Caso clássico: assistant pediu uma tool mas a request foi interrompida
// (user mandou outra mensagem antes do tool result chegar). Sem o tool
// result, OpenAI/Anthropic retornam 400 reclamando de tool_call_ids sem
// resposta. Solução: para cada assistant com tool_calls que não tem todas
// as tool messages logo depois, sintetiza tool messages com placeholder.
function sanitizeHistory(history: ChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (let i = 0; i < history.length; i++) {
    const m = history[i];
    if (!m) continue;
    out.push(m);

    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      // Coleta os tool_call_ids que esse assistant pediu
      const expected = new Set(m.toolCalls.map((tc) => tc.id));
      // Varre as próximas mensagens enquanto forem tool messages
      let j = i + 1;
      while (j < history.length && history[j]?.role === 'tool') {
        const tcid = history[j]?.toolCallId;
        if (tcid) expected.delete(tcid);
        j++;
      }
      // Se sobrou algum tool_call_id sem resposta, sintetiza
      for (const orphan of expected) {
        out.push({
          id: makeId('tool'),
          role: 'tool',
          content: '[chamada interrompida — sem resultado]',
          toolCallId: orphan,
        });
      }
    }
  }
  return out;
}

function trimHistory(history: ChatMessage[]): ChatMessage[] {
  // Encontra o índice do (N+1)-ésimo último user message contando do fim
  let userCount = 0;
  let startIdx = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.role === 'user') {
      userCount++;
      if (userCount > MAX_USER_TURNS_IN_CONTEXT) {
        startIdx = i + 1;
        break;
      }
    }
  }
  return history.slice(startIdx);
}

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

  // Histórico interno acumulando assistant + tool messages para próximas iterações.
  // Sanitize → remove órfãos de tool_call. Trim → limita tokens.
  const internalHistory: ChatMessage[] = [...trimHistory(sanitizeHistory(history)), userMsg];

  const tools = mcpToolsToOpenAI(conn.tools.filter((t) => t.name !== 'login' && t.name !== 'register'));

  // Histórico das últimas tool calls pra detectar loop
  const recentToolCalls: string[] = [];

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

    // ── Anti-loop ───────────────────────────────────────────────────────────
    // Se a mesma tool foi chamada N vezes seguidas, abortamos o loop
    // independentemente dos args. Cobre o caso do modelo rodando
    // get_available_dates pra meses 5,6,7,8,9,10 sem parar.
    for (const tc of toolCalls) {
      recentToolCalls.push(tc.name);
    }
    while (recentToolCalls.length > MAX_REPEATED_TOOL_CALLS + 2) {
      recentToolCalls.shift();
    }
    const sameNameCount = recentToolCalls.filter(
      (n) => n === recentToolCalls[recentToolCalls.length - 1],
    ).length;
    if (sameNameCount > MAX_REPEATED_TOOL_CALLS) {
      const stuckMsg: ChatMessage = {
        id: makeId('asst'),
        role: 'assistant',
        content: `O agente ficou repetindo a tool \`${toolCalls[0]?.name}\` sem progresso. Isso geralmente significa que a empresa/serviço escolhido não tem agenda configurada na staging do Filazero. Tente outra empresa (use \`list_companies\`) ou um serviço diferente.`,
      };
      opts.onMessage(stuckMsg);
      return;
    }

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
        const fullText = result.content
          .map((c) => c.text ?? '')
          .filter(Boolean)
          .join('\n');
        // Versão completa fica visível na UI (ToolCallCard expand). A versão
        // mandada pro LLM é truncada pra preservar TPM.
        const truncated =
          fullText.length > MAX_TOOL_RESULT_CHARS
            ? `${fullText.slice(0, MAX_TOOL_RESULT_CHARS)}\n\n[...truncado: resultado tinha ${fullText.length} chars]`
            : fullText;
        tc.result = fullText;
        tc.status = result.isError ? 'error' : 'done';
        tc.durationMs = Date.now() - start;

        opts.onToolCallEnd(tc, assistantMsgId);

        // Mensagem `role: tool` pra alimentar o próximo turno do LLM
        const toolMsg: ChatMessage = {
          id: makeId('tool'),
          role: 'tool',
          content: truncated,
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
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return { _raw: raw };
  }
}
