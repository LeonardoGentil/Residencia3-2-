import { z } from 'zod';
import { fetchAvailableDates } from '../client/filazero.js';
import { cache, TTL } from '../cache/index.js';
import { logger } from '../logger/index.js';
import type { ToolResult } from '../types/index.js';

export const getAvailableDatesSchema = z.object({
  slug: z.string().min(1).describe('Slug da empresa'),
  serviceId: z.number().int().positive().describe('ID do serviço (usar abstractServiceId quando disponível)'),
  year: z.number().int().min(2020).max(2099).describe('Ano (ex: 2026)'),
  month: z.number().int().min(1).max(12).describe('Mês (1-12)'),
});

export type GetAvailableDatesInput = z.infer<typeof getAvailableDatesSchema>;

function utcToSaoPaulo(isoUtc: string): string {
  const date = new Date(isoUtc);
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function getAvailableDates(input: GetAvailableDatesInput): Promise<ToolResult> {
  const TOOL = 'get_available_dates';
  const cacheKey = `available-dates:${input.slug}:${input.serviceId}:${input.year}-${input.month}`;
  const start = Date.now();

  const cached = cache.get<Array<Record<string, unknown>>>(cacheKey);
  if (cached) {
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
    if (cached.length === 0) {
      return { content: [{ type: 'text', text: 'Nenhuma vaga disponível neste mês. Tente outro mês.' }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
  }

  try {
    const raw = (await fetchAvailableDates(input.slug, input.serviceId, input.year, input.month)) as
      | { data?: Array<Record<string, unknown>> }
      | Array<Record<string, unknown>>;

    const days: Array<Record<string, unknown>> = Array.isArray(raw)
      ? raw
      : (raw as { data?: Array<Record<string, unknown>> }).data ?? [];

    if (days.length === 0) {
      cache.set(cacheKey, [], TTL.availableDates);
      logger.info('No available dates', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
      return { content: [{ type: 'text', text: 'Nenhuma vaga disponível neste mês. Tente outro mês.' }] };
    }

    const result = days.map((d) => {
      const formatted: Record<string, unknown> = { date: utcToSaoPaulo(String(d['date'] ?? '')) };
      if (d['locationId'] !== undefined) formatted['locationId'] = d['locationId'];
      if (d['providerId'] !== undefined) formatted['providerId'] = d['providerId'];
      return formatted;
    });
    cache.set(cacheKey, result, TTL.availableDates);
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: `Erro ao buscar datas disponíveis: ${message}` }], isError: true };
  }
}
