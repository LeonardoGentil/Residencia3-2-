import { z } from 'zod';
import { fetchCustomFields } from '../client/filazero.js';
import { cache, TTL } from '../cache/index.js';
import { logger } from '../logger/index.js';
import type { CustomField, ToolResult } from '../types/index.js';

export const getBookingFormSchema = z.object({
  providerId: z.number().int().positive().describe('ID do provider/empresa'),
  sessionId: z.number().int().positive().describe('ID da sessão escolhida'),
});

export type GetBookingFormInput = z.infer<typeof getBookingFormSchema>;

export async function getBookingForm(input: GetBookingFormInput): Promise<ToolResult> {
  const TOOL = 'get_booking_form';
  const cacheKey = `custom-fields:${input.providerId}:${input.sessionId}`;
  const start = Date.now();

  const cached = cache.get<CustomField[]>(cacheKey);
  if (cached) {
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: true });
    return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
  }

  try {
    const raw = (await fetchCustomFields(input.providerId, input.sessionId)) as
      | { data?: CustomField[] }
      | CustomField[];

    const fields: CustomField[] = Array.isArray(raw)
      ? raw
      : (raw as { data?: CustomField[] }).data ?? [];

    const result = fields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      required: f.required,
      ...(f.options ? { options: f.options } : {}),
    }));

    cache.set(cacheKey, result, TTL.customFields);
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: `Erro ao buscar formulário de agendamento: ${message}` }], isError: true };
  }
}
