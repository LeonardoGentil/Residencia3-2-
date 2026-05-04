import { z } from 'zod';
import { fetchToken } from '../client/filazero.js';
import { logger } from '../logger/index.js';
import type { ToolResult } from '../types/index.js';

export const loginSchema = z.object({
  email: z.string().min(1).describe('E-mail cadastrado no Filazero'),
  password: z.string().min(1).describe('Senha do usuário (não é armazenada nem logada)'),
});

export type LoginInput = z.infer<typeof loginSchema>;

const ALLOW_HTTP_LOGIN = process.env['ALLOW_HTTP_LOGIN'] === 'true';
const TRANSPORT = process.env['MCP_TRANSPORT'] ?? 'stdio';

export async function login(input: LoginInput): Promise<ToolResult> {
  const TOOL = 'login';
  const start = Date.now();

  if (TRANSPORT === 'http' && !ALLOW_HTTP_LOGIN) {
    return {
      content: [
        {
          type: 'text',
          text: 'Login bloqueado: o servidor está em modo HTTP. Use stdio (Claude Desktop local) ou defina ALLOW_HTTP_LOGIN=true se você for o operador da rede.',
        },
      ],
      isError: true,
    };
  }

  try {
    const tokenResponse = await fetchToken(input.email, input.password);

    logger.info('Login successful', {
      tool: TOOL,
      duration_ms: Date.now() - start,
      cached: false,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              access_token: tokenResponse.access_token,
              expires_in: tokenResponse.expires_in,
              userName: tokenResponse.userName,
              message:
                'Login realizado. Use o access_token como argumento "token" em schedule_appointment e list_my_tickets.',
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: 'auth_failure' });
    return {
      content: [{ type: 'text', text: `Falha no login: ${message}` }],
      isError: true,
    };
  }
}
