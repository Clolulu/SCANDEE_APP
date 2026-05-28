import useSWR from 'swr';
import { api } from '../../../lib/api';
import { Layout } from '../../../components/Layout';
import { ProtectedPage } from '../../../components/ProtectedPage';
import { useAuth } from '../../../lib/useAuth';
import { useState } from 'react';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function VendorOrders() {
  const { loading } = useAuth();
  const { data: orders, mutate } = useSWR(!loading ? '/store/orders/' : null, fetcher);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [pins, setPins] = useState<Record<number, string>>({});

  const handleVerify = async (orderId: number) => {
    setVerifying(orderId);
    try {
      await api.post(`/store/orders/${orderId}/verify_pin/`, { pin_code: pins[orderId] || '' });
      setPins((current) => ({ ...current, [orderId]: '' }));
      mutate();
    } catch (err) {
      console.error(err);
      alert('Unable to verify PIN');
    } finally {
      setVerifying(null);
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Order #{o.id}</p>
                <p className="text-sm text-slate-500">Status: {o.order_status}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">฿{o.order_total.toFixed(2)}</p>
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
            <div className="mt-3 flex items-center gap-3">
              <input value={pins[o.id] || ''} onChange={(e) => handlePinChange(o.id, e.target.value)} placeholder="Enter PIN" className="rounded border p-2" />
              <button onClick={() => handleVerify(o.id)} disabled={verifying === o.id} className="rounded-2xl bg-sky-600 px-4 py-2 text-white">Verify PIN</button>
            </div>
          </div>
        ))}
      </div>
      </Layout>
    </ProtectedPage>
  );
}
