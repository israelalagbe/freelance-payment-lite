import 'dotenv/config';
import express from 'express';
import { connectDB } from './utils/db';
import { errorHandler } from './middleware/errorHandler';
import router from './routes';
import config from './config';
import logger from './utils/logger';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(router);

app.use(errorHandler);

if (require.main === module) {
  connectDB().then(() => {
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  });
}

export default app;
