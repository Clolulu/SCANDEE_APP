import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function OrderPage() {
  const router = useRouter();
  const { id } = router.query;
  const { loading } = useAuth();
  const { data: order, error, mutate } = useSWR(!loading && id ? `/store/orders/${id}/` : null, fetcher);
  const [paymentToken, setPaymentToken] = useState('tok_test_12345');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (error) console.error('Order fetch error', error);
  }, [error]);

  const handlePayment = async () => {
    if (!order) return;
    setPaymentError(null);
    setPaymentSuccess(null);
    setIsProcessing(true);
    try {
      await api.post('/payments/charge/', {
        order_id: order.id,
        omise_token: paymentToken,
      });
      setPaymentSuccess('Payment completed successfully.');
      await mutate();
    } catch (err: any) {
      console.error(err);
      setPaymentError(err?.response?.data?.detail || 'Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout title={order ? `Order #${order.id}` : 'Order'}>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Order {order ? `#${order.id}` : ''}</h2>
          {!order && !error && <p className="mt-3 text-slate-500">Loading...</p>}
          {error && <p className="mt-3 text-rose-600">Unable to load order.</p>}
          {order ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-500">Status: <strong className="text-slate-800">{order.order_status}</strong></p>
              <p className="text-sm text-slate-500">Payment status: <strong className="text-slate-800">{order.payment_status}</strong></p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Subtotal</p>
                  <p className="text-lg font-semibold">฿{order.order_total.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Service fee</p>
                  <p className="text-lg font-semibold">฿{order.service_fee.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total charged</p>
                  <p className="text-lg font-semibold">฿{order.charge_amount.toFixed(2)}</p>
                </div>
              </div>
              {order.pin_code ? <p className="text-sm text-slate-500">Pickup PIN: <strong className="text-slate-800">{order.pin_code}</strong></p> : null}
              <div className="mt-2 space-y-2">
                {order.items.map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <p className="font-semibold">{it.product.name}</p>
                      <p className="text-sm text-slate-500">Qty: {it.quantity}</p>
                    </div>
                    <div className="font-semibold">฿{(it.product.price * it.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              {order.payment_status !== 'paid' ? (
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Enter any valid card token to complete payment. In development, use <strong>tok_test_12345</strong>.</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={paymentToken}
                      onChange={(e) => setPaymentToken(e.target.value)}
                      className="w-full rounded border p-3"
                      placeholder="omise token"
                    />
                    <button
                      disabled={isProcessing}
                      onClick={handlePayment}
                      className="rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Pay now'}
                    </button>
                  </div>
                  {paymentError ? <p className="mt-3 text-rose-600">{paymentError}</p> : null}
                  {paymentSuccess ? <p className="mt-3 text-emerald-600">{paymentSuccess}</p> : null}
                </div>
              ) : (
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="text-sm text-slate-700">Your payment is complete. You can now view your order receipt and pickup PIN anytime.</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/orders" className="rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 text-center">
                      View order history
                    </Link>
                    <Link href={`/orders/${order.id}`} className="rounded-2xl border border-slate-300 px-5 py-3 text-slate-900 text-center hover:bg-slate-100">
                      View receipt
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </Layout>
  );
}
