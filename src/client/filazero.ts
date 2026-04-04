import { logger } from '../logger/index.js';
import type { ApiMessage } from '../types/index.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = process.env['FILAZERO_API_URL'] ?? 'https://api.staging.filazero.net';
const APP_ORIGIN = process.env['FILAZERO_APP_ORIGIN'] ?? 'https://app.filazero.net';

const REQUIRED_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  Origin: APP_ORIGIN,
  Referer: `${APP_ORIGIN}/`,
  'User-Agent': 'MCP-Server-FilaZero/1.0',
  DNT: '1',
};

const WRITE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json;charset=UTF-8',
};

// ─── Rate limiter (sliding window per minute) ─────────────────────────────────

const RPM_LIMIT = Number(process.env['RATE_LIMIT_RPM'] ?? 30);
const requestTimestamps: number[] = [];

function checkRateLimit(): void {
  const now = Date.now();
  const windowStart = now - 60_000;

  // Drop timestamps outside the window
  while (requestTimestamps.length > 0 && (requestTimestamps[0] ?? 0) < windowStart) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= RPM_LIMIT) {
    const oldest = requestTimestamps[0] ?? now;
    const waitMs = 60_000 - (now - oldest);
    throw new Error(
      `Rate limit atingido (${RPM_LIMIT} req/min). Aguarde ${Math.ceil(waitMs / 1000)}s antes de tentar novamente.`,
    );
  }

  requestTimestamps.push(now);
}

// ─── Business-level error check ───────────────────────────────────────────────

function checkApiErrors(response: Record<string, unknown>): void {
  const messages = response['messages'];
  if (!Array.isArray(messages) || messages.length === 0) return;

  const errors = (messages as ApiMessage[]).filter((m) => m.type === 'ERROR');
  if (errors.length > 0 && errors[0]) {
    throw new Error(errors[0].description);
  }
}

// ─── resolveServiceId ─────────────────────────────────────────────────────────

export function resolveServiceId(service: { id: number; abstractServiceId?: number }): number {
  if (service.abstractServiceId !== undefined && service.abstractServiceId > 0) {
    return service.abstractServiceId;
  }
  return service.id;
}

// ─── Core fetch with retry / backoff ─────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  bearerToken?: string;
  maxRetries?: number;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, bearerToken, maxRetries = 3 } = options;

  checkRateLimit();

  const headers: Record<string, string> = { ...REQUIRED_HEADERS };
  if (method !== 'GET' && method !== 'DELETE') {
    Object.assign(headers, WRITE_HEADERS);
  }
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  const url = `${BASE_URL}${path}`;
  const init: RequestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  };

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Token inválido ou expirado. Por favor, faça login novamente para obter um novo token.',
        );
      }

      if (!res.ok) {
        throw new Error(`API respondeu com status ${res.status}: ${res.statusText}`);
      }

      const json = (await res.json()) as Record<string, unknown>;
      checkApiErrors(json);

      return json as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Do not retry auth errors or business errors
      const msg = lastError.message;
      if (
        msg.includes('Token inválido') ||
        msg.includes('Rate limit') ||
        msg.includes('status 4')
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = 2 ** (attempt - 1) * 500; // 500ms, 1s, 2s
        logger.warn(`Tentativa ${attempt} falhou. Retry em ${delay}ms.`, {
          tool: path,
          error: msg,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// ─── Public API functions ────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<unknown> {
  return apiFetch('/api/companies');
}

export async function fetchCompanyServices(slug: string): Promise<unknown> {
  return apiFetch(`/api/companies/${encodeURIComponent(slug)}/services`);
}

export async function fetchAvailableDates(
  slug: string,
  serviceId: number,
  year: number,
  month: number,
): Promise<unknown> {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  return apiFetch(
    `/v2/scheduling/self-service/providers/${encodeURIComponent(slug)}/services/${serviceId}/available-session-days?${params}`,
  );
}

export async function fetchAvailableSessions(
  slug: string,
  locationId: number,
  serviceId: number,
  date: string,
): Promise<unknown> {
  const params = new URLSearchParams({ date });
  return apiFetch(
    `/v2/scheduling/self-service/providers/${encodeURIComponent(slug)}/locations/${locationId}/services/${serviceId}/sessions-resources-by-service?${params}`,
  );
}

export async function fetchCustomFields(providerId: number, sessionId: number): Promise<unknown> {
  return apiFetch(`/api/providers/${providerId}/sessions/${sessionId}/custom-fields`);
}

export async function postTicket(
  token: string,
  payload: {
    sessionId: number;
    serviceId: number;
    formData: Record<string, string>;
  },
): Promise<unknown> {
  return apiFetch('/v2/ticketing/tickets', {
    method: 'POST',
    body: payload,
    bearerToken: token,
  });
}

export async function fetchTicketStatus(accessKey: string): Promise<unknown> {
  return apiFetch(`/v2/ticketing/public/ticket?key=${encodeURIComponent(accessKey)}`);
}

export async function fetchMyTickets(token: string): Promise<unknown> {
  return apiFetch('/v2/ticketing/me/filtered-tickets', { bearerToken: token });
}
