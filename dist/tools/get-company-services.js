"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyServicesSchema = void 0;
exports.getCompanyServices = getCompanyServices;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../cache/index.js");
const index_js_2 = require("../logger/index.js");
exports.getCompanyServicesSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1).describe('Slug da empresa (ex: "clinica-exemplo")'),
});
async function getCompanyServices(input) {
    const TOOL = 'get_company_services';
    const cacheKey = `services:${input.slug}`;
    const start = Date.now();
    const cached = index_js_1.cache.get(cacheKey);
    if (cached) {
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
        return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
    }
    try {
        const raw = (await (0, filazero_js_1.fetchCompanyServices)(input.slug));
        const services = Array.isArray(raw)
            ? raw
            : raw.services ??
                raw.data ??
                [];
        const result = services.map((s) => {
            const locationId = s.locationId ?? s.locations?.[0]?.id;
            return {
                id: s.id,
                abstractServiceId: s.abstractServiceId,
                name: s.name,
                description: s.description,
                ...(locationId !== undefined ? { locationId } : {}),
            };
        });
        index_js_1.cache.set(cacheKey, result, index_js_1.TTL.services);
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_2.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: `Erro ao buscar serviços: ${message}` }], isError: true };
    }
}
