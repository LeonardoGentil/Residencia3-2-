"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingFormSchema = void 0;
exports.getBookingForm = getBookingForm;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../cache/index.js");
const index_js_2 = require("../logger/index.js");
exports.getBookingFormSchema = zod_1.z.object({
    providerId: zod_1.z.number().int().positive().describe('ID do provider/empresa'),
    sessionId: zod_1.z.number().int().positive().describe('ID da sessão escolhida'),
});
async function getBookingForm(input) {
    const TOOL = 'get_booking_form';
    const cacheKey = `custom-fields:${input.providerId}:${input.sessionId}`;
    const start = Date.now();
    const cached = index_js_1.cache.get(cacheKey);
    if (cached) {
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
        return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
    }
    try {
        const raw = (await (0, filazero_js_1.fetchCustomFields)(input.providerId, input.sessionId));
        const fields = Array.isArray(raw)
            ? raw
            : raw.data ?? [];
        const result = fields.map((f) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            required: f.required,
            ...(f.options ? { options: f.options } : {}),
        }));
        index_js_1.cache.set(cacheKey, result, index_js_1.TTL.customFields);
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_2.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: `Erro ao buscar formulário de agendamento: ${message}` }], isError: true };
    }
}
