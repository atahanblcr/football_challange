// src/utils/logger.util.ts
import { env } from '../config/env';

/**
 * MVP için basit bir structured logger.
 * İleride Winston veya Pino ile değiştirilebilir.
 */
export const logger = {
  info: (message: string, context?: any) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message, context }));
  },
  warn: (message: string, context?: any) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', message, context }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error
    }));
  },
  debug: (message: string, context?: any) => {
    if (env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({ timestamp: new Date().toISOString(), level: 'DEBUG', message, context }));
    }
  }
};
