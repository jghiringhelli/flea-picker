/// <reference types="vite/client" />

/**
 * Minimal structured logger for the Flea Picker game.
 *
 * In production, `debug` and `info` calls are suppressed.
 * In development (`import.meta.env.DEV`), all levels are active.
 *
 * Usage:
 *   import { logger } from '@/shared/logging/logger';
 *   logger.info('game-engine', 'GameLoop started', { hz: 60 });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  readonly level: LogLevel;
  readonly module: string;
  readonly message: string;
  readonly data?: Readonly<Record<string, unknown>> | undefined;
  readonly timestamp: string;
}

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;
  return entry.data ? `${base} ${JSON.stringify(entry.data)}` : base;
}

function log(
  level: LogLevel,
  module: string,
  message: string,
  data?: Readonly<Record<string, unknown>>,
): void {
  if (!isDev && (level === 'debug' || level === 'info')) return;

  const entry: LogEntry = {
    level,
    module,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'debug':
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

export const logger = {
  /** Verbose diagnostic messages — only emitted in development mode. */
  debug(module: string, message: string, data?: Readonly<Record<string, unknown>>): void {
    log('debug', module, message, data);
  },

  /** Informational messages — only emitted in development mode. */
  info(module: string, message: string, data?: Readonly<Record<string, unknown>>): void {
    log('info', module, message, data);
  },

  /** Warnings — always emitted. */
  warn(module: string, message: string, data?: Readonly<Record<string, unknown>>): void {
    log('warn', module, message, data);
  },

  /** Errors — always emitted. */
  error(module: string, message: string, data?: Readonly<Record<string, unknown>>): void {
    log('error', module, message, data);
  },
} as const;
