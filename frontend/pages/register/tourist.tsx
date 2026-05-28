import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import { Layout } from '../../components/Layout';

export default function RegisterCustomer() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/register/customer/', form);
      const access = response.data.access;
      const refresh = response.data.refresh;
      const user = response.data.user;
      login({ access, refresh, user });
      router.push('/vendors');
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <Layout title="Register Customer">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Customer registration</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="block space-y-2">
            <span>Full name</span>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span>Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </label>
          {error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          <button type="submit" className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white hover:bg-sky-700">Register as Customer</button>
        </form>
      </div>
    </Layout>
  );
}
