import Link from 'next/link';
import useSWR from 'swr';
import { Layout } from '../components/Layout';
import { ProtectedPage } from '../components/ProtectedPage';
import { api } from '../lib/api';
import { useAuth } from '../lib/useAuth';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function OrderListPage() {
  const { loading } = useAuth();
  const { data, error } = useSWR(!loading ? '/store/orders/' : null, fetcher, {
    refreshInterval: 5000,
  });

  return (
    <ProtectedPage requiredRole="tourist">
      <Layout title="My Orders">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">My Orders</h2>
            <p className="mt-2 text-slate-600">Track orders, payment status, and pickup PINs for recent purchases.</p>
          </section>
          {error && (
            <div className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-sm">Unable to load your orders.</div>
          )}
          {!data && <div className="rounded-3xl bg-white p-6 shadow-sm">Loading order history…</div>}
          <div className="grid gap-4">
            {data?.map((order: any) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="rounded-3xl bg-white p-6 shadow-sm hover:border-sky-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Order #{order.id}</p>
                    <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">฿{Number(order.order_total).toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{order.payment_status.toUpperCase()}</p>
                    <p className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">
                      {order.order_status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {data?.length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-6 text-slate-600 shadow-sm">You have no orders yet. Browse vendors to place your first order.</div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
