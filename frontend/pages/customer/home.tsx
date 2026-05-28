import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';
import { useAuth } from '../../lib/useAuth';

const QRScanner = dynamic(() => import('../../components/QRScanner').then(m => ({ default: m.QRScanner })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading scanner...</div>,
});

export default function CustomerHome() {
  const router = useRouter();
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [showQrInput, setShowQrInput] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [error, setError] = useState('');

  const handleQrScan = () => {
    setError('');
    if (!qrInput.trim()) {
      setError('Please enter a vendor ID or scan a QR code');
      return;
    }
    const vendorId = qrInput.trim();
    if (!/^\d+$/.test(vendorId)) {
      setError('Invalid vendor ID. Please enter a number.');
      return;
    }
    router.push(`/store/${vendorId}`);
  };

  return (
    <ProtectedPage requiredRole="tourist">
      <Layout title="Welcome">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-semibold">Welcome, {user?.full_name || 'Customer'}</h2>
            <p className="mt-3 text-slate-600">Scan a vendor QR code to browse their menu and place an order.</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-3xl bg-sky-50 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-sky-900">Scan QR Code</h3>
              <p className="mt-2 text-sm text-sky-700">Use your camera to scan a vendor QR code or enter a vendor ID.</p>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 font-semibold"
                >
                  📷 Open Camera Scanner
                </button>
                <button
                  onClick={() => setShowQrInput(!showQrInput)}
                  className="w-full rounded-2xl border border-sky-600 px-5 py-2 text-sky-600 hover:bg-sky-50"
                >
                  {showQrInput ? 'Hide Manual Entry' : 'Or Enter Vendor ID'}
                </button>
              </div>
              {showQrInput && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Enter vendor ID (e.g., 1)"
                    value={qrInput}
                    onChange={(e) => {
                      setQrInput(e.target.value);
                      setError('');
                    }}
                    className="w-full rounded border border-sky-200 p-3"
                  />
                  <button
                    onClick={handleQrScan}
                    className="w-full rounded-2xl bg-sky-600 px-5 py-2 text-white hover:bg-sky-700"
                  >
                    Go to Store
                  </button>
                  {error && <p className="text-sm text-rose-600">{error}</p>}
                </div>
              )}
            </section>

            <Link href="/orders" className="rounded-3xl bg-slate-100 p-6 shadow-sm hover:bg-slate-200 transition">
              <h3 className="text-xl font-semibold text-slate-900">My Orders</h3>
              <p className="mt-2 text-sm text-slate-600">View your order history, track status, and pickup PINs.</p>
              <div className="mt-4 text-sm text-slate-700 font-semibold">View orders →</div>
            </Link>
          </div>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Quick Help</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Ask the vendor to show you their QR code</li>
              <li>• Click "Open Camera Scanner" to scan with your phone camera</li>
              <li>• Or enter their vendor ID manually</li>
              <li>• Browse their menu and add items to your cart</li>
              <li>• Complete payment and receive a pickup PIN</li>
              <li>• Present your PIN to the vendor to collect your order</li>
            </ul>
          </section>
        </div>

        {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
      </Layout>
    </ProtectedPage>
  );
}

