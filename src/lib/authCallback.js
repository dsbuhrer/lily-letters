/**
 * Parse Supabase auth callback params from URL hash (implicit flow) or query string.
 */
export function parseAuthCallbackParams() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const params = Object.fromEntries(new URLSearchParams(hash));
    if (Object.keys(params).length > 0) return params;
  }

  const search = window.location.search.slice(1);
  if (search) {
    const params = Object.fromEntries(new URLSearchParams(search));
    if (params.error || params.error_code) return params;
  }

  return null;
}

export function clearAuthCallbackParams() {
  const url = new URL(window.location.href);
  if (!url.hash && !url.searchParams.has('error')) return;
  url.hash = '';
  if (url.searchParams.has('error') || url.searchParams.has('error_code')) {
    url.search = '';
  }
  window.history.replaceState(window.history.state, '', url.pathname + url.search);
}

export function getAuthCallbackErrorMessage(params) {
  if (!params?.error) return null;

  const code = params.error_code;
  if (code === 'otp_expired') {
    return 'This password reset link has expired. Request a new one below.';
  }
  if (code === 'otp_disabled') {
    return 'Password recovery is currently unavailable. Please contact support.';
  }

  if (params.error_description) {
    try {
      return decodeURIComponent(params.error_description.replace(/\+/g, ' '));
    } catch {
      return params.error_description;
    }
  }

  return 'This link is invalid or has expired. Request a new password reset email.';
}

export function isAuthCallbackHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  return (
    params.has('error') ||
    params.has('access_token') ||
    params.get('type') === 'recovery'
  );
}
