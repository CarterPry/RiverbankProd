// backend/src/utils/logger.ts
import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'soc2-testing' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transport in production
if (config.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Add Loki transport if configured
if (config.NODE_ENV === 'production' && process.env.LOKI_URL) {
  const LokiTransport = require('winston-loki');
  logger.add(
    new LokiTransport({
      host: process.env.LOKI_URL,
      labels: {
        app: 'soc2-testing',
        environment: config.NODE_ENV,
      },
    })
  );
}

// Create a child logger for specific contexts
export function createLogger(context: string): winston.Logger {
  return logger.child({ context });
} 