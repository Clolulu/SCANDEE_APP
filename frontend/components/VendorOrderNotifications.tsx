import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { api } from '../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);
const SOUND_STORAGE_KEY = 'vendor_notifications_sound_enabled';
const ACTIVE_STATUSES = new Set(['PAID', 'PREPARING', 'READY_FOR_PICKUP']);

function formatCurrency(amount: number | string) {
  const value = Number(amount || 0);
  return `฿${value.toFixed(2)}`;
}

function playNotificationSound() {
  if (typeof window === 'undefined' || !window.AudioContext) {
    return;
  }

  try {
    const audioCtx = new window.AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.12;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 180);
  } catch (err) {
    console.warn('Unable to play notification sound', err);
  }
}

export function VendorOrderNotifications() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toastOrder, setToastOrder] = useState<any | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousActiveIds = useRef<number[]>([]);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
      setSoundEnabled(stored === 'true');
    }
  }, []);

  const { data: orders } = useSWR(isMounted ? '/store/orders/' : null, fetcher, {
    refreshInterval: 5000,
  });

  const activeOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }
    return [...orders]
      .filter((order) => ACTIVE_STATUSES.has(order.order_status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders]);

  const badgeCount = activeOrders.length;

  useEffect(() => {
    if (!orders || !isMounted) {
      return;
    }

    const currentIds = activeOrders.map((order) => order.id);
    if (previousActiveIds.current.length === 0) {
      previousActiveIds.current = currentIds;
      return;
    }

    const newIds = currentIds.filter((id) => !previousActiveIds.current.includes(id));
    if (newIds.length > 0) {
      const newOrder = activeOrders.find((order) => order.id === newIds[0]);
      if (newOrder) {
        setToastOrder(newOrder);
        if (soundEnabled) {
          playNotificationSound();
        }
        if (toastTimeoutRef.current) {
          window.clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = window.setTimeout(() => setToastOrder(null), 6500);
      }
    }

    previousActiveIds.current = currentIds;
  }, [activeOrders, orders, isMounted, soundEnabled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('#vendor-order-notifications-dropdown')) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOrderClick = (orderId: number) => {
    setDropdownOpen(false);
    router.push({
      pathname: '/vendor/orders',
      query: { highlight: orderId },
    });
  };

  const handleViewAll = () => {
    setDropdownOpen(false);
    router.push('/vendor/orders');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        type="button"
        onClick={() => setDropdownOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50"
        aria-label="Vendor notifications"
      >
        <span className="text-xl">🔔</span>
        {badgeCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            {badgeCount}
          </span>
        ) : null}
      </button>

      {dropdownOpen ? (
        <div
          id="vendor-order-notifications-dropdown"
          className="absolute right-0 bottom-full z-50 mb-3 w-[min(90vw,20rem)] rounded-3xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="rounded-t-3xl bg-slate-100 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">New Orders</p>
                <p className="text-xs text-slate-500">Active orders requiring attention</p>
              </div>
              <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                {badgeCount}
              </span>
            </div>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto p-4">
            {activeOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                No active orders at the moment.
              </div>
            ) : (
              activeOrders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => handleOrderClick(order.id)}
                  className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-900">Order #{order.id} — {formatCurrency(order.order_total)}</p>
                  <p className="mt-1 text-xs text-slate-500">{order.order_status}</p>
                </button>
              ))
            )}
          </div>
          <div className="rounded-b-3xl border-t border-slate-200 bg-slate-50 p-4 text-right">
            <button
              type="button"
              onClick={handleViewAll}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View All Orders
            </button>
          </div>
        </div>
      ) : null}

      {toastOrder ? (
        <div className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:w-auto">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-2xl bg-sky-100 p-2 text-sky-700">🔔</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">New order received</p>
              <p className="mt-1 text-sm text-slate-500">Order #{toastOrder.id}</p>
              <p className="text-sm text-slate-500">Total {formatCurrency(toastOrder.order_total)}</p>
              <button
                type="button"
                onClick={() => handleOrderClick(toastOrder.id)}
                className="mt-3 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                View Order
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
