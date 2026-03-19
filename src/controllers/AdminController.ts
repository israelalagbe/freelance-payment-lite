import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { DateRangeQuery, BestClientsQuery } from '../dtos/admin.dto';
import { ValidateQuery } from '../decorators/ValidateQuery';

export class AdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ValidateQuery(DateRangeQuery)
  getBestProfession = async (req: Request & { dto: DateRangeQuery }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { start, end } = req.dto;
      const result = await this.analyticsService.getBestProfession(start, end);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  @ValidateQuery(BestClientsQuery)
  getBestClients = async (req: Request & { dto: BestClientsQuery }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { start, end, limit } = req.dto;
      const results = await this.analyticsService.getBestClients(start, end, limit);
      res.json(results);
    } catch (err) {
      next(err);
    }
  };
}
