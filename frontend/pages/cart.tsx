import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/useAuth';
import { api } from '../lib/api';
import { useState } from 'react';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateItem, removeItem, clear, total } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    updateItem(productId, qty);
  };

  const platformFeePercent = 0.05;
  const serviceFee = Number((total * platformFeePercent).toFixed(2));
  const chargeAmount = Number((total + serviceFee).toFixed(2));

  const handleCheckout = async () => {
    setError(null);
    if (!user) {
      router.push('/login');
      return;
    }
    if (!cart.vendorId) {
      setError('No vendor selected.');
      return;
    }
    if (cart.items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const payload = {
      vendor: cart.vendorId,
      items: cart.items.map((it) => ({ product_id: it.productId, quantity: it.quantity })),
    };

    try {
      setLoading(true);
      const res = await api.post('/store/orders/', payload);
      clear();
      const orderId = res.data.id;
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Unable to create order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Cart">
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Your cart</h2>
          {cart.items.length === 0 ? (
            <p className="mt-3 text-slate-500">No items in cart.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-slate-500">฿{item.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => handleQuantity(item.productId, item.quantity - 1)} className="rounded px-2 py-1 bg-slate-100">-</button>
                      <span className="px-2">{item.quantity}</span>
                      <button onClick={() => handleQuantity(item.productId, item.quantity + 1)} className="rounded px-2 py-1 bg-slate-100">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold">฿{(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeItem(item.productId)} className="text-sm text-rose-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Subtotal</p>
                <p className="text-xl font-semibold">฿{total.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Service fee ({(platformFeePercent * 100).toFixed(0)}%)</p>
                <p className="text-xl font-semibold">฿{serviceFee.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total payment</p>
                <p className="text-2xl font-semibold">฿{chargeAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => clear()} className="rounded-2xl bg-rose-100 px-4 py-2 text-rose-700">Clear</button>
              <button onClick={handleCheckout} disabled={loading || cart.items.length === 0} className="rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700">{loading ? 'Processing...' : 'Checkout'}</button>
            </div>
          </div>
          {error ? <p className="mt-3 text-rose-600">{error}</p> : null}
        </section>
      </div>
    </Layout>
  );
}
