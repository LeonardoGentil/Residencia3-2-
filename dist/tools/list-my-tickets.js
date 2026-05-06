"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyTicketsSchema = void 0;
exports.listMyTickets = listMyTickets;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../logger/index.js");
const demo_fixtures_js_1 = require("../mock/demo-fixtures.js");
exports.listMyTicketsSchema = zod_1.z.object({
    token: zod_1.z.string().min(1).describe('Bearer token do usuário autenticado'),
});
function formatBR(isoUtc) {
    return new Date(isoUtc).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
async function listMyTickets(input) {
    const TOOL = 'list_my_tickets';
    const start = Date.now();
    // Demo mode: token "demo" (ou qualquer token quando DEMO_ENABLED) recebe
    // os tickets criados via mockCreateTicket, sem bater na API real.
    if (demo_fixtures_js_1.DEMO_ENABLED && (input.token === 'demo' || input.token.startsWith('demo-'))) {
        const tickets = (0, demo_fixtures_js_1.mockListMyTickets)();
        const result = tickets.map((t) => ({
            id: t.id,
            accessKey: t.accessKey,
            status: t.status,
            serviceName: t.serviceName,
            companyName: t.companyName,
            scheduledAt: formatBR(t.scheduledAt),
            createdAt: formatBR(t.createdAt),
        }));
        index_js_1.logger.info('Demo mode: serving mocked tickets', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    try {
        const raw = (await (0, filazero_js_1.fetchMyTickets)(input.token));
        const tickets = Array.isArray(raw)
            ? raw
            : raw.data ?? [];
        const result = tickets.map((t) => ({
            id: t.id,
            accessKey: t.accessKey,
            status: t.status,
            serviceName: t.serviceName,
            companyName: t.companyName,
            scheduledAt: t.scheduledAt ? formatBR(t.scheduledAt) : undefined,
            createdAt: t.createdAt ? formatBR(t.createdAt) : undefined,
        }));
        index_js_1.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_1.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        const isAuthError = message.includes('Token inválido') || message.includes('expirado');
        return {
            content: [
                {
                    type: 'text',
                    text: isAuthError ? message : `Erro ao listar tickets: ${message}`,
                },
            ],
            isError: true,
        };
    }
}
