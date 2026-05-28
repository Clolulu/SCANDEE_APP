import { Layout } from '../components/Layout';
import { ProtectedPage } from '../components/ProtectedPage';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <ProtectedPage requiredRole="admin">
      <Layout title="Admin Console">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Admin Console</h2>
            <p className="mt-3 text-slate-600">This area is reserved for admin users. Use the site navigation to manage your account or visit the backend admin if needed.</p>
          </section>

          <section className="rounded-3xl bg-slate-50 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Next steps</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Review authenticated pages for vendors and customers.</li>
              <li>• Use the header navigation to access protected areas.</li>
              <li>• If you need the Django admin, open the backend at <code className="rounded bg-white px-2 py-1">/admin/</code>.</li>
            </ul>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <Link href="/" className="inline-flex rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700">
              Return to Scandee homepage
            </Link>
          </section>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
