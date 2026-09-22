import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AnalyticsEventModel } from '../models/AnalyticsEvent.js';
import { CampaignModel } from '../models/Campaign.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse } from '@avatar-frame/shared';

const trackEventSchema = z.object({
  campaignId: z.string().min(1, 'campaignId is required'),
  event: z.enum(['campaign_view', 'image_render', 'image_download']),
  sessionId: z.string().min(1, 'sessionId is required'),
  timestamp: z.number().optional().default(() => Date.now()),
  meta: z.record(z.string()).optional(),
});

export async function trackEvent(
  req: Request,
  res: Response<ApiResponse<{ tracked: true }>>,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = trackEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(
        new AppError(400, 'Invalid analytics payload', parseResult.error.flatten().fieldErrors),
      );
    }

    const { campaignId, event, sessionId, timestamp, meta } = parseResult.data;

    // Check campaign exists
    const campaignExists = await CampaignModel.exists({ _id: campaignId });
    if (!campaignExists) {
      return next(new AppError(404, 'Campaign not found'));
    }

    await AnalyticsEventModel.create({
      campaignId,
      event,
      sessionId,
      timestamp: new Date(timestamp),
      meta: meta || {},
    });

    res.json({
      success: true,
      data: { tracked: true },
    });
  } catch (err) {
    next(err);
  }
}

export interface CampaignAnalyticsSummary {
  campaignId: string;
  views: number;
  renders: number;
  downloads: number;
}

export interface AnalyticsSummaryResponse {
  totalViews: number;
  totalRenders: number;
  totalDownloads: number;
  byCampaign: Record<string, CampaignAnalyticsSummary>;
}

export async function getAnalyticsSummary(
  _req: Request,
  res: Response<ApiResponse<AnalyticsSummaryResponse>>,
  next: NextFunction,
): Promise<void> {
  try {
    const pipeline = [
      {
        $group: {
          _id: { campaignId: '$campaignId', event: '$event' },
          count: { $sum: 1 },
        },
      },
    ];

    const results = (await AnalyticsEventModel.aggregate(pipeline)) as Array<{
      _id: { campaignId: unknown; event: 'campaign_view' | 'image_render' | 'image_download' };
      count: number;
    }>;

    let totalViews = 0;
    let totalRenders = 0;
    let totalDownloads = 0;
    const byCampaign: Record<string, CampaignAnalyticsSummary> = {};

    for (const item of results) {
      const cid = String(item._id.campaignId);
      if (!byCampaign[cid]) {
        byCampaign[cid] = { campaignId: cid, views: 0, renders: 0, downloads: 0 };
      }

      const summary = byCampaign[cid]!;
      if (item._id.event === 'campaign_view') {
        summary.views += item.count;
        totalViews += item.count;
      } else if (item._id.event === 'image_render') {
        summary.renders += item.count;
        totalRenders += item.count;
      } else if (item._id.event === 'image_download') {
        summary.downloads += item.count;
        totalDownloads += item.count;
      }
    }

    res.json({
      success: true,
      data: {
        totalViews,
        totalRenders,
        totalDownloads,
        byCampaign,
      },
    });
  } catch (err) {
    next(err);
  }
}
