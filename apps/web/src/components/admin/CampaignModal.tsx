import { useState, useEffect, type FormEvent } from 'react';
import type { Campaign, CampaignStatus, CreateCampaignDto, UpdateCampaignDto } from '@avatar-frame/shared';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCampaignDto | UpdateCampaignDto) => Promise<void>;
  campaign?: Campaign | null;
}

export default function CampaignModal({
  isOpen,
  onClose,
  onSubmit,
  campaign,
}: CampaignModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('active');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(campaign);

  // Auto slugify function
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setSlug(campaign.slug);
      setDescription(campaign.description || '');
      setStatus(campaign.status);
      setStartAt(campaign.startAt ? campaign.startAt.slice(0, 10) : '');
      setEndAt(campaign.endAt ? campaign.endAt.slice(0, 10) : '');
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setStatus('active');
      setStartAt('');
      setEndAt('');
    }
    setError(null);
  }, [campaign, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  const parseStartDate = (val: string): string | null => {
    if (!val || val.trim() === '') return null;
    const d = new Date(`${val}T00:00:00.000Z`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const parseEndDate = (val: string): string | null => {
    if (!val || val.trim() === '') return null;
    const d = new Date(`${val}T23:59:59.999Z`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a campaign name');
      return;
    }

    if (!slug.trim()) {
      setError('Please enter a campaign URL slug');
      return;
    }

    setLoading(true);

    try {
      const payload: CreateCampaignDto = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        status,
        startAt: parseStartDate(startAt),
        endAt: parseEndDate(endAt),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-lg w-full max-h-[90dvh] overflow-y-auto bg-surface-card border-surface-border shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-border">
          <h2 className="text-xl font-display font-bold text-slate-100">
            {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label" htmlFor="camp-name">
              Campaign Name *
            </label>
            <input
              id="camp-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Summer Festival 2026"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="camp-slug">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="bg-surface border border-r-0 border-surface-border rounded-l-xl px-3 py-3 text-slate-400 text-xs sm:text-sm select-none">
                /c/
              </span>
              <input
                id="camp-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="summer-festival-2026"
                className="input rounded-l-none font-mono text-sm"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Public campaign URL: <span className="font-mono text-brand-400">{window.location.origin}/c/{slug || 'slug'}</span>
            </p>
          </div>

          <div>
            <label className="label" htmlFor="camp-desc">
              Description
            </label>
            <textarea
              id="camp-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for campaign participants..."
              className="input py-2.5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="camp-status">
                Status
              </label>
              <select
                id="camp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="input cursor-pointer"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label !mb-0" htmlFor="camp-start">
                  Start Date
                </label>
                {startAt && (
                  <button
                    type="button"
                    onClick={() => setStartAt('')}
                    className="text-[10px] text-slate-400 hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                id="camp-start"
                type="date"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="input text-xs sm:text-sm cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label !mb-0" htmlFor="camp-end">
                  End Date
                </label>
                {endAt && (
                  <button
                    type="button"
                    onClick={() => setEndAt('')}
                    className="text-[10px] text-slate-400 hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                id="camp-end"
                type="date"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="input text-xs sm:text-sm cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
