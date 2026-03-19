import { JobRepository, BestProfessionResult, BestClientResult } from '../repositories/JobRepository';
import { NotFoundError } from '../utils/errors';

export class AnalyticsService {
  constructor(private readonly jobRepo: JobRepository) {}

  async getBestProfession(start: Date, end: Date): Promise<BestProfessionResult> {
    const result = await this.jobRepo.getBestProfession(start, end);
    if (!result) throw new NotFoundError('No paid jobs found in the given date range');
    return result;
  }

  async getBestClients(start: Date, end: Date, limit: number): Promise<BestClientResult[]> {
    return this.jobRepo.getBestClients(start, end, limit);
  }
}
