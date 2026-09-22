import { useState, useEffect, useCallback } from 'react';
import type { Campaign, CampaignStatus, AnalyticsSummary, CreateCampaignDto } from '@avatar-frame/shared';
import {
  listCampaignsApi,
  createCampaignApi,
  updateCampaignApi,
  deleteCampaignApi,
  getAnalyticsSummaryApi,
} from '@/services/api';
import CampaignModal from '@/components/admin/CampaignModal';
import FrameUploaderModal from '@/components/admin/FrameUploaderModal';
import QrCodeModal from '@/components/admin/QrCodeModal';

export default function AdminDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [frameCampaign, setFrameCampaign] = useState<Campaign | null>(null);
  const [qrCampaign, setQrCampaign] = useState<Campaign | null>(null);

  // Toast alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params: Parameters<typeof listCampaignsApi>[0] = {
        page,
        pageSize,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await listCampaignsApi(params);
      setCampaigns(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const summary = await getAnalyticsSummaryApi();
      setAnalytics(summary);
    } catch {
      // Non-critical, ignore silent error
    }
  }, []);

  useEffect(() => {
    void fetchCampaigns();
    void fetchAnalytics();
  }, [fetchCampaigns, fetchAnalytics]);

  const handleCreateOrUpdate = async (data: Partial<Campaign>) => {
    if (editingCampaign) {
      await updateCampaignApi(editingCampaign.id, data);
      showToast('Campaign updated successfully');
    } else {
      await createCampaignApi(data as CreateCampaignDto);
      showToast('Campaign created successfully');
    }
    void fetchCampaigns();
    void fetchAnalytics();
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to delete campaign "${campaign.name}"?`)) return;

    try {
      await deleteCampaignApi(campaign.id);
      showToast('Campaign deleted successfully');
      void fetchCampaigns();
      void fetchAnalytics();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to delete campaign', 'error');
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus: CampaignStatus = campaign.status === 'active' ? 'disabled' : 'active';
    try {
      await updateCampaignApi(campaign.id, { status: newStatus });
      showToast(`Campaign status changed to ${newStatus}`);
      void fetchCampaigns();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to update status', 'error');
    }
  };

  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Campaign link copied to clipboard!');
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 border animate-slide-up ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-100 tracking-tight">
            Campaign Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage avatar frames, publish campaigns, and view engagement metrics.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCampaign(null);
            setIsCreateOpen(true);
          }}
          className="btn-primary shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-2 py-3 px-5 text-sm sm:text-base shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Analytics Summary Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-surface-border bg-surface-card/80 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Campaigns</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-bold text-slate-100">{total}</span>
            <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">All time</span>
          </div>
        </div>

        <div className="card p-5 border-surface-border bg-surface-card/80 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Campaigns</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-bold text-emerald-400">{activeCount}</span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Live</span>
          </div>
        </div>

        <div className="card p-5 border-surface-border bg-surface-card/80 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Renders</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-bold text-blue-400">{analytics?.totalRenders || 0}</span>
            <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Client-side</span>
          </div>
        </div>

        <div className="card p-5 border-surface-border bg-surface-card/80 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Downloads</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-bold text-indigo-400">{analytics?.totalDownloads || 0}</span>
            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">PNG 1080p</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 border-surface-border bg-surface-card flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search campaigns by name or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10 py-2.5 text-sm"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {(['', 'active', 'draft', 'expired', 'disabled'] as const).map((st) => {
            const label = st === '' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1);
            const isSelected = statusFilter === st;

            return (
              <button
                key={st || 'all'}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'bg-surface text-slate-400 hover:text-slate-200 border border-surface-border'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campaigns Table Card */}
      <div className="card p-0 border-surface-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/60 border-b border-surface-border text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Frame / Campaign</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Engagement</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 skeleton rounded-xl" />
                        <div className="space-y-2">
                          <div className="h-4 w-36 skeleton rounded" />
                          <div className="h-3 w-24 skeleton rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-6 w-16 skeleton rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 skeleton rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 skeleton rounded" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-8 w-28 skeleton rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-base font-semibold text-slate-300">No campaigns found</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {search || statusFilter
                          ? 'Try adjusting your search query or status filter.'
                          : 'Get started by creating your first avatar frame campaign.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => {
                  const campStats = analytics?.byCampaign[camp.id];

                  return (
                    <tr key={camp.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Campaign Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <button
                            onClick={() => setFrameCampaign(camp)}
                            className="relative group w-12 h-12 rounded-xl bg-surface border border-surface-border overflow-hidden shrink-0 flex items-center justify-center hover:border-brand-500 transition-colors"
                            title="Click to manage PNG frame"
                          >
                            {camp.frameUrl ? (
                              <img
                                src={camp.frameUrl}
                                alt={camp.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <svg className="w-6 h-6 text-slate-500 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>

                          <div>
                            <p className="font-semibold text-slate-100 hover:text-brand-400 transition-colors cursor-pointer" onClick={() => { setEditingCampaign(camp); setIsCreateOpen(true); }}>
                              {camp.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>/c/{camp.slug}</span>
                              <button
                                onClick={() => handleCopyLink(camp.slug)}
                                className="hover:text-brand-300 transition-colors"
                                title="Copy public link"
                              >
                                📋
                              </button>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span className={`badge badge-${camp.status}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {camp.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Metrics */}
                      <td className="py-4 px-4 text-xs font-mono text-slate-300">
                        <div>Renders: <span className="text-blue-400 font-bold">{campStats?.renders || 0}</span></div>
                        <div>Downloads: <span className="text-indigo-400 font-bold">{campStats?.downloads || 0}</span></div>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {camp.startAt ? new Date(camp.startAt).toLocaleDateString() : 'Immediate'}
                        {' → '}
                        {camp.endAt ? new Date(camp.endAt).toLocaleDateString() : 'Never'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setFrameCampaign(camp)}
                            className="btn-ghost btn-sm px-2.5 py-1.5 text-xs text-slate-300 hover:text-brand-400"
                            title="Manage Campaign Frame"
                          >
                            🖼️ Frame
                          </button>

                          <button
                            onClick={() => setQrCampaign(camp)}
                            className="btn-ghost btn-sm px-2.5 py-1.5 text-xs text-slate-300 hover:text-brand-400"
                            title="Generate QR Code"
                          >
                            📱 QR
                          </button>

                          <button
                            onClick={() => {
                              setEditingCampaign(camp);
                              setIsCreateOpen(true);
                            }}
                            className="btn-ghost btn-sm px-2.5 py-1.5 text-xs text-slate-300 hover:text-brand-400"
                            title="Edit Campaign Details"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            onClick={() => handleToggleStatus(camp)}
                            className={`btn-ghost btn-sm px-2.5 py-1.5 text-xs ${
                              camp.status === 'active' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                            title={camp.status === 'active' ? 'Disable Campaign' : 'Activate Campaign'}
                          >
                            {camp.status === 'active' ? '⏸️ Pause' : '▶️ Publish'}
                          </button>

                          <button
                            onClick={() => handleDelete(camp)}
                            className="btn-ghost btn-sm px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete Campaign"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-surface/40 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalPages}</span> ({total} items)
            </div>

            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary btn-sm px-3 py-1 text-xs"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn-secondary btn-sm px-3 py-1 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateOrUpdate}
        campaign={editingCampaign}
      />

      <FrameUploaderModal
        isOpen={Boolean(frameCampaign)}
        onClose={() => setFrameCampaign(null)}
        campaign={frameCampaign}
        onSuccess={() => {
          showToast('Frame updated successfully');
          void fetchCampaigns();
        }}
      />

      <QrCodeModal
        isOpen={Boolean(qrCampaign)}
        onClose={() => setQrCampaign(null)}
        campaign={qrCampaign}
      />
    </div>
  );
}
