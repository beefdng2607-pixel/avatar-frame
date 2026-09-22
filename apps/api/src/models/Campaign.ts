import { Schema, model, type Document } from 'mongoose';
import type { CampaignStatus } from '@avatar-frame/shared';

export interface ICampaignDocument extends Document {
  name: string;
  slug: string;
  description: string;
  frameUrl: string | null;
  status: CampaignStatus;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaignDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    frameUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'disabled'],
      default: 'draft',
      index: true,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

/**
 * Computes effective status based on endAt expiration date.
 */
export function getEffectiveStatus(campaign: {
  status: CampaignStatus;
  endAt?: Date | null;
}): CampaignStatus {
  if (campaign.status === 'active' && campaign.endAt && new Date() > campaign.endAt) {
    return 'expired';
  }
  return campaign.status;
}

export const CampaignModel = model<ICampaignDocument>('Campaign', campaignSchema);
