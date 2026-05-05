// ─── Modo demo ────────────────────────────────────────────────────────────────
// Quando FILAZERO_DEMO_MODE=true, as tools dos passos 4-8 (que dependem de
// agendas configuradas na staging do Filazero) servem dados mockados se a
// API real retornar vazio. list_companies e get_company_services continuam
// hitting a API real — só os endpoints de availability/booking são supridos
// pelo mock.
//
// Fixtures são determinísticas e coerentes: dates cabem em qualquer mês,
// sessions têm IDs estáveis, schedule_appointment guarda o ticket criado
// num cache em memória pra que check_ticket_status responda corretamente
// depois.

import { randomUUID } from 'node:crypto';

export const DEMO_ENABLED = process.env['FILAZERO_DEMO_MODE'] === 'true';

// ── get_available_dates ──────────────────────────────────────────────────────
// 5 dias variados em qualquer mês (5, 10, 15, 20, 25)
export function mockAvailableDates(year: number, month: number): Array<Record<string, unknown>> {
  return [5, 10, 15, 20, 25].map((day) => ({
    date: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`,
    locationId: 1,
    providerId: 1,
  }));
}

// ── get_available_sessions ───────────────────────────────────────────────────
// 4 horários por dia, profissionais fictícios
const DEMO_PROFESSIONALS = ['Dr. Demo Silva', 'Dra. Maria Teste', 'Dr. Cliente Exemplo', 'Dra. Ana Sandbox'];

export function mockAvailableSessions(date: string): Array<Record<string, unknown>> {
  // Convert YYYY-MM-DD para horário formatado
  const [yearStr, monthStr, dayStr] = date.split('-');
  if (!yearStr || !monthStr || !dayStr) return [];

  const slots = ['09:00', '10:00', '14:00', '15:00'];
  return slots.map((time, idx) => ({
    sessionId: 1001 + idx,
    startTime: `${dayStr}/${monthStr}/${yearStr} ${time}`,
    endTime: `${dayStr}/${monthStr}/${yearStr} ${time === '09:00' ? '09:30' : time === '10:00' ? '10:30' : time === '14:00' ? '14:30' : '15:30'}`,
    professionalName: DEMO_PROFESSIONALS[idx] ?? 'Profissional Demo',
    locationId: 1,
  }));
}

// ── get_booking_form ─────────────────────────────────────────────────────────
// Form genérico com campos típicos
export function mockBookingForm(): Array<Record<string, unknown>> {
  return [
    { name: 'nome', label: 'Nome completo', type: 'text', required: true },
    { name: 'cpf', label: 'CPF', type: 'text', required: true },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
    { name: 'telefone', label: 'Telefone', type: 'tel', required: false },
  ];
}

// ── schedule_appointment + check_ticket_status (compartilham estado) ─────────
// Cache em memória dos tickets criados via mock pra que consulta posterior
// retorne o mesmo ticket.

interface MockTicket {
  id: number;
  accessKey: string;
  status: string;
  serviceName: string;
  companyName: string;
  scheduledAt: string;
  createdAt: string;
}

const mockTicketsByKey = new Map<string, MockTicket>();
const mockTicketsByUser: MockTicket[] = [];
let nextTicketId = 9001;

export function mockCreateTicket(_input: {
  sessionId: number;
  serviceId: number;
  formData: Record<string, string>;
}): MockTicket {
  const ticket: MockTicket = {
    id: nextTicketId++,
    accessKey: randomUUID(),
    status: 'PENDING',
    serviceName: 'Serviço demo',
    companyName: 'Empresa demo',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  mockTicketsByKey.set(ticket.accessKey, ticket);
  mockTicketsByUser.unshift(ticket);
  return ticket;
}

export function mockGetTicket(accessKey: string): MockTicket | null {
  return mockTicketsByKey.get(accessKey) ?? null;
}

// ── login (demo) ─────────────────────────────────────────────────────────────
// Quando DEMO + login real falhar, geramos um token sintético com prefixo
// "demo-" para que list_my_tickets reconheça depois.
export function mockLogin(email: string): {
  access_token: string;
  expires_in: number;
  userName: string;
} {
  const tokenSuffix = randomUUID().slice(0, 12);
  return {
    access_token: `demo-${email.replace(/[^a-z0-9]/gi, '').slice(0, 8)}-${tokenSuffix}`,
    expires_in: 86400,
    userName: email,
  };
}

export function mockListMyTickets(): MockTicket[] {
  // Se nada foi criado ainda, devolve 1 fixture para a tool ter o que mostrar
  if (mockTicketsByUser.length === 0) {
    return [
      {
        id: 9000,
        accessKey: 'demo-ticket-fixture',
        status: 'CONFIRMED',
        serviceName: 'CONSULTA PEDIATRIA',
        companyName: 'servicos ltda',
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
  }
  return mockTicketsByUser;
}
