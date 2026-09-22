import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-4 animate-fade-in">
      <div className="text-center">
        <p className="text-brand-400 font-display font-bold text-7xl mb-4">404</p>
        <h1 className="text-2xl font-display font-bold text-slate-100 mb-2">Page not found</h1>
        <p className="text-slate-400 text-base max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/" className="btn-secondary">
        Go home
      </Link>
    </div>
  );
}
