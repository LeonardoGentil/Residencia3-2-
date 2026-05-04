import { createHash } from 'node:crypto';
import { z } from 'zod';
import { postTicket } from '../client/filazero.js';
import { cache, TTL } from '../cache/index.js';
import { logger } from '../logger/index.js';
import { DEMO_ENABLED, mockCreateTicket } from '../mock/demo-fixtures.js';
import type { ToolResult } from '../types/index.js';

export const scheduleAppointmentSchema = z.object({
  token: z.string().min(1).describe('Bearer token do usuário autenticado'),
  sessionId: z.number().int().positive().describe('ID da sessão escolhida'),
  serviceId: z.number().int().positive().describe('ID do serviço (usar abstractServiceId quando disponível)'),
  formData: z.record(z.string(), z.string()).describe('Campos do formulário preenchidos pelo usuário'),
});

export type ScheduleAppointmentInput = z.infer<typeof scheduleAppointmentSchema>;

interface TicketResponse {
  accessKey?: string;
  status?: string;
  id?: number;
  data?: {
    accessKey?: string;
    status?: string;
    id?: number;
  };
}

interface CachedTicket {
  id?: number;
  accessKey?: string;
  status?: string;
}

function buildIdempotencyKey(input: ScheduleAppointmentInput): string {
  const tokenFingerprint = createHash('sha256').update(input.token).digest('hex').slice(0, 16);
  const formFingerprint = createHash('sha256')
    .update(JSON.stringify(input.formData))
    .digest('hex')
    .slice(0, 16);
  return `schedule:${tokenFingerprint}:${input.sessionId}:${input.serviceId}:${formFingerprint}`;
}

export async function scheduleAppointment(input: ScheduleAppointmentInput): Promise<ToolResult> {
  const TOOL = 'schedule_appointment';
  const start = Date.now();

  if (input.serviceId <= 0) {
    return {
      content: [{ type: 'text', text: 'serviceId inválido. Use o abstractServiceId retornado por get_company_services.' }],
      isError: true,
    };
  }

  const idempotencyKey = buildIdempotencyKey(input);
  const previous = cache.get<CachedTicket>(idempotencyKey);
  if (previous) {
    logger.info('Idempotent replay served from cache', {
      tool: TOOL,
      duration_ms: Date.now() - start,
      cached: true,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ...previous,
              message:
                'Este agendamento já foi confirmado nos últimos 60s (idempotência). Nenhum ticket duplicado foi criado.',
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  // Demo mode: sessionIds vindos do mock estão na faixa 1001-1099. Não bate
  // na API real (que rejeitaria) — gera ticket sintético.
  if (DEMO_ENABLED && input.sessionId >= 1001 && input.sessionId <= 1099) {
    const ticket = mockCreateTicket({
      sessionId: input.sessionId,
      serviceId: input.serviceId,
      formData: input.formData,
    });
    cache.set<CachedTicket>(idempotencyKey, ticket, TTL.scheduleIdempotency);
    logger.info('Demo mode: created mocked ticket', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: ticket.id,
              accessKey: ticket.accessKey,
              status: ticket.status,
              message: '[DEMO] Agendamento simulado com sucesso. Guarde o accessKey para consulta.',
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  try {
    const raw = (await postTicket(input.token, {
      sessionId: input.sessionId,
      serviceId: input.serviceId,
      formData: input.formData,
    })) as TicketResponse;

    const ticket = raw.data ?? raw;

    cache.set<CachedTicket>(
      idempotencyKey,
      { id: ticket.id, accessKey: ticket.accessKey, status: ticket.status },
      TTL.scheduleIdempotency,
    );

    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: ticket.id,
              accessKey: ticket.accessKey,
              status: ticket.status,
              message: 'Agendamento realizado com sucesso! Guarde seu accessKey para consultar o status.',
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });

    const isAuthError = message.includes('Token inválido') || message.includes('expirado');
    return {
      content: [
        {
          type: 'text',
          text: isAuthError
            ? message
            : `Erro ao realizar agendamento: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
