import { Router, RequestHandler } from 'express';
import { authMiddleware, contractsController, jobsController } from '../container';

const router = Router();

// ── Contracts ──────────────────────────────────────────────────────────────────
router.get('/contracts/:id', authMiddleware, contractsController.getContract as RequestHandler);
router.get('/contracts', authMiddleware, contractsController.getContracts as RequestHandler);

// ── Jobs ───────────────────────────────────────────────────────────────────────
router.get('/jobs/unpaid', authMiddleware, jobsController.getUnpaidJobs as RequestHandler);
router.post('/jobs/:job_id/pay', authMiddleware, jobsController.pay as RequestHandler);

export default router;
