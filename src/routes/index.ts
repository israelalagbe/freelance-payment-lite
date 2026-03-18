import { Router, RequestHandler } from 'express';
import { authMiddleware, contractsController } from '../container';

const router = Router();

// ── Contracts ──────────────────────────────────────────────────────────────────
router.get('/contracts/:id', authMiddleware, contractsController.getContract as RequestHandler);
router.get('/contracts', authMiddleware, contractsController.getContracts as RequestHandler);

export default router;
