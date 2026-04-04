import { z } from 'zod';
import { fetchMyTickets } from '../client/filazero.js';
import { logger } from '../logger/index.js';
import type { ToolResult } from '../types/index.js';

export const listMyTicketsSchema = z.object({
  token: z.string().min(1).describe('Bearer token do usuário autenticado'),
});

export type ListMyTicketsInput = z.infer<typeof listMyTicketsSchema>;

interface RawTicket {
  id?: number;
  accessKey?: string;
  status?: string;
  serviceName?: string;
  companyName?: string;
  scheduledAt?: string;
  createdAt?: string;
}

function formatBR(isoUtc: string): string {
  return new Date(isoUtc).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function listMyTickets(input: ListMyTicketsInput): Promise<ToolResult> {
  const TOOL = 'list_my_tickets';
  const start = Date.now();

  try {
    const raw = (await fetchMyTickets(input.token)) as
      | { data?: RawTicket[] }
      | RawTicket[];

    const tickets: RawTicket[] = Array.isArray(raw)
      ? raw
      : (raw as { data?: RawTicket[] }).data ?? [];

    const result = tickets.map((t) => ({
      id: t.id,
      accessKey: t.accessKey,
      status: t.status,
      serviceName: t.serviceName,
      companyName: t.companyName,
      scheduledAt: t.scheduledAt ? formatBR(t.scheduledAt) : undefined,
      createdAt: t.createdAt ? formatBR(t.createdAt) : undefined,
    }));

    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });

    const isAuthError = message.includes('Token inválido') || message.includes('expirado');
    return {
      content: [
        {
          type: 'text',
          text: isAuthError ? message : `Erro ao listar tickets: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
