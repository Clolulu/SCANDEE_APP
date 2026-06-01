import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Layout } from '../../../components/Layout';
import { ProtectedPage } from '../../../components/ProtectedPage';
import { useAuth } from '../../../lib/useAuth';
import { useEffect, useState } from 'react';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const OrderCard = ({ order, isHighlighted, actionLoading, pins, onUpdateStatus, onVerify, onPinChange }: any) => {
  return (
    <div
      key={order.id}
      id={`order-card-${order.id}`}
      className={`rounded-3xl bg-white p-4 shadow-sm transition ${isHighlighted ? 'ring-2 ring-sky-500 bg-sky-50' : ''}`}
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
      
      {/* Action buttons for current orders */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {order.order_status === 'PAID' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'start_preparing')}
            disabled={actionLoading === order.id}
            className="rounded-2xl bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {actionLoading === order.id ? 'Updating...' : 'Start Preparing'}
          </button>
        )}
        {order.order_status === 'PREPARING' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'ready_for_pickup')}
            disabled={actionLoading === order.id}
            className="rounded-2xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {actionLoading === order.id ? 'Updating...' : 'Ready for Pickup'}
          </button>
        )}
        {order.order_status === 'READY_FOR_PICKUP' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={pins[order.id] || ''}
              onChange={(e) => onPinChange(order.id, e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded border p-2"
            />
            <button
              onClick={() => onVerify(order.id)}
              disabled={actionLoading === order.id}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {actionLoading === order.id ? 'Verifying...' : 'Verify PIN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function VendorOrders() {
  const router = useRouter();
  const { loading } = useAuth();
  const { data: orders, mutate } = useSWR(!loading ? '/store/orders/' : null, fetcher, {
    refreshInterval: 5000,
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [pins, setPins] = useState<Record<number, string>>({});

  const updateOrderStatus = async (orderId: number, action: string) => {
    setActionLoading(orderId);
    try {
      await api.post(`/store/orders/${orderId}/${action}/`);
      mutate();
    } catch (err) {
      console.error(err);
      alert('Unable to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await api.post(`/store/orders/${orderId}/verify_pin/`, { pin_code: pins[orderId] || '' });
      setPins((current) => ({ ...current, [orderId]: '' }));
      mutate();
    } catch (err) {
      console.error(err);
      alert('Invalid PIN or unable to verify order');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePinChange = (orderId: number, value: string) => {
    setPins((current) => ({ ...current, [orderId]: value }));
  };

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

  // Filter only current orders
  const currentOrders = orders?.filter((order: any) => order.is_current) || [];

  // Sort by created_at (newest first)
  const sortedCurrentOrders = currentOrders.slice().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Vendor Orders">
        <div className="space-y-6">
          {/* Header */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Manage Orders</h2>
            <p className="mt-2 text-slate-600">View and manage customer orders in real-time</p>
          </section>

          {/* Navigation Tabs */}
          <section className="flex gap-2 border-b border-slate-200 bg-white rounded-t-3xl px-6 pt-6">
            <Link
              href="/vendor/orders"
              className="px-4 py-3 text-blue-600 font-medium border-b-2 border-blue-600 transition"
            >
              Active Orders
            </Link>
            <Link
              href="/vendor/orders/history"
              className="px-4 py-3 text-slate-600 hover:text-slate-900 font-medium border-b-2 border-transparent hover:border-slate-300 transition"
            >
              Order History
            </Link>
          </section>

          {!orders && <div className="rounded-3xl bg-white p-6 shadow-sm">Loading orders…</div>}

          {orders && (
            <>
              {sortedCurrentOrders.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-slate-600 shadow-sm">
                  <p>No active orders. All caught up!</p>
                  <Link href="/vendor/orders/history" className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium">
                    View order history →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCurrentOrders.map((order: any) => {
                    const isHighlighted = order.id === highlightedOrderId;
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isHighlighted={isHighlighted}
                        actionLoading={actionLoading}
                        pins={pins}
                        onUpdateStatus={updateOrderStatus}
                        onVerify={handleVerify}
                        onPinChange={handlePinChange}
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
