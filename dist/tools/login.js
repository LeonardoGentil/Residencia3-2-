"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
exports.login = login;
exports.register = register;
const zod_1 = require("zod");
const filazero_js_1 = require("../client/filazero.js");
const demo_fixtures_js_1 = require("../mock/demo-fixtures.js");
const index_js_1 = require("../logger/index.js");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().describe('E-mail do usuário'),
    password: zod_1.z.string().min(1).describe('Senha do usuário'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().describe('E-mail do usuário'),
    password: zod_1.z.string().min(1).describe('Senha do usuário'),
    name: zod_1.z.string().min(1).describe('Nome completo do usuário'),
});
async function login(input) {
    const TOOL = 'login';
    const start = Date.now();
    if (demo_fixtures_js_1.DEMO_ENABLED) {
        const mock = (0, demo_fixtures_js_1.mockLogin)(input.email);
        index_js_1.logger.info('Demo mode: returning mock token', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
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
        const tokenData = await (0, filazero_js_1.fetchToken)(input.email, input.password);
        index_js_1.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ access_token: tokenData.access_token, userName: tokenData.userName ?? input.email, email: input.email }),
                },
            ],
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_1.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: message }], isError: true };
    }
}
async function register(input) {
    const TOOL = 'register';
    const start = Date.now();
    try {
        const mock = (0, demo_fixtures_js_1.mockLogin)(input.email);
        index_js_1.logger.info('Tool executed successfully', { tool: TOOL, duration_ms: Date.now() - start, cached: false });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ access_token: mock.access_token, userName: input.name, email: input.email }),
                },
            ],
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        index_js_1.logger.error('Tool failed', { tool: TOOL, duration_ms: Date.now() - start, error: message });
        return { content: [{ type: 'text', text: message }], isError: true };
    }
}
