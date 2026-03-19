import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { PaymentService } from '../services/PaymentService';
import { ValidateHeaders } from '../decorators/ValidateHeaders';
import { ValidateParams } from '../decorators/ValidateParams';
import { PayJobHeaders } from '../dtos/jobs.dto';
import { JobParams } from '../dtos/common.dto';

export class JobsController {
  constructor(private readonly paymentService: PaymentService) {}

  getUnpaidJobs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs = await this.paymentService.getUnpaidJobs(req.profile._id);
      res.json(jobs);
    } catch (err) {
      next(err);
    }
  };

  @ValidateParams(JobParams)
  @ValidateHeaders(PayJobHeaders)
  pay = async (req: AuthRequest & { paramsDto: JobParams; headersDto: PayJobHeaders }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.paymentService.payJob(
        req.paramsDto.job_id,
        req.profile._id,
        req.headersDto['idempotency-key'],
      );
      res.json(job);
    } catch (err) {
      next(err);
    }
  };
}
