import { z } from 'zod';
import { fetchToken } from '../client/filazero.js';
import { DEMO_ENABLED, mockLogin } from '../mock/demo-fixtures.js';
import { logger } from '../logger/index.js';
import type { ToolResult } from '../types/index.js';

export const loginSchema = z.object({
  email: z.string().email().describe('E-mail do usuário'),
  password: z.string().min(1).describe('Senha do usuário'),
});

export const registerSchema = z.object({
  email: z.string().email().describe('E-mail do usuário'),
  password: z.string().min(1).describe('Senha do usuário'),
  name: z.string().min(1).describe('Nome completo do usuário'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export async function login(input: LoginInput): Promise<ToolResult> {
  const TOOL = 'login';
  const start = Date.now();

  if (DEMO_ENABLED) {
    const mock = mockLogin(input.email);
    logger.info('Demo mode: returning mock token', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ access_token: mock.access_token, userName: mock.userName, email: input.email }),
        },
      ],
    };
  }

  try {
    const tokenData = await fetchToken(input.email, input.password);
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ access_token: tokenData.access_token, userName: tokenData.userName ?? input.email, email: input.email }),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: message }], isError: true };
  }
}

export async function register(input: RegisterInput): Promise<ToolResult> {
  const TOOL = 'register';
  const start = Date.now();

  try {
    const mock = mockLogin(input.email);
    logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ access_token: mock.access_token, userName: input.name, email: input.email }),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
    return { content: [{ type: 'text', text: message }], isError: true };
  }
}
