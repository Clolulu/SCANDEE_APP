import Link from 'next/link';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';

export default function VendorDashboard() {
  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Vendor Dashboard">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Vendor Dashboard</h2>
            <p className="mt-3 text-slate-600">Manage products, view orders, and share your store link.</p>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Product management</h3>
              <p className="mt-2 text-slate-500">Add, edit, and remove items in your shop.</p>
              <Link href="/vendor/products" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">Manage products</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Order management</h3>
              <p className="mt-2 text-slate-500">Review incoming orders and verify pickup PINs.</p>
              <Link href="/vendor/orders" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">View orders</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">QR code</h3>
              <p className="mt-2 text-slate-500">Share your store link directly with customers.</p>
              <Link href="/vendor/qr" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">View QR link</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Shop profile</h3>
              <p className="mt-2 text-slate-500">Update your storefront presentation and business details.</p>
              <Link href="/vendor/shop" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">Edit shop profile</Link>
            </article>
            <article className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Account settings</h3>
              <p className="mt-2 text-slate-500">Change your login email, contact details, or password.</p>
              <Link href="/vendor/settings" className="mt-4 inline-flex rounded-2xl bg-sky-600 px-4 py-2 text-white">Update account</Link>
            </article>
          </section>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
