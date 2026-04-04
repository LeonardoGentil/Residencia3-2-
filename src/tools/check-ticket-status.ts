import { z } from 'zod';
import { fetchTicketStatus } from '../client/filazero.js';
import { logger } from '../logger/index.js';
import type { ToolResult } from '../types/index.js';

export const checkTicketStatusSchema = z.object({
  accessKey: z.string().min(1).describe('Chave de acesso do ticket (accessKey)'),
});

export type CheckTicketStatusInput = z.infer<typeof checkTicketStatusSchema>;

interface RawTicket {
  id?: number;
  accessKey?: string;
  status?: string;
  serviceName?: string;
  companyName?: string;
  scheduledAt?: string;
  createdAt?: string;
  data?: RawTicket;
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

export async function checkTicketStatus(input: CheckTicketStatusInput): Promise<ToolResult> {
  const TOOL = 'check_ticket_status';
  const start = Date.now();

  try {
    const raw = (await fetchTicketStatus(input.accessKey)) as RawTicket;
    const ticket = raw.data ?? raw;

    const result = {
      id: ticket.id,
      accessKey: ticket.accessKey,
      status: ticket.status,
      serviceName: ticket.serviceName,
      companyName: ticket.companyName,
      scheduledAt: ticket.scheduledAt ? formatBR(ticket.scheduledAt) : undefined,
      createdAt: ticket.createdAt ? formatBR(ticket.createdAt) : undefined,
    };

    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: `Erro ao consultar ticket: ${message}` }], isError: true };
  }
}
