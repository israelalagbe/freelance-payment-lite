import pino from 'pino';
import config from '../config';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(config.nodeEnv !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

export default logger;
