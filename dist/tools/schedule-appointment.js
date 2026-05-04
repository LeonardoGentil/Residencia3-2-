"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAppointmentSchema = void 0;
exports.scheduleAppointment = scheduleAppointment;
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../cache/index.js");
const index_js_2 = require("../logger/index.js");
exports.scheduleAppointmentSchema = zod_1.z.object({
    token: zod_1.z.string().min(1).describe('Bearer token do usuário autenticado'),
    sessionId: zod_1.z.number().int().positive().describe('ID da sessão escolhida'),
    serviceId: zod_1.z.number().int().positive().describe('ID do serviço (usar abstractServiceId quando disponível)'),
    formData: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).describe('Campos do formulário preenchidos pelo usuário'),
});
function buildIdempotencyKey(input) {
    const tokenFingerprint = (0, node_crypto_1.createHash)('sha256').update(input.token).digest('hex').slice(0, 16);
    const formFingerprint = (0, node_crypto_1.createHash)('sha256')
        .update(JSON.stringify(input.formData))
        .digest('hex')
        .slice(0, 16);
    return `schedule:${tokenFingerprint}:${input.sessionId}:${input.serviceId}:${formFingerprint}`;
}
async function scheduleAppointment(input) {
    const TOOL = 'schedule_appointment';
    const start = Date.now();
    if (input.serviceId <= 0) {
        return {
            content: [{ type: 'text', text: 'serviceId inválido. Use o abstractServiceId retornado por get_company_services.' }],
            isError: true,
        };
    }
    const idempotencyKey = buildIdempotencyKey(input);
    const previous = index_js_1.cache.get(idempotencyKey);
    if (previous) {
        index_js_2.logger.info('Idempotent replay served from cache', {
            tool: TOOL,
            duration_ms: Date.now() - start,
            cached: true,
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        ...previous,
                        message: 'Este agendamento já foi confirmado nos últimos 60s (idempotência). Nenhum ticket duplicado foi criado.',
                    }, null, 2),
                },
            ],
        };
    }
    try {
        const raw = (await (0, filazero_js_1.postTicket)(input.token, {
            sessionId: input.sessionId,
            serviceId: input.serviceId,
            formData: input.formData,
        }));
        const ticket = raw.data ?? raw;
        index_js_1.cache.set(idempotencyKey, { id: ticket.id, accessKey: ticket.accessKey, status: ticket.status }, index_js_1.TTL.scheduleIdempotency);
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        id: ticket.id,
                        accessKey: ticket.accessKey,
                        status: ticket.status,
                        message: 'Agendamento realizado com sucesso! Guarde seu accessKey para consultar o status.',
                    }, null, 2),
                },
            ],
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_2.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        const isAuthError = message.includes('Token inválido') || message.includes('expirado');
        return {
            content: [
                {
                    type: 'text',
                    text: isAuthError
                        ? message
                        : `Erro ao realizar agendamento: ${message}`,
                },
            ],
            isError: true,
        };
    }
}
