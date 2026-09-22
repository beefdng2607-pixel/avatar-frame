import { Schema, model, type Document } from 'mongoose';
import type { AnalyticsEventType } from '@avatar-frame/shared';

export interface IAnalyticsEventDocument extends Document {
  campaignId: Schema.Types.ObjectId;
  event: AnalyticsEventType;
  sessionId: string;
  timestamp: Date;
  meta?: Record<string, string>;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    event: {
      type: String,
      enum: ['campaign_view', 'image_render', 'image_download'],
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    meta: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const AnalyticsEventModel = model<IAnalyticsEventDocument>(
  'AnalyticsEvent',
  analyticsEventSchema,
);
