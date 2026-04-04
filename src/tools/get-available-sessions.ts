import { z } from 'zod';
import { fetchAvailableSessions } from '../client/filazero.js';
import { cache, TTL } from '../cache/index.js';
import { logger } from '../logger/index.js';
import type { ToolResult } from '../types/index.js';

export const getAvailableSessionsSchema = z.object({
  slug: z.string().min(1).describe('Slug da empresa'),
  locationId: z.number().int().positive().describe('ID da localização/unidade'),
  serviceId: z.number().int().positive().describe('ID do serviço (usar abstractServiceId quando disponível)'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Data no formato YYYY-MM-DD'),
});

export type GetAvailableSessionsInput = z.infer<typeof getAvailableSessionsSchema>;

interface RawSession {
  sessionId?: number;
  id?: number;
  startTime?: string;
  start?: string;
  endTime?: string;
  end?: string;
  professionalName?: string;
  professional?: { name?: string };
  locationId?: number;
}

function formatDateTime(isoUtc: string): string {
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

export async function getAvailableSessions(input: GetAvailableSessionsInput): Promise<ToolResult> {
  const TOOL = 'get_available_sessions';
  const cacheKey = `sessions:${input.slug}:${input.locationId}:${input.serviceId}:${input.date}`;
  const start = Date.now();

  const cached = cache.get<unknown[]>(cacheKey);
  if (cached) {
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
    return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
  }

  try {
    const raw = (await fetchAvailableSessions(
      input.slug,
      input.locationId,
      input.serviceId,
      input.date,
    )) as { data?: RawSession[] } | RawSession[];

    const sessions: RawSession[] = Array.isArray(raw)
      ? raw
      : (raw as { data?: RawSession[] }).data ?? [];

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

    cache.set(cacheKey, result, TTL.sessions);
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: `Erro ao buscar sessões disponíveis: ${message}` }], isError: true };
  }
}
