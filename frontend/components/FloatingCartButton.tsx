import { useRouter } from 'next/router';
import { useCart } from '../lib/cart';

export function FloatingCartButton() {
  const router = useRouter();
  const { cart, total, totalQuantity } = useCart();
  const { pathname } = router;
  const isVisible = cart.items.length > 0 && pathname.startsWith('/store');

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={() => router.push('/cart')}
      className="fixed bottom-4 right-4 z-40 inline-flex max-w-xs items-center justify-between gap-3 rounded-3xl bg-slate-950 px-4 py-3 text-left text-white shadow-2xl shadow-slate-950/25 transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
      aria-label="Open cart"
    >
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">View cart</p>
        <p className="text-xs text-slate-300">{totalQuantity} item{totalQuantity === 1 ? '' : 's'} · ฿{total.toFixed(2)}</p>
      </div>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white shadow-lg shadow-sky-500/40">
        {totalQuantity}
      </span>
    </button>
  );
}
