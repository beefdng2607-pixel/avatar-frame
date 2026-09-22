import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CampaignModel, getEffectiveStatus } from '../models/Campaign.js';
import { AppError } from '../middleware/errorHandler.js';
import { storageService } from '../services/storage.js';
import { validatePngFrame } from '../utils/imageValidator.js';
import type {
  ApiResponse,
  Campaign,
  CampaignStatus,
  PaginatedResponse,
} from '@avatar-frame/shared';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(60, 'Slug is too long')
    .regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(1000).optional().default(''),
  status: z.enum(['draft', 'active', 'expired', 'disabled']).optional().default('draft'),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(60).regex(slugRegex).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'active', 'expired', 'disabled']).optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
});

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function listCampaigns(
  req: Request,
  res: Response<ApiResponse<PaginatedResponse<Campaign>>>,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 10));
    const search = (req.query.search as string)?.trim();
    const status = req.query.status as CampaignStatus | undefined;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await CampaignModel.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize) || 1;

    const docs = await CampaignModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const items: Campaign[] = docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      frameUrl: doc.frameUrl,
      status: getEffectiveStatus(doc),
      startAt: doc.startAt ? doc.startAt.toISOString() : null,
      endAt: doc.endAt ? doc.endAt.toISOString() : null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createCampaign(
  req: Request,
  res: Response<ApiResponse<Campaign>>,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = createCampaignSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(
        new AppError(400, 'Invalid campaign data', parseResult.error.flatten().fieldErrors),
      );
    }

    const { name, slug, description, status, startAt, endAt } = parseResult.data;

    const existing = await CampaignModel.findOne({ slug });
    if (existing) {
      return next(new AppError(409, `Campaign slug "${slug}" is already in use`));
    }

    const campaign = await CampaignModel.create({
      name,
      slug: slug.toLowerCase(),
      description,
      status,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
    });

    res.status(201).json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        frameUrl: campaign.frameUrl,
        status: getEffectiveStatus(campaign),
        startAt: campaign.startAt ? campaign.startAt.toISOString() : null,
        endAt: campaign.endAt ? campaign.endAt.toISOString() : null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignById(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<Campaign>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await CampaignModel.findById(id);
    if (!campaign) {
      return next(new AppError(404, 'Campaign not found'));
    }

    res.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        frameUrl: campaign.frameUrl,
        status: getEffectiveStatus(campaign),
        startAt: campaign.startAt ? campaign.startAt.toISOString() : null,
        endAt: campaign.endAt ? campaign.endAt.toISOString() : null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCampaign(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<Campaign>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const parseResult = updateCampaignSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(
        new AppError(400, 'Invalid campaign data', parseResult.error.flatten().fieldErrors),
      );
    }

    const campaign = await CampaignModel.findById(id);
    if (!campaign) {
      return next(new AppError(404, 'Campaign not found'));
    }

    const data = parseResult.data;

    if (data.slug && data.slug !== campaign.slug) {
      const existing = await CampaignModel.findOne({ slug: data.slug.toLowerCase() });
      if (existing) {
        return next(new AppError(409, `Campaign slug "${data.slug}" is already in use`));
      }
      campaign.slug = data.slug.toLowerCase();
    }

    if (data.name !== undefined) campaign.name = data.name;
    if (data.description !== undefined) campaign.description = data.description;
    if (data.status !== undefined) campaign.status = data.status;
    if (data.startAt !== undefined)
      campaign.startAt = data.startAt ? new Date(data.startAt) : null;
    if (data.endAt !== undefined) campaign.endAt = data.endAt ? new Date(data.endAt) : null;

    await campaign.save();

    res.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        frameUrl: campaign.frameUrl,
        status: getEffectiveStatus(campaign),
        startAt: campaign.startAt ? campaign.startAt.toISOString() : null,
        endAt: campaign.endAt ? campaign.endAt.toISOString() : null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCampaign(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<{ message: string }>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await CampaignModel.findById(id);
    if (!campaign) {
      return next(new AppError(404, 'Campaign not found'));
    }

    if (campaign.frameUrl) {
      await storageService.deleteFrame(campaign.frameUrl);
    }

    await CampaignModel.findByIdAndDelete(id);

    res.json({
      success: true,
      data: { message: 'Campaign deleted successfully' },
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadFrame(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<Campaign>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return next(new AppError(400, 'No frame image file uploaded'));
    }

    const campaign = await CampaignModel.findById(id);
    if (!campaign) {
      return next(new AppError(404, 'Campaign not found'));
    }

    // Validate 1080x1080 PNG + transparency
    validatePngFrame(file.buffer);

    // Delete old frame file if exists
    if (campaign.frameUrl) {
      await storageService.deleteFrame(campaign.frameUrl);
    }

    // Save new frame file
    const frameUrl = await storageService.saveFrame(campaign.id, file.originalname, file.buffer);

    campaign.frameUrl = frameUrl;
    await campaign.save();

    res.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        frameUrl: campaign.frameUrl,
        status: getEffectiveStatus(campaign),
        startAt: campaign.startAt ? campaign.startAt.toISOString() : null,
        endAt: campaign.endAt ? campaign.endAt.toISOString() : null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteFrame(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<Campaign>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await CampaignModel.findById(id);
    if (!campaign) {
      return next(new AppError(404, 'Campaign not found'));
    }

    if (campaign.frameUrl) {
      await storageService.deleteFrame(campaign.frameUrl);
      campaign.frameUrl = null;
      await campaign.save();
    }

    res.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        frameUrl: null,
        status: getEffectiveStatus(campaign),
        startAt: campaign.startAt ? campaign.startAt.toISOString() : null,
        endAt: campaign.endAt ? campaign.endAt.toISOString() : null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}
