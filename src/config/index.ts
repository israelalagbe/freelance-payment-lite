import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().min(1).transform((v) => parseInt(v, 10)),
  MONGODB_URI: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const config = {
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGODB_URI,
  nodeEnv: parsed.data.NODE_ENV,
} as const;

export default config;
