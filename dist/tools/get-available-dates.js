"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableDatesSchema = void 0;
exports.getAvailableDates = getAvailableDates;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../cache/index.js");
const index_js_2 = require("../logger/index.js");
exports.getAvailableDatesSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1).describe('Slug da empresa'),
    serviceId: zod_1.z.number().int().positive().describe('ID do serviço (usar abstractServiceId quando disponível)'),
    year: zod_1.z.number().int().min(2020).max(2099).describe('Ano (ex: 2026)'),
    month: zod_1.z.number().int().min(1).max(12).describe('Mês (1-12)'),
});
function utcToSaoPaulo(isoUtc) {
    const date = new Date(isoUtc);
    return date.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
async function getAvailableDates(input) {
    const TOOL = 'get_available_dates';
    const cacheKey = `available-dates:${input.slug}:${input.serviceId}:${input.year}-${input.month}`;
    const start = Date.now();
    const cached = index_js_1.cache.get(cacheKey);
    if (cached) {
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
        if (cached.length === 0) {
            return { content: [{ type: 'text', text: 'Nenhuma vaga disponível neste mês. Tente outro mês.' }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
    }
    try {
        const raw = (await (0, filazero_js_1.fetchAvailableDates)(input.slug, input.serviceId, input.year, input.month));
        const days = Array.isArray(raw)
            ? raw
            : raw.data ?? [];
        if (days.length === 0) {
            index_js_1.cache.set(cacheKey, [], index_js_1.TTL.availableDates);
            index_js_2.logger.info('No available dates', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
            return { content: [{ type: 'text', text: 'Nenhuma vaga disponível neste mês. Tente outro mês.' }] };
        }
        const result = days.map((d) => utcToSaoPaulo(d.date));
        index_js_1.cache.set(cacheKey, result, index_js_1.TTL.availableDates);
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_2.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: `Erro ao buscar datas disponíveis: ${message}` }], isError: true };
    }
}
