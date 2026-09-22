import type { Request, Response, NextFunction } from 'express';
import { CampaignModel, getEffectiveStatus } from '../models/Campaign.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse, PublicCampaign } from '@avatar-frame/shared';

export async function getCampaignBySlug(
  req: Request<{ slug: string }>,
  res: Response<ApiResponse<PublicCampaign>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params;
    if (!slug) {
      return next(new AppError(400, 'Campaign slug is required'));
    }

    const campaign = await CampaignModel.findOne({ slug: slug.toLowerCase() });
    if (!campaign) {
      return next(new AppError(404, 'Campaign not found'));
    }

    const status = getEffectiveStatus(campaign);

    // Draft or disabled campaigns are not accessible publicly
    if (status === 'draft' || status === 'disabled') {
      return next(new AppError(404, 'Campaign is not currently available'));
    }

    res.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        frameUrl: campaign.frameUrl || '',
        status: status,
        startAt: campaign.startAt ? campaign.startAt.toISOString() : null,
        endAt: campaign.endAt ? campaign.endAt.toISOString() : null,
      },
    });
  } catch (err) {
    next(err);
  }
}
