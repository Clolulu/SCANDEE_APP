import useSWR from 'swr';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, parseApiError } from '../lib/api';
import { getAccessToken, getRefreshToken } from '../lib/auth';
import { Layout } from '../components/Layout';
import { ProtectedPage } from '../components/ProtectedPage';
import { useAuth } from '../lib/useAuth';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AccountPage() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const { data: account, error } = useSWR(user ? '/auth/account/' : null, fetcher);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (account) {
      setEmail(account.email || '');
      setFullName(account.full_name || '');
      setPhoneNumber(account.phone_number || '');
      setProfileImagePreview(account.profile_image_url || null);
    } else if (user) {
      setEmail(user.email || '');
      setFullName(user.full_name || '');
    }
  }, [account, user]);

  useEffect(() => {
    if (!profileImageFile) return;
    const url = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileImageFile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setFieldErrors({});
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('full_name', fullName);
      formData.append('phone_number', phoneNumber);

      if (profileImageFile) {
        formData.append('profile_image', profileImageFile);
      }

      const hasPasswordChange = !!(currentPassword || newPassword || confirmPassword);
      if (hasPasswordChange) {
        await api.post('/auth/account/change-password/', {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        });
      }

      const response = await api.patch('/auth/account/', formData);
      setMessage(hasPasswordChange
        ? 'Your profile and password have been updated successfully.'
        : 'Your profile has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (access && refresh) {
        login({ access, refresh, user: response.data });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      setFieldErrors(parsed.fields);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    try {
      await api.delete('/auth/account/');
      logout();
      router.push('/');
    } catch (err) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedPage requiredRole="tourist">
      <Layout title="My Account">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Account Settings</h2>
            <p className="mt-2 text-slate-600">Update your profile, password, or account information.</p>
          </section>

          {error && (
            <div className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-sm">Unable to load account details.</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
            {message ? <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">{message}</div> : null}
            {errorMessage ? <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{errorMessage}</div> : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {fieldErrors.email ? <p className="mt-2 text-sm text-rose-600">{fieldErrors.email}</p> : null}
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {fieldErrors.full_name ? <p className="mt-2 text-sm text-rose-600">{fieldErrors.full_name}</p> : null}
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Phone number</span>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {fieldErrors.phone_number ? <p className="mt-2 text-sm text-rose-600">{fieldErrors.phone_number}</p> : null}
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-700">Profile picture</span>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm text-slate-500">No image</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                      className="text-sm text-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Change password</h3>
              <p className="mt-2 text-sm text-slate-500">Provide your current password and choose a new one.</p>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {fieldErrors.current_password ? <p className="mt-2 text-sm text-rose-600">{fieldErrors.current_password}</p> : null}
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {fieldErrors.new_password ? <p className="mt-2 text-sm text-rose-600">{fieldErrors.new_password}</p> : null}
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {fieldErrors.confirm_password ? <p className="mt-2 text-sm text-rose-600">{fieldErrors.confirm_password}</p> : null}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
