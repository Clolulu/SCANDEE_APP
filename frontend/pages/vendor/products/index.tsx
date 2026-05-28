import useSWR from 'swr';
import { api } from '../../../lib/api';
import { Layout } from '../../../components/Layout';
import { ProtectedPage } from '../../../components/ProtectedPage';
import { useAuth } from '../../../lib/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/router';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function VendorProducts() {
  const router = useRouter();
  const { loading } = useAuth();
  const { data: products, mutate } = useSWR(!loading ? '/store/products/' : null, fetcher);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/store/products/${id}/`);
      mutate();
    } catch (err) {
      console.error(err);
      alert('Unable to delete product');
    }
  };

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Vendor Products">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Products</h2>
          <Link href="/vendor/products/create" className="rounded-2xl bg-sky-600 px-4 py-2 text-white">Create</Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products?.map((p: any) => (
            <article key={p.id} className="rounded-3xl bg-white p-5 shadow-sm overflow-hidden">
              <div className="h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mb-4 flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" onError={(e: any) => e.currentTarget.parentElement.innerHTML = '<div class="text-slate-400 text-sm">Unable to load</div>'} />
                ) : (
                  <div className="text-center">
                    <div className="text-3xl mb-2">📸</div>
                    <div className="text-slate-500 text-xs">No image</div>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-slate-500">฿{p.price}</p>
              <p className="mt-2 text-slate-600 line-clamp-2">{p.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/vendor/products/edit/${p.id}`} className="rounded-2xl bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200 transition">Edit</Link>
                <button onClick={() => handleDelete(p.id)} className="rounded-2xl bg-rose-100 px-3 py-2 text-sm text-rose-700 hover:bg-rose-200 transition">Delete</button>
              </div>
            </article>
          ))}
        </section>
      </div>
      </Layout>
    </ProtectedPage>
  );
}
