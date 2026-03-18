import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { ContractService } from '../services/ContractService';

export class ContractsController {
  constructor(private readonly contractService: ContractService) {}

  getContract = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await this.contractService.getContractForProfile(
        String(req.params.id),
        req.profile._id,
      );
      res.json(contract);
    } catch (err) {
      next(err);
    }
  };

  getContracts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contracts = await this.contractService.getActiveContractsForProfile(req.profile._id);
      res.json(contracts);
    } catch (err) {
      next(err);
    }
  };
}
