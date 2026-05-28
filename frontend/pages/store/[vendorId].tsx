import useSWR from 'swr';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/useAuth';
import { useMemo } from 'react';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function StorePage() {
  const router = useRouter();
  const { vendorId } = router.query;
  const vendorIdNumber = typeof vendorId === 'string' ? Number(vendorId) : null;
  const { data: vendor, error: vendorError } = useSWR(vendorId ? `/store/vendor/${vendorId}/` : null, fetcher);
  const { data: products, error: productsError } = useSWR(vendorId ? `/store/products/?vendor=${vendorId}` : null, fetcher);
  const { user } = useAuth();
  const { cart, addItem, updateItem, removeItem, clear, total } = useCart();

  const addToCart = (product: any) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!vendorIdNumber) return;
    addItem({ vendorId: vendorIdNumber, productId: product.id, name: product.name, price: Number(product.price), quantity: 1 });
  };

  const currentItems = useMemo(() => {
    if (!cart.vendorId || cart.vendorId !== vendorIdNumber) return [];
    return cart.items;
  }, [cart, vendorIdNumber]);

  return (
    <Layout title={vendor?.shop_name || 'Store'}>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white shadow-sm overflow-hidden">
          {vendor?.banner_image_url ? (
            <div className="h-52 w-full overflow-hidden bg-slate-100">
              <img src={vendor.banner_image_url} alt={`${vendor.shop_name} banner`} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {vendor?.logo_image_url ? (
                  <img src={vendor.logo_image_url} alt={`${vendor.shop_name} logo`} className="h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">Logo</div>
                )}
                <div>
                  <h2 className="text-2xl font-semibold">{vendor?.shop_name || 'Loading vendor...'}</h2>
                  <p className="text-sm text-slate-500">{vendor?.category || 'Local vendor'}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">Shop ID: {vendorId}</div>
            </div>
            {vendorError ? (
              <div className="mt-4 rounded-3xl bg-rose-50 p-4 text-rose-700">Unable to load vendor details. Please refresh or try a different store.</div>
            ) : (
              <>
                <p className="mt-4 text-slate-600">{vendor?.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  {vendor?.phone_number ? <span>📞 {vendor.phone_number}</span> : null}
                  {vendor?.address ? <span>📍 {vendor.address}</span> : null}
                  {vendor?.business_hours ? <span>⏱ {vendor.business_hours}</span> : null}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Products</h3>
          <p className="mt-2 text-slate-600">Available items from this vendor.</p>
          {productsError && (
            <div className="mt-4 rounded-3xl bg-rose-50 p-4 text-rose-700">
              Unable to load products. Please refresh the page.
            </div>
          )}
          {!products && !productsError && (
            <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-slate-500">Loading products…</div>
          )}
          {products && products.length === 0 && (
            <div className="mt-4 rounded-3xl bg-slate-50 p-6 text-slate-500">
              This vendor has no available products.
            </div>
          )}
          {products && products.length > 0 && (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {products.map((product: any) => (
                <article key={product.id} className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{product.name}</h3>
                  <p className="mt-2 text-slate-500">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold">฿{product.price}</span>
                    <button onClick={() => addToCart(product)} className="rounded-2xl bg-sky-600 px-3 py-2 text-white">Add</button>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{product.available ? `In stock: ${product.stock_quantity}` : 'Unavailable'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Cart</h3>
            <button onClick={() => router.push('/cart')} className="text-sm text-sky-600 hover:underline">View cart</button>
          </div>
          {currentItems.length === 0 ? (
            <p className="mt-3 text-slate-500">Your cart is empty. Add items to continue.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {currentItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">฿{item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item.productId)} className="rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentItems.length > 0 ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Order total</p>
                <p className="text-2xl font-semibold">฿{total.toFixed(2)}</p>
              </div>
              <button onClick={() => router.push('/cart')} className="rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700">Checkout</button>
            </div>
          ) : null}
        </section>
      </div>
    </Layout>
  );
}
