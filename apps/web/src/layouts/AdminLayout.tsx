import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/stores/AuthContext';

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface text-slate-100">
      {/* Top Bar Navigation */}
      {admin && (
        <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-surface-border px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-display font-extrabold text-white text-lg shadow-glow">
              A
            </div>
            <div>
              <span className="font-display font-bold text-slate-100 text-lg tracking-tight">
                Avatar<span className="text-brand-400">Frame</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{admin.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-ghost text-xs font-semibold hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
