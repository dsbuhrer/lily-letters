import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUiFeedback } from '../../context/UiFeedbackContext';

export default function AccountSettingsPage() {
  const { profile, user, updateProfile, resetPassword } = useAuth();
  const { toast } = useUiFeedback();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setMarketingConsent(profile.marketing_consent || false);
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        marketing_consent: marketingConsent,
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(err.message || 'Could not send reset email');
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white border border-taupe/30 p-6">
        <h2 className="font-display text-xl text-wine mb-6">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Email</span>
            <input
              type="email"
              className="input-field mt-1 bg-[#f8f5ef] cursor-not-allowed"
              value={user?.email || ''}
              disabled
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">First name</span>
              <input
                type="text"
                className="input-field mt-1"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Last name</span>
              <input
                type="text"
                className="input-field mt-1"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Phone</span>
            <input
              type="tel"
              className="input-field mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 accent-wine"
            />
            <span className="font-body text-sm text-[#2d2020]/70">
              Send me wedding tips, new templates, and exclusive offers
            </span>
          </label>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="bg-white border border-taupe/30 p-6">
        <h2 className="font-display text-xl text-wine mb-2">Password</h2>
        <p className="font-body text-sm text-[#2d2020]/60 mb-4">
          We&apos;ll email you a link to choose a new password.
        </p>
        <button type="button" onClick={handlePasswordReset} className="btn-secondary">
          Send password reset email
        </button>
      </section>
    </div>
  );
}
