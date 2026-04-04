import http from 'node:http';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from './logger/index.js';

// Tools
import { listCompanies, listCompaniesSchema } from './tools/list-companies.js';
import { getCompanyServices, getCompanyServicesSchema } from './tools/get-company-services.js';
import { getAvailableDates, getAvailableDatesSchema } from './tools/get-available-dates.js';
import { getAvailableSessions, getAvailableSessionsSchema } from './tools/get-available-sessions.js';
import { getBookingForm, getBookingFormSchema } from './tools/get-booking-form.js';
import { scheduleAppointment, scheduleAppointmentSchema } from './tools/schedule-appointment.js';
import { checkTicketStatus, checkTicketStatusSchema } from './tools/check-ticket-status.js';
import { listMyTickets, listMyTicketsSchema } from './tools/list-my-tickets.js';

// Resources
import { categoriesContent } from './resources/categories.js';
import { ticketLifecycleContent } from './resources/ticket-lifecycle.js';
import { schedulingFlowContent } from './resources/scheduling-flow.js';

// Prompts
import { agendarAtendimentoPrompt } from './prompts/agendar-atendimento.js';
import { consultarAgendamentoPrompt } from './prompts/consultar-agendamento.js';

// ─── Zod → JSON Schema helper (minimal, covers our use cases) ────────────────

function zodToJsonSchema(schema: import('zod').ZodObject<import('zod').ZodRawShape>): Record<string, unknown> {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    const f = field as import('zod').ZodTypeAny;
    const def = f._def as { typeName: string; description?: string; innerType?: { _def: { typeName: string } }; checks?: Array<{ kind: string; value?: number }> };

    let type = 'string';
    if (def.typeName === 'ZodNumber') type = 'number';
    else if (def.typeName === 'ZodBoolean') type = 'boolean';
    else if (def.typeName === 'ZodRecord') {
      properties[key] = { type: 'object', additionalProperties: { type: 'string' }, description: def.description };
      required.push(key);
      continue;
    }

    properties[key] = { type, description: def.description };

    const isOptional = def.typeName === 'ZodOptional';
    if (!isOptional) required.push(key);
  }

  return { type: 'object', properties, required };
}

// ─── Server setup ────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'filazero-mcp', version: '1.0.0' },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  },
);

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_companies',
    description: 'Lista todas as empresas disponíveis para agendamento na plataforma Filazero',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_company_services',
    description: 'Retorna os serviços disponíveis de uma empresa específica pelo seu slug',
    inputSchema: zodToJsonSchema(getCompanyServicesSchema),
  },
  {
    name: 'get_available_dates',
    description: 'Retorna os dias com vagas disponíveis em um mês para um serviço específico',
    inputSchema: zodToJsonSchema(getAvailableDatesSchema),
  },
  {
    name: 'get_available_sessions',
    description: 'Retorna horários e profissionais disponíveis em um dia específico',
    inputSchema: zodToJsonSchema(getAvailableSessionsSchema),
  },
  {
    name: 'get_booking_form',
    description: 'Retorna os campos personalizados do formulário de agendamento de uma sessão',
    inputSchema: zodToJsonSchema(getBookingFormSchema),
  },
  {
    name: 'schedule_appointment',
    description: 'Emite o ticket de agendamento (requer autenticação Bearer token)',
    inputSchema: zodToJsonSchema(scheduleAppointmentSchema),
  },
  {
    name: 'check_ticket_status',
    description: 'Consulta o status atual de um ticket pelo accessKey (sem autenticação)',
    inputSchema: zodToJsonSchema(checkTicketStatusSchema),
  },
  {
    name: 'list_my_tickets',
    description: 'Lista todos os tickets do usuário autenticado (requer Bearer token)',
    inputSchema: zodToJsonSchema(listMyTicketsSchema),
  },
];

// ─── Handlers ────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const input = (args ?? {}) as Record<string, unknown>;

  switch (name) {
    case 'list_companies':
      return listCompanies(listCompaniesSchema.parse(input));

    case 'get_company_services':
      return getCompanyServices(getCompanyServicesSchema.parse(input));

    case 'get_available_dates':
      return getAvailableDates(getAvailableDatesSchema.parse(input));

    case 'get_available_sessions':
      return getAvailableSessions(getAvailableSessionsSchema.parse(input));

    case 'get_booking_form':
      return getBookingForm(getBookingFormSchema.parse(input));

    case 'schedule_appointment':
      return scheduleAppointment(scheduleAppointmentSchema.parse(input));

    case 'check_ticket_status':
      return checkTicketStatus(checkTicketStatusSchema.parse(input));

    case 'list_my_tickets':
      return listMyTickets(listMyTicketsSchema.parse(input));

    default:
      return {
        content: [{ type: 'text', text: `Tool desconhecida: ${name}` }],
        isError: true,
      };
  }
});

// ─── Resources ────────────────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'filazero://categories',
      name: 'Categorias de Serviços',
      description: 'Categorias de serviços disponíveis na plataforma Filazero',
      mimeType: 'text/markdown',
    },
    {
      uri: 'filazero://ticket-lifecycle',
      name: 'Ciclo de Vida do Ticket',
      description: 'Estados e transições de um ticket de agendamento',
      mimeType: 'text/markdown',
    },
    {
      uri: 'filazero://scheduling-flow',
      name: 'Fluxo de Agendamento',
      description: 'Guia completo da sequência de tools para realizar um agendamento',
      mimeType: 'text/markdown',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const contentMap: Record<string, string> = {
    'filazero://categories': categoriesContent,
    'filazero://ticket-lifecycle': ticketLifecycleContent,
    'filazero://scheduling-flow': schedulingFlowContent,
  };

  const text = contentMap[uri];
  if (!text) {
    throw new Error(`Resource não encontrado: ${uri}`);
  }

  return {
    contents: [{ uri, mimeType: 'text/markdown', text }],
  };
});

// ─── Prompts ──────────────────────────────────────────────────────────────────

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: agendarAtendimentoPrompt.name,
      description: agendarAtendimentoPrompt.description,
      arguments: agendarAtendimentoPrompt.arguments,
    },
    {
      name: consultarAgendamentoPrompt.name,
      description: consultarAgendamentoPrompt.description,
      arguments: consultarAgendamentoPrompt.arguments,
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: promptArgs } = request.params;
  const args = (promptArgs ?? {}) as Record<string, string>;

  if (name === agendarAtendimentoPrompt.name) {
    return { messages: agendarAtendimentoPrompt.getMessages(args) };
  }

  if (name === consultarAgendamentoPrompt.name) {
    return { messages: consultarAgendamentoPrompt.getMessages(args) };
  }

  throw new Error(`Prompt não encontrado: ${name}`);
});

// ─── Start ────────────────────────────────────────────────────────────────────

function createServer(): Server {
  return server;
}

async function startHttp(): Promise<void> {
  const port = Number(process.env['MCP_SERVER_PORT'] ?? 3000);
  const app = express();
  app.use(express.json());

  // Map of sessionId → transport (stateful mode)
  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.all('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (req.method === 'POST' && !sessionId) {
      // New session
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });
      const mcpServer = createServer();
      await mcpServer.connect(transport);

      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };

      await transport.handleRequest(req, res, req.body);

      if (transport.sessionId) {
        transports.set(transport.sessionId, transport);
      }
      return;
    }

    if (sessionId) {
      const transport = transports.get(sessionId);
      if (!transport) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({ error: 'Missing mcp-session-id header' });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'filazero-mcp' });
  });

  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    logger.info(`Filazero MCP Server iniciado em modo HTTP na porta ${port}`, { tool: 'server' });
  });
}

async function startStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Filazero MCP Server iniciado em modo stdio', { tool: 'server' });
}

async function main(): Promise<void> {
  const mode = process.env['MCP_TRANSPORT'] ?? 'stdio';
  if (mode === 'http') {
    await startHttp();
  } else {
    await startStdio();
  }
}

main().catch((err) => {
  logger.error('Falha ao iniciar o servidor', { error: String(err) });
  process.exit(1);
});
