import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AdminModel } from '../models/Admin.js';
import { env } from '../utils/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { ApiResponse, AuthResponse, Admin } from '@avatar-frame/shared';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(
  req: Request,
  res: Response<ApiResponse<AuthResponse>>,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      return next(new AppError(400, 'Invalid request data', fieldErrors));
    }

    const { email, password } = parseResult.data;

    const admin = await AdminModel.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return next(new AppError(401, 'Invalid email or password'));
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return next(new AppError(401, 'Invalid email or password'));
    }

    const token = jwt.sign({ sub: admin.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as '7d',
    });

    const isProd = env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          createdAt: admin.createdAt.toISOString(),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(
  _req: Request,
  res: Response<ApiResponse<{ message: string }>>,
): void {
  const isProd = env.NODE_ENV === 'production';
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  });

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ admin: Admin }>>,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.adminId) {
      return next(new AppError(401, 'Not authenticated'));
    }

    const admin = await AdminModel.findById(req.adminId);
    if (!admin) {
      return next(new AppError(404, 'Admin account not found'));
    }

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          createdAt: admin.createdAt.toISOString(),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
