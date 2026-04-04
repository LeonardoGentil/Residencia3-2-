"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveServiceId = resolveServiceId;
exports.fetchCompanies = fetchCompanies;
exports.fetchCompanyServices = fetchCompanyServices;
exports.fetchAvailableDates = fetchAvailableDates;
exports.fetchAvailableSessions = fetchAvailableSessions;
exports.fetchCustomFields = fetchCustomFields;
exports.postTicket = postTicket;
exports.fetchTicketStatus = fetchTicketStatus;
exports.fetchMyTickets = fetchMyTickets;
const index_js_1 = require("../logger/index.js");
// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = process.env['FILAZERO_API_URL'] ?? 'https://api.staging.filazero.net';
const APP_ORIGIN = process.env['FILAZERO_APP_ORIGIN'] ?? 'https://app.filazero.net';
const REQUIRED_HEADERS = {
    Accept: 'application/json, text/plain, */*',
    Origin: APP_ORIGIN,
    Referer: `${APP_ORIGIN}/`,
    'User-Agent': 'MCP-Server-FilaZero/1.0',
    DNT: '1',
};
const WRITE_HEADERS = {
    'Content-Type': 'application/json;charset=UTF-8',
};
// ─── Rate limiter (sliding window per minute) ─────────────────────────────────
const RPM_LIMIT = Number(process.env['RATE_LIMIT_RPM'] ?? 30);
const requestTimestamps = [];
function checkRateLimit() {
    const now = Date.now();
    const windowStart = now - 60_000;
    // Drop timestamps outside the window
    while (requestTimestamps.length > 0 && (requestTimestamps[0] ?? 0) < windowStart) {
        requestTimestamps.shift();
    }
    if (requestTimestamps.length >= RPM_LIMIT) {
        const oldest = requestTimestamps[0] ?? now;
        const waitMs = 60_000 - (now - oldest);
        throw new Error(`Rate limit atingido (${RPM_LIMIT} req/min). Aguarde ${Math.ceil(waitMs / 1000)}s antes de tentar novamente.`);
    }
    requestTimestamps.push(now);
}
// ─── Business-level error check ───────────────────────────────────────────────
function checkApiErrors(response) {
    const messages = response['messages'];
    if (!Array.isArray(messages) || messages.length === 0)
        return;
    const errors = messages.filter((m) => m.type === 'ERROR');
    if (errors.length > 0 && errors[0]) {
        throw new Error(errors[0].description);
    }
}
// ─── resolveServiceId ─────────────────────────────────────────────────────────
function resolveServiceId(service) {
    if (service.abstractServiceId !== undefined && service.abstractServiceId > 0) {
        return service.abstractServiceId;
    }
    return service.id;
}
async function apiFetch(path, options = {}) {
    const { method = 'GET', body, bearerToken, maxRetries = 3 } = options;
    checkRateLimit();
    const headers = { ...REQUIRED_HEADERS };
    if (method !== 'GET' && method !== 'DELETE') {
        Object.assign(headers, WRITE_HEADERS);
    }
    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    const url = `${BASE_URL}${path}`;
    const init = {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
    };
    let lastError = new Error('Unknown error');
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, init);
            if (res.status === 401 || res.status === 403) {
                throw new Error('Token inválido ou expirado. Por favor, faça login novamente para obter um novo token.');
            }
            if (!res.ok) {
                throw new Error(`API respondeu com status ${res.status}: ${res.statusText}`);
            }
            const json = (await res.json());
            checkApiErrors(json);
            return json;
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            // Do not retry auth errors or business errors
            const msg = lastError.message;
            if (msg.includes('Token inválido') ||
                msg.includes('Rate limit') ||
                msg.includes('status 4')) {
                throw lastError;
            }
            if (attempt < maxRetries) {
                const delay = 2 ** (attempt - 1) * 500; // 500ms, 1s, 2s
                index_js_1.logger.warn(`Tentativa ${attempt} falhou. Retry em ${delay}ms.`, {
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
async function fetchCompanies() {
    return apiFetch('/api/companies');
}
async function fetchCompanyServices(slug) {
    return apiFetch(`/api/companies/${encodeURIComponent(slug)}/services`);
}
async function fetchAvailableDates(slug, serviceId, year, month) {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    return apiFetch(`/v2/scheduling/self-service/providers/${encodeURIComponent(slug)}/services/${serviceId}/available-session-days?${params}`);
}
async function fetchAvailableSessions(slug, locationId, serviceId, date) {
    const params = new URLSearchParams({ date });
    return apiFetch(`/v2/scheduling/self-service/providers/${encodeURIComponent(slug)}/locations/${locationId}/services/${serviceId}/sessions-resources-by-service?${params}`);
}
async function fetchCustomFields(providerId, sessionId) {
    return apiFetch(`/api/providers/${providerId}/sessions/${sessionId}/custom-fields`);
}
async function postTicket(token, payload) {
    return apiFetch('/v2/ticketing/tickets', {
        method: 'POST',
        body: payload,
        bearerToken: token,
    });
}
async function fetchTicketStatus(accessKey) {
    return apiFetch(`/v2/ticketing/public/ticket?key=${encodeURIComponent(accessKey)}`);
}
async function fetchMyTickets(token) {
    return apiFetch('/v2/ticketing/me/filtered-tickets', { bearerToken: token });
}
