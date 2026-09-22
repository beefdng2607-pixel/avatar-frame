import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@avatar-frame/shared';
import { env } from '../utils/env.js';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ApiError>,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
