import { ProfileRepository } from './repositories/ProfileRepository';
import { ContractRepository } from './repositories/ContractRepository';
import { JobRepository } from './repositories/JobRepository';
import { AuditLogRepository } from './repositories/AuditLogRepository';
import { ContractService } from './services/ContractService';
import { PaymentService } from './services/PaymentService';
import { DepositService } from './services/DepositService';
import { AnalyticsService } from './services/AnalyticsService';
import { ContractsController } from './controllers/ContractsController';
import { JobsController } from './controllers/JobsController';
import { BalancesController } from './controllers/BalancesController';
import { AdminController } from './controllers/AdminController';
import { createAuthMiddleware } from './middleware/authenticate';

// ── Repositories ──────────────────────────────────────────────────────────────
export const profileRepository = new ProfileRepository();
export const contractRepository = new ContractRepository();
export const jobRepository = new JobRepository();
export const auditLogRepository = new AuditLogRepository();
// ── Middleware ────────────────────────────────────────────────────────────────
export const authMiddleware = createAuthMiddleware(profileRepository);

// ── Feature: Contracts ────────────────────────────────────────────────────────
export const contractService = new ContractService(contractRepository);
export const contractsController = new ContractsController(contractService);

// ── Feature: Jobs ─────────────────────────────────────────────────────────────
export const paymentService = new PaymentService(
  jobRepository,
  contractRepository,
  profileRepository,
  auditLogRepository,
);
export const jobsController = new JobsController(paymentService);

// ── Feature: Balances ─────────────────────────────────────────────────────────
export const depositService = new DepositService(
  profileRepository,
  jobRepository,
  contractRepository,
  auditLogRepository,
);
export const balancesController = new BalancesController(depositService);

// ── Feature: Admin analytics ────────────────────────────────────────────────
export const analyticsService = new AnalyticsService(jobRepository);
export const adminController = new AdminController(analyticsService);

