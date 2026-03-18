import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/freelance_payment',
  depositLimitPct: parseFloat(process.env.DEPOSIT_LIMIT_PCT ?? '0.25'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

export default config;
