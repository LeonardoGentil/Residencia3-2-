"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAppointmentSchema = void 0;
exports.scheduleAppointment = scheduleAppointment;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../logger/index.js");
exports.scheduleAppointmentSchema = zod_1.z.object({
    token: zod_1.z.string().min(1).describe('Bearer token do usuário autenticado'),
    sessionId: zod_1.z.number().int().positive().describe('ID da sessão escolhida'),
    serviceId: zod_1.z.number().int().positive().describe('ID do serviço (usar abstractServiceId quando disponível)'),
    formData: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).describe('Campos do formulário preenchidos pelo usuário'),
});
async function scheduleAppointment(input) {
    const TOOL = 'schedule_appointment';
    const start = Date.now();
    if (input.serviceId <= 0) {
        return {
            content: [{ type: 'text', text: 'serviceId inválido. Use o abstractServiceId retornado por get_company_services.' }],
            isError: true,
        };
    }
    try {
        const raw = (await (0, filazero_js_1.postTicket)(input.token, {
            sessionId: input.sessionId,
            serviceId: input.serviceId,
            formData: input.formData,
        }));
        const ticket = raw.data ?? raw;
        index_js_1.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
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
        index_js_1.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
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
