import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminGuard() {
  const { loading, isAdmin, configured } = useAdminAuth();

  if (!configured) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <p className="text-sm text-ink-muted text-center max-w-md">
          Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then rebuild.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-body text-sm text-ink-subtle">Loading…</p>
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
