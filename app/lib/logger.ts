// src/app/lib/logger.ts
import * as logfire from 'logfire';

let isLogfireConfigured = false;

if (!isLogfireConfigured) {
  logfire.configure({
    token: process.env.LOGGER_API_KEY!,
    serviceName: process.env.LOG_SERVICE_NAME || 'career-counselor-api',
    serviceVersion: '1.0.0',
  });
  isLogfireConfigured = true;
}

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

export const log = (
  level: 'info' | 'warn' | 'error',
  message: string,
  tags: string[] = [],
  extra: Record<string, any> = {}
) => {
  const baseTags = ['api', ...tags];
  const timestamp = getTimestamp();

  switch (level) {
    case 'info':
      logfire.info(message, extra, { tags: baseTags });
      break;
    case 'warn':
      // Logfire has no native warn method — treat as info with "warn" tag
      logfire.info(`WARN: ${message}`, extra, { tags: ['warn', ...baseTags] });
      break;
    case 'error':
      logfire.error(message, extra, { tags: ['error', ...baseTags] });
      break;
  }

  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, {
    tags: baseTags,
    ...extra,
  });
};

// Shorthand methods (attach manually to the function)
log.info = (msg: string, tags?: string[], extra?: Record<string, any>) =>
  log('info', msg, tags, extra);

log.warn = (msg: string, tags?: string[], extra?: Record<string, any>) =>
  log('warn', msg, tags, extra);

log.error = (msg: string, tags?: string[], extra?: Record<string, any>) =>
  log('error', msg, tags, extra);
