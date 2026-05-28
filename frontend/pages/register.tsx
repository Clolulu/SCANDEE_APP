import Link from 'next/link';
import { Layout } from '../components/Layout';

export default function Register() {
  return (
    <Layout title="Register">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-semibold">Create your account</h2>
        <p className="mt-2 text-slate-600">Choose the role that fits your workflow.</p>
        <div className="mt-8 space-y-4">
          <Link href="/register/customer" className="block rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 text-left hover:border-sky-300">
            <p className="text-xl font-semibold">Register as Customer</p>
            <p className="mt-2 text-slate-500">Browse vendor catalogs, order items, and pay by card.</p>
          </Link>
          <Link href="/register/vendor" className="block rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 text-left hover:border-sky-300">
            <p className="text-xl font-semibold">Register as Vendor</p>
            <p className="mt-2 text-slate-500">Create a shop, generate a QR code, and manage orders.</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
