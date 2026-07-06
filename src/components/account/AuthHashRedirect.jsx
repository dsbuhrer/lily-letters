import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAuthCallbackHash } from '../../lib/authCallback';

const RESET_PATH = '/account/reset-password';

export default function AuthHashRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === RESET_PATH) return;
    if (!isAuthCallbackHash()) return;

    navigate(`${RESET_PATH}${location.hash}`, { replace: true });
  }, [location.pathname, location.hash, navigate]);

  return null;
}
