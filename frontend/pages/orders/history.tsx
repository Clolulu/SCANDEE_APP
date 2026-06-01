import Link from 'next/link';
import useSWR from 'swr';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function OrderHistoryPage() {
  const { loading } = useAuth();
  const { data, error } = useSWR(!loading ? '/store/orders/' : null, fetcher, {
    refreshInterval: 30000, // Refresh less frequently for history
  });

  // Filter only completed orders
  const completedOrders = data?.filter((order: any) => order.is_completed) || [];
  const sortedCompletedOrders = completedOrders.slice().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'COMPLETED') return 'bg-emerald-100 text-emerald-800';
    if (statusUpper === 'FAILED') return 'bg-rose-100 text-rose-800';
    if (statusUpper === 'CANCELLED') return 'bg-slate-100 text-slate-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <ProtectedPage requiredRole="tourist">
      <Layout title="Order History">
        <div className="space-y-6">
          {/* Header */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Order History</h2>
            <p className="mt-2 text-slate-600">Review your past orders and transaction records.</p>
          </section>

          {/* Navigation Tabs */}
          <section className="flex gap-2 border-b border-slate-200 bg-white rounded-t-3xl px-6 pt-6">
            <Link
              href="/orders"
              className="px-4 py-3 text-slate-600 hover:text-slate-900 font-medium border-b-2 border-transparent hover:border-slate-300 transition"
            >
              Active Orders
            </Link>
            <Link
              href="/orders/history"
              className="px-4 py-3 text-blue-600 font-medium border-b-2 border-blue-600 transition"
            >
              Order History
            </Link>
          </section>

          {error && (
            <div className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-sm">Unable to load your order history.</div>
          )}
          {!data && <div className="rounded-3xl bg-white p-6 shadow-sm">Loading order history…</div>}

          {/* Order History Section */}
          {data && (
            <>
              {sortedCompletedOrders.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-slate-600 shadow-sm">
                  <p>No completed orders yet.</p>
                  <Link href="/orders" className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium">
                    View active orders →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sortedCompletedOrders.map((order: any) => (
                    <Link key={order.id} href={`/orders/${order.id}`} className="rounded-3xl bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition opacity-85">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">Order #{order.id}</p>
                          <p className="text-sm text-slate-500">{order.vendor_name || 'Vendor'}</p>
                          <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                          {order.completed_at && (
                            <p className="text-xs text-emerald-600 mt-1">
                              Completed: {new Date(order.completed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">฿{Number(order.order_total).toFixed(2)}</p>
                          <p className="text-sm text-slate-500 mb-2">{order.payment_status.toUpperCase()}</p>
                          <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${getStatusColor(order.order_status)}`}>
                            {order.order_status.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedPage>
  );
}
