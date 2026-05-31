import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';

const toNumber = (value: string | number) => Number(value || 0);

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function OrderPage() {
  const router = useRouter();
  const { id } = router.query;
  const { loading } = useAuth();
  const { data: order, error, mutate } = useSWR(!loading && id ? `/store/orders/${id}/` : null, fetcher, {
    refreshInterval: 5000,
  });
  const [paymentToken, setPaymentToken] = useState('tok_test_12345');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [pickupPin, setPickupPin] = useState<string | null>(null);

  useEffect(() => {
    if (error) console.error('Order fetch error', error);
    const pinned = typeof router.query.pickup_pin === 'string' ? router.query.pickup_pin : undefined;
    const orderId = typeof id === 'string' ? id : undefined;
    if (pinned) {
      setPickupPin(pinned);
      if (orderId) {
        sessionStorage.setItem(`pickup_pin_${orderId}`, pinned);
      }
      return;
    }
    if (orderId) {
      const stored = sessionStorage.getItem(`pickup_pin_${orderId}`);
      if (stored) {
        setPickupPin(stored);
      }
    }
  }, [error, order, router.query.pickup_pin, id]);

  const handlePayment = async () => {
    if (!order) return;
    setPaymentError(null);
    setPaymentSuccess(null);
    setIsProcessing(true);
    try {
      const response = await api.post('/payments/charge/', {
        order_id: order.id,
        omise_token: paymentToken,
      });
      const returnedPin = response.data?.pickup_pin;
      if (returnedPin) {
        setPickupPin(returnedPin);
        sessionStorage.setItem(`pickup_pin_${order.id}`, returnedPin);
      }
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
              <p className="text-sm text-slate-500">Status: <strong className="text-slate-800">{order.order_status.replace(/_/g, ' ')}</strong></p>
              <p className="text-sm text-slate-500">Payment status: <strong className="text-slate-800">{order.payment_status.toUpperCase()}</strong></p>
              <p className="text-sm text-slate-500">Vendor: <strong className="text-slate-800">{order.vendor_name || `Vendor #${order.vendor}`}</strong></p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Subtotal</p>
                  <p className="text-lg font-semibold">฿{toNumber(order.order_total).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Service fee</p>
                  <p className="text-lg font-semibold">฿{toNumber(order.service_fee).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total charged</p>
                  <p className="text-lg font-semibold">฿{toNumber(order.charge_amount).toFixed(2)}</p>
                </div>
              </div>
              {(pickupPin || order.pickup_pin) ? (
                <div className="rounded-3xl bg-sky-50 p-5 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-700">Pickup PIN</p>
                  <p className="mt-2 text-5xl font-black tracking-[0.2em] text-sky-900">{pickupPin || order.pickup_pin}</p>
                  <p className="mt-2 text-sm text-slate-600">Show this code when you pick up your order.</p>
                </div>
              ) : null}
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
              {(order.payment_status === 'PENDING' || order.order_status === 'PENDING_PAYMENT' || order.payment_status === 'FAILED') ? (
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
                  <p className="text-sm text-slate-700">Your order is confirmed. Please show the PIN to the vendor when receiving your order.</p>
                  <p className="mt-3 text-slate-700">Current status: <strong>{order.order_status.replace(/_/g, ' ')}</strong></p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/orders" className="rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 text-center">
                      View order history
                    </Link>
                    <Link href={`/orders/${order.id}`} className="rounded-2xl border border-slate-300 px-5 py-3 text-slate-900 text-center hover:bg-slate-100">
                      Refresh order status
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
