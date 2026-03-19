import { Response, NextFunction } from 'express';
import { DepositService } from '../services/DepositService';
import { AuthRequest } from '../middleware/authenticate';
import { ValidateBody } from '../decorators/ValidateBody';
import { ValidateParams } from '../decorators/ValidateParams';
import { DepositDto } from '../dtos/deposit.dto';
import { UserParams } from '../dtos/common.dto';

export class BalancesController {
  constructor(private readonly depositService: DepositService) {}

  @ValidateParams(UserParams)
  @ValidateBody(DepositDto)
  deposit = async (req: AuthRequest & { paramsDto: UserParams; dto: DepositDto }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.depositService.deposit(req.paramsDto.userId, req.profile._id, req.dto.amount);
      res.status(200).json({ balance: profile.balance });
    } catch (err) {
      next(err);
    }
  };
}
