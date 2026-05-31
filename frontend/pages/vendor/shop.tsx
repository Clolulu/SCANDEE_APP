import useSWR, { mutate as globalMutate } from 'swr';
import { FormEvent, useState, useEffect } from 'react';
import { api, parseApiError } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';
import { useAuth } from '../../lib/useAuth';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function VendorShopPage() {
  const { user } = useAuth();
  const { data: vendor, error, mutate } = useSWR(user ? '/store/vendor/me/' : null, fetcher);

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (vendor) {
      setShopName(vendor.shop_name || '');
      setDescription(vendor.description || '');
      setCategory(vendor.category || '');
      setPhoneNumber(vendor.phone_number || '');
      setAddress(vendor.address || '');
      setBusinessHours(vendor.business_hours || '');
      setLogoPreview(vendor.logo_image_url || null);
      setBannerPreview(vendor.banner_image_url || null);
    }
  }, [vendor]);

  useEffect(() => {
    if (!vendor?.business_hours) return;
    const parsed = parseBusinessHours(vendor.business_hours);
    if (parsed) {
      setOpeningTime(parsed.opening);
      setClosingTime(parsed.closing);
    } else {
      setOpeningTime('');
      setClosingTime('');
    }
  }, [vendor?.business_hours]);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!bannerFile) return;
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setMessage(null);

    if (openingTime && closingTime && closingTime <= openingTime) {
      setErrorMessage('Closing time must be later than opening time.');
      setSaving(false);
      return;
    }

    try {
      // Debug: log payload and file info
      console.debug('VendorShop.submit payload', {
        shopName,
        description,
        category,
        phoneNumber,
        address,
        businessHours: openingTime && closingTime ? `${openingTime}-${closingTime}` : businessHours,
        logoFileName: logoFile?.name || null,
        bannerFileName: bannerFile?.name || null,
      });
      const formData = new FormData();
      formData.append('shop_name', shopName);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('phone_number', phoneNumber);
      formData.append('address', address);
      formData.append('business_hours', openingTime && closingTime ? `${openingTime}-${closingTime}` : businessHours);

      if (logoFile) {
        formData.append('logo_image', logoFile);
      }
      if (bannerFile) {
        formData.append('banner_image', bannerFile);
      }

      const response = await api.patch('/store/vendor/me/', formData);
      console.debug('VendorShop.submit response', response.status, response.data);
      mutate(response.data, false);
      // Update public store cache keys so other pages reflect changes immediately
      try {
        const vendorProfileId = response.data.id;
        const vendorUserId = response.data.vendor_id || response.data.vendorId || response.data.user_id;
        if (vendorProfileId) {
          globalMutate(`/store/vendor/${vendorProfileId}/`, response.data, false);
        }
        if (vendorUserId) {
          globalMutate(`/store/vendor/${vendorUserId}/`, response.data, false);
        }
      } catch (e) {
        console.debug('VendorShop.mutate public cache failed', e);
      }
      setMessage('Shop profile updated successfully.');
    } catch (err) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  const parseTimeValue = (text: string) => {
    const normalized = text.trim().toUpperCase();
    const ampmMatch = normalized.match(/^([0-9]{1,2}:[0-9]{2})\s*(AM|PM)$/);
    if (ampmMatch) {
      const [, time, period] = ampmMatch;
      const [hour, minute] = time.split(':').map(Number);
      const hour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
      return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    const twentyFourMatch = normalized.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (twentyFourMatch) {
      const [, hour, minute] = twentyFourMatch;
      return `${hour.padStart(2, '0')}:${minute}`;
    }

    return null;
  };

  const parseBusinessHours = (value: string) => {
    const parts = value.split('-').map((part) => part.trim());
    if (parts.length !== 2) {
      return null;
    }

    const opening = parseTimeValue(parts[0]);
    const closing = parseTimeValue(parts[1]);
    if (!opening || !closing) {
      return null;
    }

    return { opening, closing };
  };

  const formatBusinessHours = (value: string) => {
    const parsed = parseBusinessHours(value);
    if (!parsed) {
      return value;
    }
    const [openHour, openMinute] = parsed.opening.split(':');
    const [closeHour, closeMinute] = parsed.closing.split(':');
    const openDate = new Date(1970, 0, 1, Number(openHour), Number(openMinute));
    const closeDate = new Date(1970, 0, 1, Number(closeHour), Number(closeMinute));
    return `${openDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${closeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Shop Profile">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Shop Profile</h2>
            <p className="mt-2 text-slate-600">Update your storefront branding, contact info, and business details.</p>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
            {message ? <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">{message}</div> : null}
            {errorMessage ? <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{errorMessage}</div> : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Shop name</span>
                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Category</span>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Phone number</span>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Address</span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                </label>

                <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Opening time</span>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Closing time</span>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="lg:col-span-2 text-sm text-slate-500">
                  {openingTime && closingTime ? (
                    <p>Saving schedule: {formatBusinessHours(`${openingTime}-${closingTime}`)}</p>
                  ) : businessHours ? (
                    <p>Current schedule: {formatBusinessHours(businessHours)}</p>
                  ) : (
                    <p>Use the time pickers to save your business hours.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-700">Banner image</p>
                  <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner preview" className="h-40 w-full rounded-3xl object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">No banner set</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                      className="mt-3 w-full text-sm text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">Logo image</p>
                  <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-28 w-28 rounded-3xl object-cover" />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">No logo</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="mt-3 w-full text-sm text-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Vendor profile updates are saved directly to your shop.</div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? 'Saving…' : 'Save shop profile'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
