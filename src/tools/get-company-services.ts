import { z } from 'zod';
import { fetchCompanyServices } from '../client/filazero.js';
import { cache, TTL } from '../cache/index.js';
import { logger } from '../logger/index.js';
import type { Service, ToolResult } from '../types/index.js';

export const getCompanyServicesSchema = z.object({
  slug: z.string().min(1).describe('Slug da empresa (ex: "clinica-exemplo")'),
});

export type GetCompanyServicesInput = z.infer<typeof getCompanyServicesSchema>;

export async function getCompanyServices(input: GetCompanyServicesInput): Promise<ToolResult> {
  const TOOL = 'get_company_services';
  const cacheKey = `services:${input.slug}`;
  const start = Date.now();

  const cached = cache.get<Service[]>(cacheKey);
  if (cached) {
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
    return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
  }

  try {
    const raw = (await fetchCompanyServices(input.slug)) as
      | { services?: Service[]; data?: Service[] }
      | Service[];
    const services: Service[] = Array.isArray(raw)
      ? raw
      : (raw as { services?: Service[] }).services ??
        (raw as { data?: Service[] }).data ??
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

    cache.set(cacheKey, result, TTL.services);
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: `Erro ao buscar serviços: ${message}` }], isError: true };
  }
}
