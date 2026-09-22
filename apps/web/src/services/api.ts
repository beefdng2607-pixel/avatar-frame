import type {
  Admin,
  ApiResponse,
  AuthResponse,
  Campaign,
  CampaignStatus,
  CreateCampaignDto,
  PaginatedResponse,
  PublicCampaign,
  UpdateCampaignDto,
  AnalyticsSummary,
  AnalyticsEvent,
} from '@avatar-frame/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensure HttpOnly cookies are sent
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new Error(json.error || 'An unexpected error occurred');
  }

  return json.data;
}

// ─── Auth Services ───────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutApi(): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function getMeApi(): Promise<{ admin: Admin }> {
  return request<{ admin: Admin }>('/api/auth/me');
}

// ─── Admin Campaign Services ─────────────────────────────────────────────────

export async function listCampaignsApi(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CampaignStatus;
}): Promise<PaginatedResponse<Campaign>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  return request<PaginatedResponse<Campaign>>(`/api/admin/campaigns${qs ? `?${qs}` : ''}`);
}

export async function getCampaignApi(id: string): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}`);
}

export async function createCampaignApi(data: CreateCampaignDto): Promise<Campaign> {
  return request<Campaign>('/api/admin/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCampaignApi(
  id: string,
  data: UpdateCampaignDto,
): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCampaignApi(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/campaigns/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadFrameApi(id: string, file: File): Promise<Campaign> {
  const formData = new FormData();
  formData.append('frame', file);

  return request<Campaign>(`/api/admin/campaigns/${id}/frame`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteFrameApi(id: string): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}/frame`, {
    method: 'DELETE',
  });
}

// ─── Analytics Services ──────────────────────────────────────────────────────

export async function getAnalyticsSummaryApi(): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>('/api/admin/analytics/summary');
}

export async function trackAnalyticsApi(event: AnalyticsEvent): Promise<{ tracked: true }> {
  return request<{ tracked: true }>('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

// ─── Public Campaign Service ─────────────────────────────────────────────────

export async function getPublicCampaignApi(slug: string): Promise<PublicCampaign> {
  return request<PublicCampaign>(`/api/campaigns/${slug}`);
}
