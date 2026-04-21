/**
 * Cliente de demonstração — Filazero MCP + Groq
 *
 * Conecta ao MCP Server via stdio e usa o Groq (free tier) como LLM
 * para demonstrar o fluxo de agendamento de forma conversacional.
 *
 * Uso:
 *   npm run demo
 */

import 'dotenv/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'groq-sdk/resources/chat/completions';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import path from 'node:path';

// Groq rejeita campos desconhecidos do JSON Schema (ex: additionalProperties).
// Esta função os remove recursivamente antes de passar para o SDK.
function sanitizeSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(sanitizeSchema);
  if (schema !== null && typeof schema === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
      if (k === 'additionalProperties' || k === '$schema') continue;
      out[k] = sanitizeSchema(v);
    }
    return out;
  }
  return schema;
}

const SYSTEM_PROMPT = `Você é um assistente da Filazero, plataforma brasileira que elimina filas presenciais.

Você tem acesso a ferramentas para:
- Listar empresas disponíveis (list_companies)
- Ver serviços de uma empresa (get_company_services)
- Verificar dias disponíveis (get_available_dates)
- Ver horários e profissionais (get_available_sessions)
- Obter campos do formulário (get_booking_form)
- Realizar agendamentos (schedule_appointment) — requer Bearer token
- Consultar status de ticket (check_ticket_status)
- Listar meus tickets (list_my_tickets) — requer Bearer token

Regras importantes:
- Sempre responda em português brasileiro
- NUNCA invente ou assuma nomes de empresas, serviços, datas ou horários — use SOMENTE os dados retornados pelas ferramentas
- Siga o fluxo na ordem: list_companies → get_company_services → get_available_dates → get_available_sessions → get_booking_form → schedule_appointment
- Para chamar get_available_sessions, use como "locationId" o campo "id" da empresa retornado por list_companies (ex: se a empresa tem id=3390, use locationId=3390)
- Sempre chame list_companies antes de listar qualquer empresa; apresente exatamente os nomes retornados pela ferramenta
- Para datas, sempre apresente no formato brasileiro (DD/MM/AAAA)
- Quando precisar de Bearer token, peça ao usuário antes de chamar a tool
- Seja proativo: quando listar opções, já pergunte qual o usuário quer escolher

Apresente as informações de forma clara e organizada, usando listas quando apropriado.`;

async function main(): Promise<void> {
  const apiKey = process.env['GROQ_API_KEY'];
  if (!apiKey) {
    console.error('\n❌ GROQ_API_KEY não encontrada.');
    console.error('   Adicione ao arquivo .env: GROQ_API_KEY=sua_chave_aqui');
    console.error('   Obtenha grátis em: https://console.groq.com/keys\n');
    process.exit(1);
  }

  // ─── MCP Client ───────────────────────────────────────────────────────────

  const serverPath = path.join(__dirname, '../index.js');

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env, MCP_TRANSPORT: 'stdio' },
  });

  const mcpClient = new Client(
    { name: 'filazero-demo', version: '1.0.0' },
    { capabilities: {} },
  );

  process.stdout.write('🔌 Conectando ao MCP Server Filazero...');
  await mcpClient.connect(transport);
  console.log(' ✅\n');

  // ─── Load tools ───────────────────────────────────────────────────────────

  const { tools: mcpTools } = await mcpClient.listTools();
  console.log(`📦 ${mcpTools.length} tools carregadas: ${mcpTools.map((t) => t.name).join(', ')}\n`);

  const groqTools: ChatCompletionTool[] = mcpTools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description ?? '',
      parameters: sanitizeSchema(tool.inputSchema) as Record<string, unknown>,
    },
  }));

  // ─── Groq setup ───────────────────────────────────────────────────────────

  const groq = new Groq({ apiKey });
  const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

  const now = new Date();
  const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const systemWithDate = `${SYSTEM_PROMPT}\n\nData atual: ${currentDate}. Sempre use o ano e mês atuais (ou futuros) ao buscar datas disponíveis. NUNCA busque datas no passado.`;

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemWithDate },
  ];

  // ─── Chat loop ────────────────────────────────────────────────────────────

  const rl = createInterface({ input: stdin, output: stdout });

  console.log('─'.repeat(60));
  console.log('💬 Assistente Filazero pronto! (modelo: ' + MODEL + ')');
  console.log('   Experimente: "Quero agendar um atendimento"');
  console.log('   Digite "sair" para encerrar.');
  console.log('─'.repeat(60) + '\n');

  while (true) {
    const userMessage = await rl.question('Você: ');

    if (userMessage.toLowerCase().trim() === 'sair') break;
    if (!userMessage.trim()) continue;

    messages.push({ role: 'user', content: userMessage });

    try {
      // Agentic loop: keep resolving tool calls until Groq returns text
      while (true) {
        const completion = await groq.chat.completions.create({
          model: MODEL,
          messages,
          tools: groqTools,
          tool_choice: 'auto',
        });

        const choice = completion.choices[0];
        if (!choice) break;

        const assistantMessage = choice.message;
        messages.push(assistantMessage as ChatCompletionMessageParam);

        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          console.log(`\nAssistente: ${assistantMessage.content ?? ''}\n`);
          break;
        }

        for (const call of assistantMessage.tool_calls) {
          process.stdout.write(`  🔧 ${call.function.name}... `);

          let toolResult: string;
          try {
            let args: Record<string, unknown> = {};
            const raw = call.function.arguments?.trim();
            if (raw && raw !== 'null') {
              try {
                const parsed = JSON.parse(raw) as unknown;
                args = (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed))
                  ? (parsed as Record<string, unknown>)
                  : {};
              } catch {
                // Groq às vezes gera JSON malformado — tenta corrigir adicionando "}"
                try {
                  const fixed = raw.endsWith('}') ? raw : raw + '}';
                  const parsed = JSON.parse(fixed) as unknown;
                  args = (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed))
                    ? (parsed as Record<string, unknown>)
                    : {};
                } catch {
                  // Se ainda falhar, usa {} para tools sem parâmetros
                  args = {};
                }
              }
            }
            const result = await mcpClient.callTool({ name: call.function.name, arguments: args });

            const isError = (result as { isError?: boolean }).isError === true;
            process.stdout.write(isError ? '⚠️\n' : '✅\n');

            // Extrai o texto plano em vez de double-stringify para o LLM ler melhor
            const contentArray = result.content as Array<{ type: string; text?: string }>;
            toolResult = contentArray.map((c) => c.text ?? '').join('\n');
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            process.stdout.write(`❌ ${message}\n`);
            toolResult = JSON.stringify({ error: message });
          }

          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: toolResult,
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n❌ Erro: ${message}\n`);
    }
  }

  rl.close();
  await mcpClient.close();
  console.log('\nAté logo! 👋');
}

main().catch((err: unknown) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
