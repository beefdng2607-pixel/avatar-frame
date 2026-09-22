import type { Request, Response } from 'express';
import type { ApiError } from '@avatar-frame/shared';

export function notFoundHandler(_req: Request, res: Response<ApiError>): void {
  res.status(404).json({ success: false, error: 'Route not found' });
}
