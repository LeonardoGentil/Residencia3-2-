"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCompaniesSchema = void 0;
exports.listCompanies = listCompanies;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../cache/index.js");
const index_js_2 = require("../logger/index.js");
exports.listCompaniesSchema = zod_1.z.object({});
async function listCompanies(_input) {
    const TOOL = 'list_companies';
    const cacheKey = 'companies:all';
    const start = Date.now();
    const cached = index_js_1.cache.get(cacheKey);
    if (cached) {
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
        return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
    }
    try {
        const raw = (await (0, filazero_js_1.fetchCompanies)());
        const companies = Array.isArray(raw)
            ? raw
            : raw.data ?? [];
        const result = companies.map((c) => {
            const locationId = c.locationId ?? c.locations?.[0]?.id;
            return {
                id: c.id,
                slug: c.slug,
                name: c.name,
                description: c.description,
                ...(locationId !== undefined ? { locationId } : {}),
            };
        });
        index_js_1.cache.set(cacheKey, result, index_js_1.TTL.companies);
        index_js_2.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_2.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: `Erro ao listar empresas: ${message}` }], isError: true };
    }
}
