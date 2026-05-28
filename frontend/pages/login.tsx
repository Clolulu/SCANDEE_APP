import { useState } from 'react';
import { useRouter } from 'next/router';
import { api, parseApiError } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { Layout } from '../components/Layout';

const DEMO_CUSTOMER = { email: 'buyer@test.com', password: 'test123' };
const DEMO_VENDOR = { email: 'vendor@test.com', password: 'test123' };

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponse = (response: any) => {
    const access = response.data.access;
    const refresh = response.data.refresh;
    const user = response.data.user;
    login({ access, refresh, user });

    if (user.role === 'vendor') {
      router.push('/vendor/dashboard');
    } else if (user.role === 'admin') {
      window.location.href = '/admin';
    } else {
      router.push('/customer/home');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Invalid email format.';
    }
    if (!form.password) {
      errors.password = 'Password is required.';
    }
    return errors;
  };

  const loginUser = async (email: string, password: string) => {
    setGeneralError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login/', { email, password });
      handleResponse(response);
    } catch (err: unknown) {
      const result = parseApiError(err);
      setFieldErrors(result.fields);
      setGeneralError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError('Please fix the highlighted fields.');
      return;
    }
    await loginUser(form.email.trim(), form.password);
  };

  const handleQuickLogin = async (credentials: { email: string; password: string }) => {
    setForm(credentials);
    await loginUser(credentials.email, credentials.password);
  };

  return (
    <Layout title="Customer Login">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Customer Login</h2>
        <p className="mt-2 text-slate-600">Login as a customer or vendor to continue browsing and managing your shop.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => handleQuickLogin(DEMO_CUSTOMER)} className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 hover:bg-slate-200">
            Customer Demo
          </button>
          <button type="button" onClick={() => handleQuickLogin(DEMO_VENDOR)} className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 hover:bg-slate-200">
            Vendor Demo
          </button>
        </div>
        <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold">Customer Demo:</p>
          <p>buyer@test.com / test123</p>
          <p className="mt-3 font-semibold">Vendor Demo:</p>
          <p>vendor@test.com / test123</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <p className="text-rose-600">{fieldErrors.email}</p>}
          </label>
          <label className="block space-y-2">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && <p className="text-rose-600">{fieldErrors.password}</p>}
          </label>
          {generalError && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{generalError}</div>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
