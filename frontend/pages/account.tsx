import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedPage } from '../components/ProtectedPage';
import { useAuth } from '../lib/useAuth';

export default function AccountPage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);

  return (
    <ProtectedPage requiredRole="tourist">
      <Layout title="My Account">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Account Details</h2>
            <p className="mt-2 text-slate-600">View your profile information.</p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <p className="mt-2 text-slate-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <p className="mt-2 text-slate-900">{user?.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Account Type</label>
                <p className="mt-2 rounded-2xl bg-slate-100 px-3 py-2 inline-block text-sm text-slate-700">Customer</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-slate-50 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">About Your Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• You can scan vendor QR codes to browse their menus</li>
              <li>• Your orders and pickup PINs are saved in your account</li>
              <li>• Your payment information is securely processed</li>
              <li>• You can manage your orders from your account</li>
            </ul>
          </section>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
