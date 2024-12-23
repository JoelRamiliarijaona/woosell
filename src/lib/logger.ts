import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'woosell' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;

// Fonctions utilitaires pour le logging
export const logSiteCreation = (userId: string, domain: string) => {
  logger.info('Site created', { userId, domain });
};

export const logWebhookError = (error: unknown, payload: unknown) => {
  logger.error('Webhook error', { error: error instanceof Error ? error.message : String(error), payload });
};

export const logBillingUpdate = (userId: string, orderCount: number, amount: number) => {
  logger.info('Billing updated', { userId, orderCount, amount });
};
