"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
exports.register = register;
const zod_1 = require("zod");
const index_js_1 = require("../logger/index.js");
const demo_fixtures_js_1 = require("../mock/demo-fixtures.js");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().min(1).describe('E-mail para a nova conta'),
    password: zod_1.z.string().min(1).describe('Senha (não é armazenada nem logada)'),
    name: zod_1.z.string().min(1).describe('Nome completo do usuário'),
});
const ALLOW_HTTP_LOGIN = process.env['ALLOW_HTTP_LOGIN'] === 'true';
const TRANSPORT = process.env['MCP_TRANSPORT'] ?? 'stdio';
async function register(input) {
    const TOOL = 'register';
    const start = Date.now();
    if (TRANSPORT === 'http' && !ALLOW_HTTP_LOGIN && !demo_fixtures_js_1.DEMO_ENABLED) {
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
    if (demo_fixtures_js_1.DEMO_ENABLED) {
        const fake = (0, demo_fixtures_js_1.mockLogin)(input.email);
        index_js_1.logger.info('Demo mode: registro simulado', {
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
                        userName: input.email,
                        name: input.name,
                        message: '[DEMO] Conta simulada criada. Use este access_token em schedule_appointment e list_my_tickets.',
                    }, null, 2),
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
