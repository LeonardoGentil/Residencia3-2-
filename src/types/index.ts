// ─── API response types ───────────────────────────────────────────────────────

export interface ApiMessage {
  type: 'ERROR' | 'WARNING' | 'INFO';
  description: string;
}

export interface ApiResponse<T> {
  data?: T;
  messages?: ApiMessage[];
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  slug: string;
  name: string;
  description: string;
  locationId?: number;
  locations?: Array<{ id: number; name?: string }>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface Service {
  id: number;
  abstractServiceId: number;
  name: string;
  description: string;
  locationId?: number;
  locations?: Array<{ id: number; name?: string }>;
}

// ─── Available dates ──────────────────────────────────────────────────────────

export interface AvailableDay {
  date: string; // ISO UTC
}

// ─── Session / slot ───────────────────────────────────────────────────────────

export interface SessionResource {
  sessionId: number;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  professionalName: string;
  locationId: number;
}

// ─── Custom field ─────────────────────────────────────────────────────────────

export interface CustomField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface Ticket {
  id: number;
  accessKey: string;
  status: TicketStatus;
  serviceName: string;
  companyName: string;
  scheduledAt: string; // ISO UTC
  createdAt: string;
}

// ─── Tool result helpers ──────────────────────────────────────────────────────
// Re-export SDK type so all tools use the same definition

export type { CallToolResult as ToolResult } from '@modelcontextprotocol/sdk/types.js';
