import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { PaymentService } from '../services/PaymentService';

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

  pay = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paymentReference = req.headers['idempotency-key'];
      const job = await this.paymentService.payJob(
        String(req.params.job_id),
        req.profile._id,
        typeof paymentReference === 'string' ? paymentReference : undefined,
      );
      res.json(job);
    } catch (err) {
      next(err);
    }
  };
}
