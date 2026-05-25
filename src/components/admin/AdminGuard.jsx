import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminGuard() {
  const [state, setState] = useState('loading');

  useEffect(() => {
    api
      .me()
      .then(() => setState('ok'))
      .catch(() => setState('denied'));
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-body text-sm text-[#2d2020]/50">Loading…</p>
      </div>
    );
  }
  if (state === 'denied') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
