"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
exports.login = login;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const index_js_1 = require("../logger/index.js");
const demo_fixtures_js_1 = require("../mock/demo-fixtures.js");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().min(1).describe('E-mail cadastrado no Filazero'),
    password: zod_1.z.string().min(1).describe('Senha do usuário (não é armazenada nem logada)'),
});
const ALLOW_HTTP_LOGIN = process.env['ALLOW_HTTP_LOGIN'] === 'true';
const TRANSPORT = process.env['MCP_TRANSPORT'] ?? 'stdio';
async function login(input) {
    const TOOL = 'login';
    const start = Date.now();
    // Em demo mode, libera HTTP porque a senha do user é fictícia e nenhum
    // dado real é usado; o flag de bloqueio existe pra cenário de produção.
    if (TRANSPORT === 'http' && !ALLOW_HTTP_LOGIN && !demo_fixtures_js_1.DEMO_ENABLED) {
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
        const tokenResponse = await (0, filazero_js_1.fetchToken)(input.email, input.password);
        index_js_1.logger.info('Login successful', {
            tool: TOOL,
            duration_ms: Date.now() - start,
            cached: false,
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        access_token: tokenResponse.access_token,
                        expires_in: tokenResponse.expires_in,
                        userName: tokenResponse.userName,
                        message: 'Login realizado. Use o access_token como argumento "token" em schedule_appointment e list_my_tickets.',
                    }, null, 2),
                },
            ],
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Demo mode: login real falhou → cria conta sintética e devolve token mock
        if (demo_fixtures_js_1.DEMO_ENABLED) {
            const fake = (0, demo_fixtures_js_1.mockLogin)(input.email);
            index_js_1.logger.info('Demo mode: login real falhou, gerando token sintético', {
                tool: TOOL,
                duration_ms: Date.now() - start,
                cached: false,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            access_token: fake.access_token,
                            expires_in: fake.expires_in,
                            userName: fake.userName,
                            message: '[DEMO] Login simulado. Use este access_token em schedule_appointment e list_my_tickets.',
                        }, null, 2),
                    },
                ],
            };
        }
        index_js_1.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: 'auth_failure' });
        return {
            content: [{ type: 'text', text: `Falha no login: ${message}` }],
            isError: true,
        };
    }
}
