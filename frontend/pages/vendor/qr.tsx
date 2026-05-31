import useSWR from 'swr';
import { useAuth } from '../../lib/useAuth';
import { api } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';
import { useRouter } from 'next/router';
import { useState } from 'react';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function VendorQR() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useSWR(user ? '/store/vendor/me/' : null, fetcher);
  const [copied, setCopied] = useState(false);

  const storeUrl = profile
    ? typeof window !== 'undefined'
      ? new URL(profile.qr_code || `/store/${profile.id}`, window.location.origin).toString()
      : ''
    : '';
  const qrUrl = profile ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(storeUrl)}` : '';

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(storeUrl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenStore = () => {
    if (profile?.id) {
      router.push(`/store/${profile.id}`);
    }
  };

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Vendor QR">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Your Store QR Code</h2>
            <p className="mt-2 text-slate-600">Share this QR code or link with customers so they can access your shop.</p>
          </section>

          {profile && (
            <section className="rounded-3xl bg-sky-50 p-6 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-slate-900">QR Code Image</h3>
                  <p className="mt-2 text-sm text-slate-600">Scan this code to open your store:</p>
                  <div className="mt-4 rounded-2xl bg-white p-4 inline-block">
                    {qrUrl && <img src={qrUrl} alt="Store QR Code" className="rounded" />}
                  </div>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrUrl;
                      link.download = `store-${profile.id}-qr.png`;
                      link.click();
                    }}
                    className="mt-4 rounded-2xl bg-slate-200 px-4 py-2 text-sm text-slate-900 hover:bg-slate-300"
                  >
                    Download QR Code
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Store Link</h3>
                  <p className="mt-2 text-sm text-slate-600">Share this link with customers:</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white border border-sky-200 p-3">
                      <p className="text-xs text-slate-500 mb-1">Store URL:</p>
                      <p className="text-sm font-mono text-slate-900 break-all">{storeUrl}</p>
                    </div>
                    <button
                      onClick={handleCopyUrl}
                      className="w-full rounded-2xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
                    >
                      {copied ? '✓ Link Copied' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleOpenStore}
                      className="w-full rounded-2xl border border-sky-600 px-4 py-2 text-sky-600 hover:bg-sky-50"
                    >
                      Preview Store
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl bg-slate-50 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">How to Share Your QR Code</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• <strong>Print:</strong> Download and print the QR code to display at your shop</li>
              <li>• <strong>Digital:</strong> Share the QR code image on social media or WhatsApp</li>
              <li>• <strong>Link:</strong> Share the store link directly with customers</li>
              <li>• <strong>Signs:</strong> Post the QR code where customers can easily scan it</li>
            </ul>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Store Information</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Shop Name</p>
                <p className="font-semibold text-slate-900">{profile?.shop_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Shop ID</p>
                <p className="font-semibold text-slate-900">{profile?.id}</p>
              </div>
              <div>
                <p className="text-slate-500">Phone</p>
                <p className="font-semibold text-slate-900">{profile?.phone || 'Not set'}</p>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </ProtectedPage>
  );
}

