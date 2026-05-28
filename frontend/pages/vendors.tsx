import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

export default function VendorListPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'tourist') {
      router.push('/customer/home');
    } else if (user?.role === 'vendor') {
      router.push('/vendor/dashboard');
    } else if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  }, [user, router]);

  return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
}
