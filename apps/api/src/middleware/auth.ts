import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  adminId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const token: string | undefined =
    (req.cookies as Record<string, string | undefined>)['auth_token'];

  if (!token) {
    return next(new AppError(401, 'Authentication required'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    req.adminId = payload.sub;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}
