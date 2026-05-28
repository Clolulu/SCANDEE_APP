import { useState } from 'react';
import { useRouter } from 'next/router';
import { api, parseApiError } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import { Layout } from '../../components/Layout';

export default function RegisterVendor() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ shop_name: '', owner_name: '', email: '', password: '', passwordConfirm: '', phone_number: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.shop_name.trim()) {
      errors.shop_name = 'Shop name is required.';
    }
    if (!form.owner_name.trim()) {
      errors.owner_name = 'Owner name is required.';
    }
    if (!form.phone_number.trim()) {
      errors.phone_number = 'Phone number is required.';
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Invalid email format.';
    }
    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    }
    if (!form.passwordConfirm) {
      errors.passwordConfirm = 'Please confirm your password.';
    } else if (form.password !== form.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match.';
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError('Please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register/vendor/', {
        shop_name: form.shop_name.trim(),
        owner_name: form.owner_name.trim(),
        phone_number: form.phone_number.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const access = response.data.access;
      const refresh = response.data.refresh;
      const user = response.data.user;
      login({ access, refresh, user });
      router.push('/vendor/dashboard');
    } catch (err: unknown) {
      const result = parseApiError(err);
      setFieldErrors(result.fields);
      setGeneralError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Register Vendor">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Vendor registration</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span>Shop name</span>
            <input
              type="text"
              value={form.shop_name}
              onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
              required
              aria-invalid={!!fieldErrors.shop_name}
            />
            {fieldErrors.shop_name && <p className="text-rose-600">{fieldErrors.shop_name}</p>}
          </label>
          <label className="block space-y-2">
            <span>Owner name</span>
            <input
              type="text"
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              required
              aria-invalid={!!fieldErrors.owner_name}
            />
            {fieldErrors.owner_name && <p className="text-rose-600">{fieldErrors.owner_name}</p>}
          </label>
          <label className="block space-y-2">
            <span>Phone number</span>
            <input
              type="tel"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              required
              aria-invalid={!!fieldErrors.phone_number}
            />
            {fieldErrors.phone_number && <p className="text-rose-600">{fieldErrors.phone_number}</p>}
          </label>
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
              minLength={8}
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && <p className="text-rose-600">{fieldErrors.password}</p>}
          </label>
          <label className="block space-y-2">
            <span>Confirm password</span>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required
              aria-invalid={!!fieldErrors.passwordConfirm}
            />
            {fieldErrors.passwordConfirm && <p className="text-rose-600">{fieldErrors.passwordConfirm}</p>}
          </label>
          {generalError && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{generalError}</div>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400">
            {isSubmitting ? 'Creating account…' : 'Register as Vendor'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
