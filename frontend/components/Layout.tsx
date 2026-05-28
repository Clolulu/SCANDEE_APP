import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const roleLabel = user?.role === 'vendor' ? 'Vendor' : user?.role === 'admin' ? 'Admin' : 'Customer';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold text-slate-900">Scandee</Link>
            {user ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{roleLabel}</span> : null}
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {!user && (
              <>
                <Link href="/" className="hover:text-slate-900">Home</Link>
                <Link href="/login" className="hover:text-slate-900">Login</Link>
                <Link href="/register" className="hover:text-slate-900">Register</Link>
              </>
            )}
            {user?.role === 'tourist' && (
              <>
                <Link href="/customer/home" className="hover:text-slate-900">Scan QR</Link>
                <Link href="/orders" className="hover:text-slate-900">My Orders</Link>
                <Link href="/account" className="hover:text-slate-900">Account</Link>
                <button onClick={logout} className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-100">Logout</button>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link href="/admin" className="hover:text-slate-900">Admin</Link>
                <button onClick={logout} className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-100">Logout</button>
              </>
            )}
            {user?.role === 'vendor' && (
              <>
                <Link href="/vendor/dashboard" className="hover:text-slate-900">Dashboard</Link>
                <Link href="/vendor/products" className="hover:text-slate-900">Products</Link>
                <Link href="/vendor/orders" className="hover:text-slate-900">Orders</Link>
                <Link href="/vendor/qr" className="hover:text-slate-900">QR</Link>
                <Link href="/vendor/shop" className="hover:text-slate-900">Shop Profile</Link>
                <Link href="/vendor/settings" className="hover:text-slate-900">Account Settings</Link>
                <button onClick={logout} className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-100">Logout</button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <footer className="border-t bg-white py-4 text-center text-sm text-slate-500">
        {title || 'Mobile first marketplace for customers and vendors.'}
      </footer>
    </div>
  );
}
