import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

interface ProtectedPageProps {
  children: ReactNode;
  requiredRole?: 'tourist' | 'vendor' | 'admin';
  fallback?: string;
}

export function ProtectedPage({ children, requiredRole, fallback = '/login' }: ProtectedPageProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(fallback);
      } else if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'vendor') {
          router.replace('/vendor/dashboard');
        } else if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/vendors');
        }
      }
    }
  }, [loading, user, requiredRole, router, fallback]);

  if (loading || !user || (requiredRole && user.role !== requiredRole)) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
