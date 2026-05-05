import { z } from 'zod';
import { logger } from '../logger/index.js';
import { DEMO_ENABLED, mockLogin } from '../mock/demo-fixtures.js';
import type { ToolResult } from '../types/index.js';

export const registerSchema = z.object({
  email: z.string().min(1).describe('E-mail para a nova conta'),
  password: z.string().min(1).describe('Senha (não é armazenada nem logada)'),
  name: z.string().min(1).describe('Nome completo do usuário'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

const ALLOW_HTTP_LOGIN = process.env['ALLOW_HTTP_LOGIN'] === 'true';
const TRANSPORT = process.env['MCP_TRANSPORT'] ?? 'stdio';

export async function register(input: RegisterInput): Promise<ToolResult> {
  const TOOL = 'register';
  const start = Date.now();

  if (TRANSPORT === 'http' && !ALLOW_HTTP_LOGIN && !DEMO_ENABLED) {
    return {
      content: [
        {
          type: 'text',
          text: 'Registro bloqueado: o servidor está em modo HTTP. Use stdio (Claude Desktop local) ou defina ALLOW_HTTP_LOGIN=true.',
        },
      ],
      isError: true,
    };
  }

  // Em demo mode, registro é simulado: gera token sintético idêntico ao
  // do login mock. Em produção, o registro real do Filazero não tem
  // endpoint público OAuth — o usuário precisa se registrar via app.filazero.net.
  if (DEMO_ENABLED) {
    const fake = mockLogin(input.email);
    logger.info('Demo mode: registro simulado', {
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
              access_token: fake.access_token,
              expires_in: fake.expires_in,
              userName: input.email,
              name: input.name,
              message:
                '[DEMO] Conta simulada criada. Use este access_token em schedule_appointment e list_my_tickets.',
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: 'O Filazero não expõe registro via API pública. Crie sua conta em https://app.filazero.net e depois use a tool login para autenticar.',
      },
    ],
    isError: true,
  };
}
