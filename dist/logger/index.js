"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LEVEL_ORDER = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
function getConfiguredLevel() {
    const raw = (process.env['LOG_LEVEL'] ?? 'info').toLowerCase();
    if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
        return raw;
    }
    return 'info';
}
function log(level, message, extras = {}) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[getConfiguredLevel()])
        return;
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...extras,
    };
    process.stderr.write(JSON.stringify(entry) + '\n');
}
exports.logger = {
    debug: (msg, extras) => log('debug', msg, extras),
    info: (msg, extras) => log('info', msg, extras),
    warn: (msg, extras) => log('warn', msg, extras),
    error: (msg, extras) => log('error', msg, extras),
};
