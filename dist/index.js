"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const express_1 = __importDefault(require("express"));
const node_crypto_1 = require("node:crypto");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const index_js_2 = require("./logger/index.js");
// Tools
const list_companies_js_1 = require("./tools/list-companies.js");
const get_company_services_js_1 = require("./tools/get-company-services.js");
const get_available_dates_js_1 = require("./tools/get-available-dates.js");
const get_available_sessions_js_1 = require("./tools/get-available-sessions.js");
const get_booking_form_js_1 = require("./tools/get-booking-form.js");
const schedule_appointment_js_1 = require("./tools/schedule-appointment.js");
const check_ticket_status_js_1 = require("./tools/check-ticket-status.js");
const list_my_tickets_js_1 = require("./tools/list-my-tickets.js");
// Resources
const categories_js_1 = require("./resources/categories.js");
const ticket_lifecycle_js_1 = require("./resources/ticket-lifecycle.js");
const scheduling_flow_js_1 = require("./resources/scheduling-flow.js");
// Prompts
const agendar_atendimento_js_1 = require("./prompts/agendar-atendimento.js");
const consultar_agendamento_js_1 = require("./prompts/consultar-agendamento.js");
// ─── Zod → JSON Schema helper (minimal, covers our use cases) ────────────────
function zodToJsonSchema(schema) {
    const shape = schema.shape;
    const properties = {};
    const required = [];
    for (const [key, field] of Object.entries(shape)) {
        const f = field;
        const def = f._def;
        let type = 'string';
        if (def.typeName === 'ZodNumber')
            type = 'number';
        else if (def.typeName === 'ZodBoolean')
            type = 'boolean';
        else if (def.typeName === 'ZodRecord') {
            properties[key] = { type: 'object', additionalProperties: { type: 'string' }, description: def.description };
            required.push(key);
            continue;
        }
        properties[key] = { type, description: def.description };
        const isOptional = def.typeName === 'ZodOptional';
        if (!isOptional)
            required.push(key);
    }
    return { type: 'object', properties, required };
}
// ─── Server setup ────────────────────────────────────────────────────────────
const server = new index_js_1.Server({ name: 'filazero-mcp', version: '1.0.0' }, {
    capabilities: {
        tools: {},
        resources: {},
        prompts: {},
    },
});
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
        inputSchema: zodToJsonSchema(get_company_services_js_1.getCompanyServicesSchema),
    },
    {
        name: 'get_available_dates',
        description: 'Retorna os dias com vagas disponíveis em um mês para um serviço específico',
        inputSchema: zodToJsonSchema(get_available_dates_js_1.getAvailableDatesSchema),
    },
    {
        name: 'get_available_sessions',
        description: 'Retorna horários e profissionais disponíveis em um dia específico',
        inputSchema: zodToJsonSchema(get_available_sessions_js_1.getAvailableSessionsSchema),
    },
    {
        name: 'get_booking_form',
        description: 'Retorna os campos personalizados do formulário de agendamento de uma sessão',
        inputSchema: zodToJsonSchema(get_booking_form_js_1.getBookingFormSchema),
    },
    {
        name: 'schedule_appointment',
        description: 'Emite o ticket de agendamento (requer autenticação Bearer token)',
        inputSchema: zodToJsonSchema(schedule_appointment_js_1.scheduleAppointmentSchema),
    },
    {
        name: 'check_ticket_status',
        description: 'Consulta o status atual de um ticket pelo accessKey (sem autenticação)',
        inputSchema: zodToJsonSchema(check_ticket_status_js_1.checkTicketStatusSchema),
    },
    {
        name: 'list_my_tickets',
        description: 'Lista todos os tickets do usuário autenticado (requer Bearer token)',
        inputSchema: zodToJsonSchema(list_my_tickets_js_1.listMyTicketsSchema),
    },
];
// ─── Handlers ────────────────────────────────────────────────────────────────
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const input = (args ?? {});
    switch (name) {
        case 'list_companies':
            return (0, list_companies_js_1.listCompanies)(list_companies_js_1.listCompaniesSchema.parse(input));
        case 'get_company_services':
            return (0, get_company_services_js_1.getCompanyServices)(get_company_services_js_1.getCompanyServicesSchema.parse(input));
        case 'get_available_dates':
            return (0, get_available_dates_js_1.getAvailableDates)(get_available_dates_js_1.getAvailableDatesSchema.parse(input));
        case 'get_available_sessions':
            return (0, get_available_sessions_js_1.getAvailableSessions)(get_available_sessions_js_1.getAvailableSessionsSchema.parse(input));
        case 'get_booking_form':
            return (0, get_booking_form_js_1.getBookingForm)(get_booking_form_js_1.getBookingFormSchema.parse(input));
        case 'schedule_appointment':
            return (0, schedule_appointment_js_1.scheduleAppointment)(schedule_appointment_js_1.scheduleAppointmentSchema.parse(input));
        case 'check_ticket_status':
            return (0, check_ticket_status_js_1.checkTicketStatus)(check_ticket_status_js_1.checkTicketStatusSchema.parse(input));
        case 'list_my_tickets':
            return (0, list_my_tickets_js_1.listMyTickets)(list_my_tickets_js_1.listMyTicketsSchema.parse(input));
        default:
            return {
                content: [{ type: 'text', text: `Tool desconhecida: ${name}` }],
                isError: true,
            };
    }
});
// ─── Resources ────────────────────────────────────────────────────────────────
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => ({
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
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const contentMap = {
        'filazero://categories': categories_js_1.categoriesContent,
        'filazero://ticket-lifecycle': ticket_lifecycle_js_1.ticketLifecycleContent,
        'filazero://scheduling-flow': scheduling_flow_js_1.schedulingFlowContent,
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
server.setRequestHandler(types_js_1.ListPromptsRequestSchema, async () => ({
    prompts: [
        {
            name: agendar_atendimento_js_1.agendarAtendimentoPrompt.name,
            description: agendar_atendimento_js_1.agendarAtendimentoPrompt.description,
            arguments: agendar_atendimento_js_1.agendarAtendimentoPrompt.arguments,
        },
        {
            name: consultar_agendamento_js_1.consultarAgendamentoPrompt.name,
            description: consultar_agendamento_js_1.consultarAgendamentoPrompt.description,
            arguments: consultar_agendamento_js_1.consultarAgendamentoPrompt.arguments,
        },
    ],
}));
server.setRequestHandler(types_js_1.GetPromptRequestSchema, async (request) => {
    const { name, arguments: promptArgs } = request.params;
    const args = (promptArgs ?? {});
    if (name === agendar_atendimento_js_1.agendarAtendimentoPrompt.name) {
        return { messages: agendar_atendimento_js_1.agendarAtendimentoPrompt.getMessages(args) };
    }
    if (name === consultar_agendamento_js_1.consultarAgendamentoPrompt.name) {
        return { messages: consultar_agendamento_js_1.consultarAgendamentoPrompt.getMessages(args) };
    }
    throw new Error(`Prompt não encontrado: ${name}`);
});
// ─── Start ────────────────────────────────────────────────────────────────────
function createServer() {
    return server;
}
async function startHttp() {
    const port = Number(process.env['MCP_SERVER_PORT'] ?? 3000);
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Map of sessionId → transport (stateful mode)
    const transports = new Map();
    app.all('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'];
        if (req.method === 'POST' && !sessionId) {
            // New session
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => (0, node_crypto_1.randomUUID)(),
            });
            const mcpServer = createServer();
            await mcpServer.connect(transport);
            transport.onclose = () => {
                if (transport.sessionId)
                    transports.delete(transport.sessionId);
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
    const httpServer = node_http_1.default.createServer(app);
    httpServer.listen(port, () => {
        index_js_2.logger.info(`Filazero MCP Server iniciado em modo HTTP na porta ${port}`, { tool: 'server' });
    });
}
async function startStdio() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    index_js_2.logger.info('Filazero MCP Server iniciado em modo stdio', { tool: 'server' });
}
async function main() {
    const mode = process.env['MCP_TRANSPORT'] ?? 'stdio';
    if (mode === 'http') {
        await startHttp();
    }
    else {
        await startStdio();
    }
}
main().catch((err) => {
    index_js_2.logger.error('Falha ao iniciar o servidor', { error: String(err) });
    process.exit(1);
});
