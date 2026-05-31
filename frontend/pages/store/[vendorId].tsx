import useSWR from 'swr';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/useAuth';
import { useMemo } from 'react';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const formatBusinessHours = (value: string) => {
  const parseTimeValue = (text: string) => {
    const normalized = text.trim().toUpperCase();
    const ampmMatch = normalized.match(/^([0-9]{1,2}:[0-9]{2})\s*(AM|PM)$/);
    if (ampmMatch) {
      const [, time, period] = ampmMatch;
      const [hour, minute] = time.split(':').map(Number);
      const hour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
      return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    const twentyFourMatch = normalized.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (twentyFourMatch) {
      const [, hour, minute] = twentyFourMatch;
      return `${hour.padStart(2, '0')}:${minute}`;
    }
    return null;
  };

  const parts = value.split('-').map((part) => part.trim());
  if (parts.length !== 2) {
    return value;
  }

  const opening = parseTimeValue(parts[0]);
  const closing = parseTimeValue(parts[1]);
  if (!opening || !closing) {
    return value;
  }

  const [openHour, openMinute] = opening.split(':').map(Number);
  const [closeHour, closeMinute] = closing.split(':').map(Number);
  const openDate = new Date(1970, 0, 1, openHour, openMinute);
  const closeDate = new Date(1970, 0, 1, closeHour, closeMinute);
  return `${openDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${closeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function StorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { vendorId } = router.query;
  const vendorIdNumber = typeof vendorId === 'string' ? Number(vendorId) : null;
  const { data: vendor, error: vendorError } = useSWR(vendorId ? `/store/vendor/${vendorId}/` : null, fetcher);
  const { data: products, error: productsError } = useSWR(vendorId ? `/store/products/?vendor=${vendorId}` : null, fetcher);
  const { data: currentUserVendor } = useSWR(user && user.role === 'vendor' ? `/store/vendor/${user.id}/` : null, fetcher);
  const { cart, addItem, updateItem, removeItem, clear, total } = useCart();

  const isVendorPreviewingOwnStore = user && user.role === 'vendor' && currentUserVendor && currentUserVendor.id === vendorIdNumber;

  // Debug: log vendor payload when it updates
  if (vendor) {
    console.debug('StorePage.vendor data', vendorId, vendor);
  }

  const addToCart = (product: any) => {
    if (!vendorIdNumber || isVendorPreviewingOwnStore) return;
    addItem({
      vendorId: vendorIdNumber,
      productId: product.id,
      productName: product.name,
      productPrice: Number(product.price),
      quantity: 1,
      image: product.image_url || null,
    });
  };

  const currentItems = useMemo(() => {
    if (!cart.vendorId || cart.vendorId !== vendorIdNumber) return [];
    return cart.items;
  }, [cart, vendorIdNumber]);

  return (
    <Layout title={vendor?.shop_name || 'Store'}>
      <div className="space-y-6">
        {isVendorPreviewingOwnStore && (
          <section className="rounded-3xl bg-amber-50 border-2 border-amber-300 p-4 shadow-sm">
            <p className="text-sm font-semibold text-amber-900">👀 Preview Mode — You are viewing your own store. Customers will see this page.</p>
          </section>
        )}
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
                  {vendor?.business_hours ? <span>⏱ Open: {formatBusinessHours(vendor.business_hours)}</span> : null}
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
                    <button 
                      onClick={() => addToCart(product)} 
                      disabled={isVendorPreviewingOwnStore}
                      className={`rounded-2xl px-3 py-2 text-white ${isVendorPreviewingOwnStore ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
                    >
                      {isVendorPreviewingOwnStore ? 'Preview' : 'Add'}
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{product.available ? `In stock: ${product.stock_quantity}` : 'Unavailable'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
}
