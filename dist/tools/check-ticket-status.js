"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTicketStatusSchema = void 0;
exports.checkTicketStatus = checkTicketStatus;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../logger/index.js");
const demo_fixtures_js_1 = require("../mock/demo-fixtures.js");
exports.checkTicketStatusSchema = zod_1.z.object({
    accessKey: zod_1.z.string().min(1).describe('Chave de acesso do ticket (accessKey)'),
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
async function checkTicketStatus(input) {
    const TOOL = 'check_ticket_status';
    const start = Date.now();
    // Demo mode: se a accessKey corresponde a um ticket gerado via mock,
    // serve direto sem bater na API real.
    if (demo_fixtures_js_1.DEMO_ENABLED) {
        const mocked = (0, demo_fixtures_js_1.mockGetTicket)(input.accessKey);
        if (mocked) {
            index_js_1.logger.info('Demo mode: serving mocked ticket status', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: mocked.id,
                            accessKey: mocked.accessKey,
                            status: mocked.status,
                            serviceName: mocked.serviceName,
                            companyName: mocked.companyName,
                            scheduledAt: formatBR(mocked.scheduledAt),
                            createdAt: formatBR(mocked.createdAt),
                        }, null, 2),
                    },
                ],
            };
        }
    }
    try {
        const raw = (await (0, filazero_js_1.fetchTicketStatus)(input.accessKey));
        const ticket = raw.data ?? raw;
        const result = {
            id: ticket.id,
            accessKey: ticket.accessKey,
            status: ticket.status,
            serviceName: ticket.serviceName,
            companyName: ticket.companyName,
            scheduledAt: ticket.scheduledAt ? formatBR(ticket.scheduledAt) : undefined,
            createdAt: ticket.createdAt ? formatBR(ticket.createdAt) : undefined,
        };
        index_js_1.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_1.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: `Erro ao consultar ticket: ${message}` }], isError: true };
    }
}
