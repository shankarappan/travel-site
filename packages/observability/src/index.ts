import { loadEnv, type AppEnv } from './env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  child(bindings: Record<string, unknown>): Logger;
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

export function createLogger(
  bindings: Record<string, unknown> = {},
  env: AppEnv = loadEnv(),
): Logger {
  const minLevel = env.LOG_LEVEL;

  const write = (level: LogLevel, message: string, fields?: Record<string, unknown>) => {
    if (levelWeight[level] < levelWeight[minLevel]) {
      return;
    }
    const entry = {
      level,
      msg: message,
      time: new Date().toISOString(),
      ...bindings,
      ...fields,
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  };

  return {
    child(childBindings) {
      return createLogger({ ...bindings, ...childBindings }, env);
    },
    debug: (message, fields) => write('debug', message, fields),
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
  };
}

export { loadEnv, envSchema } from './env.js';
export type { AppEnv } from './env.js';
