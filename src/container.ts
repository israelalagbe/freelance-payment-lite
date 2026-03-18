import { ProfileRepository } from './repositories/ProfileRepository';
import { ContractRepository } from './repositories/ContractRepository';
import { JobRepository } from './repositories/JobRepository';
import { AuditLogRepository } from './repositories/AuditLogRepository';
import { ContractService } from './services/ContractService';
import { PaymentService } from './services/PaymentService';
import { ContractsController } from './controllers/ContractsController';
import { JobsController } from './controllers/JobsController';
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

