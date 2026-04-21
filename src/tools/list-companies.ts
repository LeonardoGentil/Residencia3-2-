import { z } from 'zod';
import { fetchCompanies } from '../client/filazero.js';
import { cache, TTL } from '../cache/index.js';
import { logger } from '../logger/index.js';
import type { Company, ToolResult } from '../types/index.js';

export const listCompaniesSchema = z.object({});

export type ListCompaniesInput = z.infer<typeof listCompaniesSchema>;

export async function listCompanies(_input: ListCompaniesInput): Promise<ToolResult> {
  const TOOL = 'list_companies';
  const cacheKey = 'companies:all';
  const start = Date.now();

  const cached = cache.get<Company[]>(cacheKey);
  if (cached) {
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
    return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
  }

  try {
    const raw = (await fetchCompanies()) as { data?: Company[] } | Company[];
    const companies: Company[] = Array.isArray(raw)
      ? raw
      : (raw as { data?: Company[] }).data ?? [];

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

    cache.set(cacheKey, result, TTL.companies);
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: `Erro ao listar empresas: ${message}` }], isError: true };
  }
}
