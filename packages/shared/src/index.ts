// ─── Campaign ──────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'expired' | 'disabled';

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string;
  frameUrl: string | null;
  status: CampaignStatus;
  startAt: string | null; // ISO 8601
  endAt: string | null;   // ISO 8601
  createdAt: string;
  updatedAt: string;
}

/** Public-facing campaign (subset of Campaign) */
export interface PublicCampaign {
  id: string;
  name: string;
  slug: string;
  description: string;
  frameUrl: string;
  status: CampaignStatus;
  startAt: string | null;
  endAt: string | null;
}

export interface CreateCampaignDto {
  name: string;
  slug: string;
  description?: string;
  status?: CampaignStatus;
  startAt?: string | null;
  endAt?: string | null;
}

export interface UpdateCampaignDto {
  name?: string;
  slug?: string;
  description?: string;
  status?: CampaignStatus;
  startAt?: string | null;
  endAt?: string | null;
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export interface Admin {
  id: string;
  email: string;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  admin: Admin;
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export type AnalyticsEventType = 'campaign_view' | 'image_render' | 'image_download';

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  campaignId: string;
  sessionId: string;
  /** Epoch ms */
  timestamp: number;
  meta?: Record<string, string>;
}

export interface CampaignAnalyticsSummary {
  campaignId: string;
  views: number;
  renders: number;
  downloads: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalRenders: number;
  totalDownloads: number;
  byCampaign: Record<string, CampaignAnalyticsSummary>;
}

// ─── API Responses ─────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
