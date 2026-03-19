import { Response, NextFunction } from 'express';
import { DepositService } from '../services/DepositService';
import { AuthRequest } from '../middleware/authenticate';
import { ValidateBody } from '../decorators/ValidateBody';
import { DepositDto } from '../dtos/deposit.dto';

export class BalancesController {
  constructor(private readonly depositService: DepositService) {}

  @ValidateBody(DepositDto)
  deposit = async (req: AuthRequest & { dto: DepositDto }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.userId);
      const profile = await this.depositService.deposit(userId, req.profile._id, req.dto.amount);
      res.status(200).json({ balance: profile.balance });
    } catch (err) {
      next(err);
    }
  };
}
