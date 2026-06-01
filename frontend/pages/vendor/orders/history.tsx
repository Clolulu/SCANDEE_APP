import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Layout } from '../../../components/Layout';
import { ProtectedPage } from '../../../components/ProtectedPage';
import { useAuth } from '../../../lib/useAuth';
import { useEffect } from 'react';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const CompletedOrderCard = ({ order, isHighlighted }: any) => {
  return (
    <div
      key={order.id}
      id={`order-card-${order.id}`}
      className={`rounded-3xl bg-white p-4 shadow-sm transition ${isHighlighted ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">Order #{order.id}</p>
          <p className="text-sm text-slate-500">Customer: {order.tourist.full_name || order.tourist.email}</p>
          <p className="text-sm text-slate-500">Payment: {order.payment_status.toUpperCase()}</p>
          <p className="text-sm text-slate-500">Order: {order.order_status.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">฿{Number(order.order_total).toFixed(2)}</p>
          <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {order.items.map((it: any) => (
          <div key={it.id} className="flex items-center justify-between border rounded p-3">
            <div>
              <p className="font-semibold">{it.product.name}</p>
              <p className="text-sm text-slate-500">Qty: {it.quantity}</p>
            </div>
            <div className="font-semibold">฿{(it.product.price * it.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-sm text-slate-500">Order Total</p>
          <p className="font-semibold">฿{Number(order.order_total).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-sm text-slate-500">Status</p>
          <p className="font-semibold">{order.order_status}</p>
        </div>
      </div>

      {/* Completed order summary */}
      <div className="mt-3">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">Order Completed</p>
          </div>
          {order.completed_at && (
            <p className="text-sm text-emerald-700">
              Completed on {new Date(order.completed_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function VendorOrderHistory() {
  const router = useRouter();
  const { loading } = useAuth();
  const { data: orders } = useSWR(!loading ? '/store/orders/' : null, fetcher, {
    refreshInterval: 30000, // Refresh less frequently for history
  });

  const highlightedOrderId = Number(router.query.highlight || 0);

  useEffect(() => {
    if (!orders || !highlightedOrderId) {
      return;
    }
    const element = document.getElementById(`order-card-${highlightedOrderId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [orders, highlightedOrderId]);

  // Filter only completed orders
  const completedOrders = orders?.filter((order: any) => order.is_completed) || [];

  // Sort by created_at (newest first)
  const sortedCompletedOrders = completedOrders.slice().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Vendor Order History">
        <div className="space-y-6">
          {/* Header */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Order History</h2>
            <p className="mt-2 text-slate-600">Review completed, failed, and cancelled orders.</p>
          </section>

          {/* Navigation Tabs */}
          <section className="flex gap-2 border-b border-slate-200 bg-white rounded-t-3xl px-6 pt-6">
            <Link
              href="/vendor/orders"
              className="px-4 py-3 text-slate-600 hover:text-slate-900 font-medium border-b-2 border-transparent hover:border-slate-300 transition"
            >
              Active Orders
            </Link>
            <Link
              href="/vendor/orders/history"
              className="px-4 py-3 text-blue-600 font-medium border-b-2 border-blue-600 transition"
            >
              Order History
            </Link>
          </section>

          {!orders && <div className="rounded-3xl bg-white p-6 shadow-sm">Loading order history…</div>}

          {orders && (
            <>
              {sortedCompletedOrders.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-slate-600 shadow-sm">
                  <p>No completed orders yet.</p>
                  <Link href="/vendor/orders" className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium">
                    View active orders →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCompletedOrders.map((order: any) => {
                    const isHighlighted = order.id === highlightedOrderId;
                    return (
                      <CompletedOrderCard
                        key={order.id}
                        order={order}
                        isHighlighted={isHighlighted}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedPage>
  );
}
