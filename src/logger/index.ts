type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tool?: string;
  duration_ms?: number;
  cached?: boolean;
  message: string;
  error?: string;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const raw = (process.env['LOG_LEVEL'] ?? 'info').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
}

function log(
  level: LogLevel,
  message: string,
  extras: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>> = {},
): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[getConfiguredLevel()]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extras,
  };

  process.stderr.write(JSON.stringify(entry) + '\n');
}

export const logger = {
  debug: (msg: string, extras?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>) =>
    log('debug', msg, extras),
  info: (msg: string, extras?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>) =>
    log('info', msg, extras),
  warn: (msg: string, extras?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>) =>
    log('warn', msg, extras),
  error: (msg: string, extras?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>) =>
    log('error', msg, extras),
};
