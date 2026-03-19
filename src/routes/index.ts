import { Router, RequestHandler } from 'express';
import { authMiddleware, contractsController, jobsController, balancesController, adminController } from '../container';

const router = Router();

// ── Contracts ──────────────────────────────────────────────────────────────────
router.get('/contracts/:id', authMiddleware, contractsController.getContract as RequestHandler);
router.get('/contracts', authMiddleware, contractsController.getContracts as RequestHandler);

// ── Jobs ───────────────────────────────────────────────────────────────────────
router.get('/jobs/unpaid', authMiddleware, jobsController.getUnpaidJobs as RequestHandler);
router.post('/jobs/:job_id/pay', authMiddleware, jobsController.pay as RequestHandler);

// ── Balances ───────────────────────────────────────────────────────────────────
router.post('/balances/deposit/:userId', authMiddleware, balancesController.deposit as unknown as RequestHandler);

// ── Admin analytics ──────────────────────────────────────────────────────────
router.get('/admin/best-profession', adminController.getBestProfession as RequestHandler);
router.get('/admin/best-clients', adminController.getBestClients as RequestHandler);

export default router;
