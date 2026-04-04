"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSessionsSchema = void 0;
exports.getAvailableSessions = getAvailableSessions;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../cache/index.js");
const index_js_2 = require("../logger/index.js");
exports.getAvailableSessionsSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1).describe('Slug da empresa'),
    locationId: zod_1.z.number().int().positive().describe('ID da localização/unidade'),
    serviceId: zod_1.z.number().int().positive().describe('ID do serviço (usar abstractServiceId quando disponível)'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Data no formato YYYY-MM-DD'),
});
function formatDateTime(isoUtc) {
    const date = new Date(isoUtc);
    return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
async function getAvailableSessions(input) {
    const TOOL = 'get_available_sessions';
    const cacheKey = `sessions:${input.slug}:${input.locationId}:${input.serviceId}:${input.date}`;
    const start = Date.now();
    const cached = index_js_1.cache.get(cacheKey);
    if (cached) {
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
        return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
    }
    try {
        const raw = (await (0, filazero_js_1.fetchAvailableSessions)(input.slug, input.locationId, input.serviceId, input.date));
        const sessions = Array.isArray(raw)
            ? raw
            : raw.data ?? [];
        const result = sessions.map((s) => {
            const startRaw = s.startTime ?? s.start ?? '';
            const endRaw = s.endTime ?? s.end ?? '';
            return {
                sessionId: s.sessionId ?? s.id,
                startTime: startRaw ? formatDateTime(startRaw) : '',
                endTime: endRaw ? formatDateTime(endRaw) : '',
                professionalName: s.professionalName ?? s.professional?.name ?? 'Não informado',
                locationId: s.locationId ?? input.locationId,
            };
        });
        index_js_1.cache.set(cacheKey, result, index_js_1.TTL.sessions);
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_2.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: `Erro ao buscar sessões disponíveis: ${message}` }], isError: true };
    }
}
