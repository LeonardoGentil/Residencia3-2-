import { z } from 'zod';
import { postTicket } from '../client/filazero.js';
import { logger } from '../logger/index.js';
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

export async function scheduleAppointment(input: ScheduleAppointmentInput): Promise<ToolResult> {
  const TOOL = 'schedule_appointment';
  const start = Date.now();

  if (input.serviceId <= 0) {
    return {
      content: [{ type: 'text', text: 'serviceId inválido. Use o abstractServiceId retornado por get_company_services.' }],
      isError: true,
    };
  }

  try {
    const raw = (await postTicket(input.token, {
      sessionId: input.sessionId,
      serviceId: input.serviceId,
      formData: input.formData,
    })) as TicketResponse;

    const ticket = raw.data ?? raw;

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
