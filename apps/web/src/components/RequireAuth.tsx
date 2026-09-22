import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/AuthContext.js';

export default function RequireAuth() {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-3">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
