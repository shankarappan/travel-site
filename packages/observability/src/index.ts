import { loadEnv, type AppEnv } from './env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY =
  /(password|passwd|secret|token|authorization|api[_-]?key|card|cvv|cvc|pan|cookie|session)/i;

export interface Logger {
  child(bindings: Record<string, unknown>): Logger;
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

export function redactFields(fields: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = '[redacted]';
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = redactFields(value as Record<string, unknown>);
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function createRequestId(existing?: string | null): string {
  if (existing && existing.length >= 8) return existing;
  return crypto.randomUUID();
}

/** Lightweight metrics hook — swap for OTel/Prometheus exporter later. */
export type MetricsHook = (event: {
  name: string;
  value?: number;
  tags?: Record<string, string>;
}) => void;

let metricsHook: MetricsHook = () => undefined;

export function setMetricsHook(hook: MetricsHook): void {
  metricsHook = hook;
}

export function recordMetric(name: string, value = 1, tags: Record<string, string> = {}): void {
  metricsHook({ name, value, tags });
}

/** Error tracking integration point (Sentry/etc). */
export type ErrorTracker = (error: unknown, context?: Record<string, unknown>) => void;

let errorTracker: ErrorTracker = () => undefined;

export function setErrorTracker(tracker: ErrorTracker): void {
  errorTracker = tracker;
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  errorTracker(error, context ? redactFields(context) : undefined);
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
      ...redactFields(bindings),
      ...redactFields(fields),
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
