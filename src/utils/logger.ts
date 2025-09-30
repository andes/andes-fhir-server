import { createLogger, format, transports } from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = createLogger({
  level: process.env.LOGGING_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev
    ? format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, timestamp }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      )
    : format.combine(
        format.timestamp(),
        format.json()
      ),
  transports: [
    new transports.Console()
  ]
});
