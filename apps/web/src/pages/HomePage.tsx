import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Campaign } from '@avatar-frame/shared';
import { listCampaignsApi } from '@/services/api';

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCampaigns = async () => {
      try {
        setLoading(true);
        const res = await listCampaignsApi({ page: 1, pageSize: 6, status: 'active' });
        setCampaigns(res.items);
      } catch {
        // Ignore silent error
      } finally {
        setLoading(false);
      }
    };

    void fetchActiveCampaigns();
  }, []);

  return (
    <div className="min-h-dvh bg-surface text-slate-100 flex flex-col justify-between py-10 px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-8">
        {/* Branding */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Avatar Frame Campaign Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-slate-100 max-w-2xl">
          Create & Host Custom <span className="text-gradient">Avatar Frame</span> Campaigns
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-xl">
          Empower organizations to run transparent PNG avatar-frame campaigns with 100% client-side photo processing and mobile-first touch controls.
        </p>

        {/* Quick Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md justify-center">
          <Link to="/admin" className="btn-primary py-3.5 px-8 text-base shadow-glow hover:shadow-glow-lg">
            🔑 Admin Portal
          </Link>
        </div>

        {/* Active Campaigns List Preview */}
        <div className="w-full max-w-2xl pt-8 border-t border-surface-border/60">
          <h2 className="text-xs uppercase font-semibold text-slate-400 tracking-widest mb-4">
            Active Public Campaigns
          </h2>

          {loading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="card p-6 border-surface-border text-center">
              <p className="text-sm text-slate-300 font-semibold mb-1">No active public campaigns yet</p>
              <p className="text-xs text-slate-400 mb-4">Log in to the Admin Portal to create and publish your first campaign frame.</p>
              <Link to="/admin" className="btn-secondary btn-sm inline-flex">
                Go to Admin Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {campaigns.map((c) => (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="card p-4 border-surface-border hover:border-brand-500 transition-all flex items-center gap-3 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface border border-surface-border overflow-hidden shrink-0 flex items-center justify-center bg-slate-900">
                    {c.frameUrl ? (
                      <img src={c.frameUrl} alt={c.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl">🖼️</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-slate-100 text-sm truncate group-hover:text-brand-400 transition-colors">
                      {c.name}
                    </p>
                    <p className="text-xs font-mono text-slate-400 truncate">/c/{c.slug}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 pt-6">
        © 2026 Avatar Frame Campaign Platform • 100% Client-Side Privacy Guaranteed
      </footer>
    </div>
  );
}
