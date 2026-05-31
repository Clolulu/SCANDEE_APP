import useSWR from 'swr';
import { api } from '../../../lib/api';
import { Layout } from '../../../components/Layout';
import { ProtectedPage } from '../../../components/ProtectedPage';
import { useAuth } from '../../../lib/useAuth';
import { useState } from 'react';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function VendorOrders() {
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

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Vendor Orders">
      <div className="space-y-6">
        {orders?.map((o: any) => (
          <div key={o.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">Order #{o.id}</p>
                <p className="text-sm text-slate-500">Customer: {o.tourist.full_name || o.tourist.email}</p>
                <p className="text-sm text-slate-500">Payment: {o.payment_status.toUpperCase()}</p>
                <p className="text-sm text-slate-500">Order: {o.order_status.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">฿{Number(o.order_total).toFixed(2)}</p>
                <p className="text-sm text-slate-500">{new Date(o.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {o.items.map((it: any) => (
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
                <p className="font-semibold">฿{Number(o.order_total).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-semibold">{o.order_status}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {o.order_status === 'PAID' && (
                <button
                  onClick={() => updateOrderStatus(o.id, 'start_preparing')}
                  disabled={actionLoading === o.id}
                  className="rounded-2xl bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {actionLoading === o.id ? 'Updating...' : 'Start Preparing'}
                </button>
              )}
              {o.order_status === 'PREPARING' && (
                <button
                  onClick={() => updateOrderStatus(o.id, 'ready_for_pickup')}
                  disabled={actionLoading === o.id}
                  className="rounded-2xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {actionLoading === o.id ? 'Updating...' : 'Ready for Pickup'}
                </button>
              )}
              {o.order_status === 'READY_FOR_PICKUP' && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={pins[o.id] || ''}
                    onChange={(e) => handlePinChange(o.id, e.target.value)}
                    placeholder="Enter PIN"
                    className="w-full rounded border p-2"
                  />
                  <button
                    onClick={() => handleVerify(o.id)}
                    disabled={actionLoading === o.id}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {actionLoading === o.id ? 'Verifying...' : 'Verify PIN'}
                  </button>
                </div>
              )}
              {o.order_status === 'COMPLETED' && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-800">
                  Order completed
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      </Layout>
    </ProtectedPage>
  );
}
