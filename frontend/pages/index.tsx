import Link from 'next/link';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/useAuth';

export default function Home() {
  const { user } = useAuth();

  if (user?.role === 'tourist') {
    return (
      <Layout title="Scandee PWA">
        <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">QR-Driven Ordering</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Order from local vendors instantly</h2>
            <p className="max-w-2xl text-slate-600">Scan a vendor QR code, browse their menu, add items to your cart, checkout securely, and pick up with a verification PIN.</p>
          </div>
          <Link href="/customer/home" className="inline-block rounded-2xl bg-sky-600 px-5 py-4 text-white shadow hover:bg-sky-700">Start Scanning QR Codes</Link>
        </div>
      </Layout>
    );
  }

  if (user?.role === 'vendor') {
    return (
      <Layout title="Scandee PWA">
        <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Vendor Dashboard</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Manage Your Shop</h2>
            <p className="max-w-2xl text-slate-600">Add products to your menu, manage incoming orders, verify pickup PINs, and share your store QR code with customers.</p>
          </div>
          <Link href="/vendor/dashboard" className="inline-block rounded-2xl bg-sky-600 px-5 py-4 text-white shadow hover:bg-sky-700">Go to Dashboard</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Scandee PWA">
      <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">QR-Driven Marketplace</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">Order products from local Thai vendors instantly.</h2>
          <p className="max-w-2xl text-slate-600">Scan a vendor QR code to browse their menu, add items to your cart, checkout securely, and pick up with a verification PIN.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/register" className="rounded-2xl bg-sky-600 px-5 py-4 text-white shadow hover:bg-sky-700 text-center">Sign up as Customer</Link>
          <Link href="/login" className="rounded-2xl bg-slate-100 px-5 py-4 text-slate-900 shadow hover:bg-slate-200 text-center">Login</Link>
        </div>
      </section>
      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Vendor QR Codes</h3>
          <p className="mt-3 text-slate-600">Each vendor has a unique QR code that customers can scan to access their shop.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">QR-First Ordering</h3>
          <p className="mt-3 text-slate-600">Customers scan a QR code to access a vendor's menu directly—no marketplace browsing required.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Secure Pickup</h3>
          <p className="mt-3 text-slate-600">Complete orders securely and verify pickup with a one-time PIN.</p>
        </div>
      </section>
    </Layout>
  );
}
