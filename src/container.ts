import { ProfileRepository } from './repositories/ProfileRepository';
import { ContractRepository } from './repositories/ContractRepository';
import { ContractService } from './services/ContractService';
import { ContractsController } from './controllers/ContractsController';
import { createAuthMiddleware } from './middleware/authenticate';

// ── Repositories ──────────────────────────────────────────────────────────────
export const profileRepository = new ProfileRepository();
export const contractRepository = new ContractRepository();

// ── Middleware ────────────────────────────────────────────────────────────────
export const authMiddleware = createAuthMiddleware(profileRepository);

// ── Feature: Contracts ────────────────────────────────────────────────────────
export const contractService = new ContractService(contractRepository);
export const contractsController = new ContractsController(contractService);

