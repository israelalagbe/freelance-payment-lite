import { Request, Response, NextFunction } from 'express';
import { IProfile } from '../models/Profile';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  profile: IProfile;
}

export function createAuthMiddleware(profileRepo: ProfileRepository) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const profileId = req.headers['profile_id'];
    if (!profileId || typeof profileId !== 'string') {
      return next(new UnauthorizedError('Missing profile_id header'));
    }

    const profile = await profileRepo.findById(profileId).catch(() => null);
    if (!profile) return next(new UnauthorizedError('Profile not found'));

    (req as AuthRequest).profile = profile;
    next();
  };
}
