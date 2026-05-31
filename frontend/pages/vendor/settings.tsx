import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import useSWR from 'swr';
import { api, parseApiError } from '../../lib/api';
import { getAccessToken, getRefreshToken } from '../../lib/auth';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';
import { useAuth } from '../../lib/useAuth';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const parseEmvTlv = (value: string): Record<string, string | Record<string, any>> => {
  const result: Record<string, string | Record<string, any>> = {};
  let i = 0;
  const normalized = value.replace(/\s+/g, '');

  while (i + 4 <= normalized.length) {
    const tag = normalized.slice(i, i + 2);
    const length = Number(normalized.slice(i + 2, i + 4));
    if (Number.isNaN(length) || i + 4 + length > normalized.length) {
      break;
    }
    const fieldValue = normalized.slice(i + 4, i + 4 + length);
    i += 4 + length;
    if (tag === '29' || tag === '26' || tag === '62') {
      result[tag] = parseEmvTlv(fieldValue);
    } else {
      result[tag] = fieldValue;
    }
  }

  return result;
};

const detectPromptPayType = (value: string): string => {
  const digits = value.replace(/\D+/g, '');
  if (!digits) {
    return 'UNKNOWN';
  }
  if ((digits.length === 10 && digits.startsWith('0')) || (digits.length === 11 && digits.startsWith('66')) || (digits.length === 12 && digits.startsWith('0066'))) {
    return 'PHONE';
  }
  if (digits.length === 13) {
    return 'NATIONAL_ID';
  }
  return 'MERCHANT_ID';
};

const extractPromptPayIdFromQr = (qrText: string) => {
  const tlv = parseEmvTlv(qrText);
  let promptpayId = '';
  if (typeof tlv['29'] === 'object') {
    const accountInfo = tlv['29'] as Record<string, any>;
    promptpayId = (accountInfo['01'] as string) || (accountInfo['02'] as string) || '';
  }
  if (!promptpayId) {
    promptpayId = (tlv['01'] as string) || (tlv['02'] as string) || (tlv['04'] as string) || '';
  }
  promptpayId = promptpayId.trim();
  return { promptpayId, promptpayType: detectPromptPayType(promptpayId) };
};

export default function VendorSettingsPage() {
  const { user, login } = useAuth();
  const { data: account } = useSWR(user ? '/auth/vendor/account/' : null, fetcher);
  const { data: vendor } = useSWR(user ? '/store/vendor/me/' : null, fetcher);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [promptpayId, setPromptpayId] = useState('');
  const [promptpayType, setPromptpayType] = useState('');
  const [promptpayQrImageUrl, setPromptpayQrImageUrl] = useState<string | null>(null);
  const [promptpayQrFile, setPromptpayQrFile] = useState<File | null>(null);
  const [payoutSchedule, setPayoutSchedule] = useState('HOURLY');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrUploadError, setQrUploadError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (account) {
      setEmail(account.email || '');
      setFullName(account.full_name || '');
      setPhoneNumber(account.phone_number || '');
    } else if (user) {
      setEmail(user.email || '');
      setFullName(user.full_name || '');
    }
  }, [account, user]);

  useEffect(() => {
    if (vendor) {
      setPromptpayId(vendor.promptpay_id || '');
      setPromptpayType(vendor.promptpay_type || '');
      setPromptpayQrImageUrl(vendor.promptpay_qr_image_url || null);
      setPayoutSchedule(vendor.payout_schedule || 'HOURLY');
    }
  }, [vendor]);

  useEffect(() => {
    if (promptpayId) {
      setPromptpayType(detectPromptPayType(promptpayId));
    } else {
      setPromptpayType('');
    }
  }, [promptpayId]);

  const handleQrFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setQrUploadError(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setScanning(true);
    setPromptpayQrFile(file);
    setPromptpayQrImageUrl(URL.createObjectURL(file));

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const elementId = `promptpay-qr-reader-${Date.now()}`;
      const tempElement = document.createElement('div');
      tempElement.id = elementId;
      tempElement.style.position = 'fixed';
      tempElement.style.left = '-9999px';
      tempElement.style.top = '-9999px';
      document.body.appendChild(tempElement);
      const html5Qrcode = new Html5Qrcode(elementId);

      try {
        const result = await html5Qrcode.scanFileV2(file, true);
        const scannedText = result?.decodedText || result?.result?.text || '';
        if (!scannedText) {
          throw new Error('Unable to decode QR code.');
        }
        const { promptpayId: decodedId, promptpayType: decodedType } = extractPromptPayIdFromQr(scannedText);
        if (!decodedId) {
          throw new Error('Uploaded image does not contain a valid PromptPay QR code.');
        }
        setPromptpayId(decodedId);
        setPromptpayType(decodedType);
        setMessage('PromptPay QR code scanned successfully.');
      } finally {
        await html5Qrcode.clear();
        document.body.removeChild(tempElement);
      }
    } catch (err) {
      console.error('QR scan failed', err);
      setQrUploadError('Failed to decode the PromptPay QR code. Please try another image.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('full_name', fullName);
      formData.append('phone_number', phoneNumber);
      formData.append('promptpay_id', promptpayId);
      formData.append('promptpay_type', promptpayType);
      formData.append('payout_schedule', payoutSchedule);

      if (promptpayQrFile) {
        formData.append('promptpay_qr_image', promptpayQrFile);
      }

      if (newPassword || confirmPassword || currentPassword) {
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
        formData.append('confirm_password', confirmPassword);
      }

      const response = await api.patch('/auth/vendor/account/', formData);
      setMessage('Account settings updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (access && refresh) {
        login({ access, refresh, user: response.data });
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Account Settings">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Account Settings</h2>
            <p className="mt-2 text-slate-600">Manage your vendor account information and set your PromptPay payout details.</p>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
            {message ? <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">{message}</div> : null}
            {errorMessage ? <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{errorMessage}</div> : null}
            {qrUploadError ? <div className="rounded-3xl bg-amber-50 p-4 text-amber-700">{qrUploadError}</div> : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
              </label>

              <label className="block lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">Phone number</span>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">PromptPay payout</h3>
                  <p className="mt-2 text-sm text-slate-500">Upload your PromptPay QR code and we'll extract the payout ID automatically.</p>
                </div>
                <p className="text-sm text-slate-500">PromptPay is now the only payout method supported for vendors.</p>
              </div>

              {vendor ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Available balance</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">฿{vendor.available_balance ? Number(vendor.available_balance).toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Pending balance</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">฿{vendor.pending_balance ? Number(vendor.pending_balance).toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Last payout</p>
                    <p className="mt-2 text-base font-medium text-slate-900">{vendor.last_payout_at ? new Date(vendor.last_payout_at).toLocaleString() : 'Not paid yet'}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <label className="block lg:col-span-2">
                  <span className="text-sm font-medium text-slate-700">PromptPay QR code image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>

                {promptpayQrImageUrl ? (
                  <div className="lg:col-span-2 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Preview</p>
                    <img src={promptpayQrImageUrl} alt="PromptPay QR preview" className="mt-3 max-h-56 w-full rounded-3xl object-contain border border-slate-200" />
                  </div>
                ) : null}

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">PromptPay ID</span>
                  <input
                    value={promptpayId}
                    onChange={(e) => setPromptpayId(e.target.value)}
                    placeholder="Enter PromptPay ID or scan QR image"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Detected PromptPay type</span>
                  <input
                    readOnly
                    value={promptpayType || 'UNKNOWN'}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700"
                  />
                </label>
              </div>
            </section>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Change password</h3>
              <p className="mt-2 text-sm text-slate-500">Enter your current password and a new password to update.</p>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Your vendor account email is used for login and notifications.</div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? 'Saving…' : 'Save account settings'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
