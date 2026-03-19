import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { ContractService } from '../services/ContractService';
import { ValidateParams } from '../decorators/ValidateParams';
import { ContractParams } from '../dtos/common.dto';

export class ContractsController {
  constructor(private readonly contractService: ContractService) {}

  @ValidateParams(ContractParams)
  getContract = async (req: AuthRequest & { paramsDto: ContractParams }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await this.contractService.getContractForProfile(
        req.paramsDto.id,
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
