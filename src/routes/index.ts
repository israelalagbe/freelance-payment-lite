import { Router, RequestHandler } from 'express';
import { authMiddleware, contractsController, jobsController, balancesController } from '../container';

const router = Router();

// ── Contracts ──────────────────────────────────────────────────────────────────
router.get('/contracts/:id', authMiddleware, contractsController.getContract as RequestHandler);
router.get('/contracts', authMiddleware, contractsController.getContracts as RequestHandler);

// ── Jobs ───────────────────────────────────────────────────────────────────────
router.get('/jobs/unpaid', authMiddleware, jobsController.getUnpaidJobs as RequestHandler);
router.post('/jobs/:job_id/pay', authMiddleware, jobsController.pay as RequestHandler);

// ── Balances ───────────────────────────────────────────────────────────────────
router.post('/balances/deposit/:userId', authMiddleware, balancesController.deposit as unknown as RequestHandler);

export default router;
