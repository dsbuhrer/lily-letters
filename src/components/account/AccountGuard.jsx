import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AccountGuard() {
  const { user, emailConfirmed, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <p className="font-body text-sm text-[#2d2020]/60 text-center max-w-md">
          Customer accounts are not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to
          your environment.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-body text-sm text-[#2d2020]/50">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/account/login" state={{ from: location.pathname }} replace />;
  }

  if (!emailConfirmed) {
    return <Navigate to="/account/confirm-email" replace />;
  }

  return <Outlet />;
}
