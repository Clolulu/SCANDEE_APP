import Link from 'next/link';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api, parseApiError } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function VendorDashboard() {
  const { data: vendor, error } = useSWR('/store/vendor/me/', fetcher);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Vendor Dashboard">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Vendor Dashboard</h2>
            <p className="mt-3 text-slate-600">Manage products, view orders, and share your store link.</p>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Available balance</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">฿{vendor ? Number(vendor.available_balance || 0).toFixed(2) : '0.00'}</p>
              <p className="mt-2 text-sm text-slate-500">Funds ready to be paid out based on your payout schedule.</p>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Pending payout</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">฿{vendor ? Number(vendor.pending_balance || 0).toFixed(2) : '0.00'}</p>
              <p className="mt-2 text-sm text-slate-500">Orders completed but still waiting for scheduled payout execution.</p>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Lifetime earnings</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">฿{vendor ? Number(vendor.lifetime_earnings || 0).toFixed(2) : '0.00'}</p>
              <p className="mt-2 text-sm text-slate-500">Total revenue processed through your vendor account.</p>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Next payout</h3>
              <p className="mt-2 text-lg font-semibold text-slate-900">{vendor ? vendor.payout_schedule?.toLowerCase() : 'hourly'}</p>
              <p className="mt-2 text-sm text-slate-500">
                {vendor?.next_payout_at
                  ? `Next payout scheduled at ${new Date(vendor.next_payout_at).toLocaleString()}`
                  : 'Your automated payout schedule.'}
              </p>
            </article>
          </section>
          {message ? (
            <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">{message}</div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{errorMessage}</div>
          ) : null}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Instant payout</h3>
                <p className="mt-2 text-sm text-slate-500">Run a simulated vendor payout immediately.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const url = '/store/payouts/execute_now/';
                  const body = {};
                  console.debug('POST', url, { body });
                  setErrorMessage(null);
                  setMessage(null);
                  setExecuting(true);
                  try {
                    const res = await api.post(url, body);
                    console.debug('Payout execute response', res.status, res.data);
                    setMessage('Payout executed successfully. Your available balance was cleared.');
                    mutate('/store/vendor/me/');
                    mutate('/store/payouts/');
                  } catch (err) {
                    const parsed = parseApiError(err);
                    console.error('Payout execute failed', parsed, err);
                    setErrorMessage(parsed.message || 'Unable to execute payout.');
                  } finally {
                    setExecuting(false);
                  }
                }}
                disabled={executing || !vendor || Number(vendor.available_balance || 0) <= 0}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {executing ? 'Executing…' : 'Execute payout now'}
              </button>
            </div>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Product management</h3>
              <p className="mt-2 text-slate-500">Add, edit, and remove items in your shop.</p>
              <Link href="/vendor/products" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">Manage products</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Order management</h3>
              <p className="mt-2 text-slate-500">Review incoming orders and verify pickup PINs.</p>
              <Link href="/vendor/orders" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">View orders</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">QR code</h3>
              <p className="mt-2 text-slate-500">Share your store link directly with customers.</p>
              <Link href="/vendor/qr" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">View QR link</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Shop profile</h3>
              <p className="mt-2 text-slate-500">Update your storefront presentation and business details.</p>
              <Link href="/vendor/shop" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">Edit shop profile</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Account settings</h3>
              <p className="mt-2 text-slate-500">Change your login email, contact details, or password.</p>
              <Link href="/vendor/settings" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">Update account</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Payout history</h3>
              <p className="mt-2 text-slate-500">See your recorded payouts and payout schedule.</p>
              <Link href="/vendor/payouts" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">View payouts</Link>
            </article>
          </section>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
