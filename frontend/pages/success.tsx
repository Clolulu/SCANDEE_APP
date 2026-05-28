import Link from 'next/link';
import { Layout } from '../components/Layout';

export default function Success() {
  return (
    <Layout title="Payment Success">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-sm text-center">
        <h2 className="text-3xl font-semibold text-slate-900">Payment Complete</h2>
        <p className="mt-4 text-slate-600">Your order has been placed. Show the 6-digit PIN to the vendor to receive your items.</p>
        <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Pickup PIN</p>
          <p className="mt-2 text-4xl font-semibold">123456</p>
        </div>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-sky-600 px-6 py-3 text-white hover:bg-sky-700">Back to home</Link>
      </div>
    </Layout>
  );
}
