import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Html5Qrcode } from 'html5-qrcode';
import { useCart } from '../lib/cart';

interface QRScannerProps {
  onClose?: () => void;
}

export function QRScanner({ onClose }: QRScannerProps) {
  const router = useRouter();
  const { cart, clear } = useCart();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [pendingStorePath, setPendingStorePath] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    const initializeScanner = async () => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        setError(null);
        setPermission('pending');

        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError('No camera found on this device. Please use a device with a camera.');
          setPermission('denied');
          isInitializingRef.current = false;
          return;
        }

        deviceIdRef.current = devices[0].id;

        const html5QrCode = new Html5Qrcode('qr-scanner-container');
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250},
        };

        await html5QrCode.start(
          devices[0].id,
          config,
          (decodedText) => {
            handleQRCodeScanned(decodedText);
          },
          (error) => {
            console.debug('QR scan attempt:', error);
          }
        );

        setIsScanning(true);
        setPermission('granted');
      } catch (err: any) {
        console.error('Scanner initialization error:', err);
        
        if (err?.message?.includes('NotAllowedError') || err?.message?.includes('permission')) {
          setError('Camera permission denied. Please allow camera access in your device settings.');
          setPermission('denied');
        } else if (err?.message?.includes('NotFoundError') || err?.message?.includes('no device')) {
          setError('No camera found on this device.');
          setPermission('denied');
        } else if (err?.message?.includes('NotSupportedError')) {
          setError('Your browser does not support camera access. Please use a modern browser.');
          setPermission('denied');
        } else {
          setError('Unable to access camera. Please check your device and browser settings.');
          setPermission('denied');
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => console.debug('Scanner stop error:', err));
      }
    };
  }, []);

  const handleQRCodeScanned = (decodedText: string) => {
    try {
      setIsScanning(false);
      
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }

      const url = new URL(decodedText, window.location.origin);
      const storeMatch = url.pathname.match(/\/store\/(\d+)/);

      if (storeMatch && storeMatch[1]) {
        const vendorId = storeMatch[1];
        const vendorIdNumber = Number(vendorId);
        if (cart.vendorId && cart.vendorId !== vendorIdNumber && cart.items.length > 0) {
          setPendingStorePath(`/store/${vendorId}`);
          return;
        }

        router.push(`/store/${vendorId}`);
      } else {
        setError('Invalid QR code. Please scan a valid Scandee vendor QR code.');
        setIsScanning(true);
        restartScanning();
      }
    } catch (err) {
      setError('Invalid QR code. Please scan a valid Scandee vendor QR code.');
      setIsScanning(true);
      restartScanning();
    }
  };

  const restartScanning = async () => {
    if (!scannerRef.current || !deviceIdRef.current) return;
    
    try {
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
      };
      await scannerRef.current.start(
        deviceIdRef.current,
        config,
        (decodedText) => handleQRCodeScanned(decodedText),
        () => {}
      );
    } catch (err) {
      console.debug('Error restarting scanner:', err);
    }
  };

  const handleCancel = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.debug('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    setError(null);
    if (onClose) onClose();
  };

  const handleRetry = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.debug('Error stopping scanner:', err);
      }
    }
    setError(null);
    setPermission('pending');
    setIsScanning(false);
    isInitializingRef.current = false;
    deviceIdRef.current = null;

    const initializeScanner = async () => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError('No camera found on this device.');
          setPermission('denied');
          isInitializingRef.current = false;
          return;
        }

        deviceIdRef.current = devices[0].id;

        const html5QrCode = new Html5Qrcode('qr-scanner-container');
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
        };

        await html5QrCode.start(
          devices[0].id,
          config,
          (decodedText) => {
            handleQRCodeScanned(decodedText);
          },
          () => {}
        );

        setIsScanning(true);
        setPermission('granted');
      } catch (err: any) {
        console.error('Retry scanner error:', err);
        setError('Unable to access camera. Please check your device settings.');
        setPermission('denied');
      } finally {
        isInitializingRef.current = false;
      }
    };

    await initializeScanner();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      <div className="relative h-full w-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black px-4 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Scan Vendor QR Code</h2>
            <button
              onClick={handleCancel}
              className="rounded-full p-2 hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scanner container */}
        {permission === 'granted' && (
          <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
            <div id="qr-scanner-container" className="w-full h-full" />
            
            {/* Scanning frame overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 border-4 border-sky-500 rounded-2xl shadow-lg shadow-sky-500/50" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-sky-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-sky-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-sky-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-sky-500 rounded-br-lg" />
                
                {/* Animated scanning line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse" />
                </div>
              </div>
            </div>

            {/* Bottom instruction */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-4 py-6 text-center text-white">
              <p className="text-sm">Position the QR code within the frame</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 px-4 py-8">
            <div className="rounded-3xl bg-rose-50 p-6 max-w-sm mx-auto text-center">
              <h3 className="text-lg font-semibold text-rose-900">Unable to Scan</h3>
              <p className="mt-3 text-sm text-rose-700">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {permission === 'pending' && !error && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 px-4">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full border-4 border-slate-600 border-t-sky-500 h-12 w-12" />
              <p className="mt-4 text-white">Accessing camera...</p>
              <p className="mt-2 text-sm text-slate-400">Please allow camera access when prompted</p>
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        {isScanning && permission === 'granted' && !error && (
          <div className="sticky bottom-0 bg-black border-t border-slate-700 px-4 py-4">
            <button
              onClick={handleCancel}
              className="w-full rounded-2xl border border-slate-500 px-4 py-3 text-white hover:bg-slate-900"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {pendingStorePath ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/20">
            <h3 className="text-xl font-semibold">Start a new order?</h3>
            <p className="mt-3 text-sm text-slate-600">
              You already have items from another vendor in your cart. Starting a new order will clear your current cart and take you to the new shop.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={async () => {
                  setPendingStorePath(null);
                  setError(null);
                  setIsScanning(false);
                  await restartScanning();
                }}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!pendingStorePath) return;
                  clear();
                  router.push(pendingStorePath);
                }}
                className="rounded-2xl bg-sky-600 px-4 py-3 text-white hover:bg-sky-700"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
