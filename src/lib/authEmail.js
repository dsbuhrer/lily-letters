/**
 * Supabase Auth: treat accounts without email_confirmed_at as not fully activated.
 */
export function isEmailConfirmed(user) {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}
