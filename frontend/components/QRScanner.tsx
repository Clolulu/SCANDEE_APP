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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 1: Request camera permission first
  useEffect(() => {
    const requestCameraPermission = async () => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        setError(null);
        
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        
        // Stop the stream immediately - we just needed to request permission
        stream.getTracks().forEach(track => track.stop());
        
        setPermission('granted');
      } catch (err: any) {
        console.error('Camera permission error:', err);
        
        if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err?.name === 'NotFoundError') {
          setError('No camera found on this device. Please use a device with a camera.');
        } else if (err?.name === 'NotSupportedError') {
          setError('Your browser does not support camera access. Please use Chrome, Firefox, Safari, or Edge.');
        } else if (err?.name === 'SecurityError') {
          setError('Camera access requires a secure context (HTTPS). Please access this page over HTTPS.');
        } else {
          setError('Unable to access camera. Error: ' + (err?.message || 'Unknown error'));
        }
        setPermission('denied');
      } finally {
        isInitializingRef.current = false;
      }
    };

    requestCameraPermission();
  }, []);

  // Step 2: Initialize scanner AFTER permission is granted AND container exists
  useEffect(() => {
    if (permission !== 'granted' || !document.getElementById('qr-scanner-container')) {
      return;
    }

    const initializeScanner = async () => {
      if (scannerRef.current || isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        setError(null);
        
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
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          showHideButton: false,
          // Support QR codes only for better performance
          formatsToSupport: [{ format: 'QR_CODE', showLogs: false }],
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
      } catch (err: any) {
        console.error('Scanner initialization error:', err);
        setError('Unable to start scanner: ' + (err?.message || 'Unknown error'));
        setPermission('denied');
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch((err) => console.debug('Scanner stop error:', err));
      }
    };
  }, [permission]);

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
        fps: 15,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        showHideButton: false,
        formatsToSupport: [{ format: 'QR_CODE', showLogs: false }],
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
        scannerRef.current = null;
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
        scannerRef.current = null;
      } catch (err) {
        console.debug('Error stopping scanner:', err);
      }
    }
    setError(null);
    setPermission('pending');
    setIsScanning(false);
    isInitializingRef.current = false;
    deviceIdRef.current = null;

    // Restart the permission request
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
    } catch (err: any) {
      console.error('Camera permission error on retry:', err);
      setError('Unable to access camera. Please check your device and browser settings.');
      setPermission('denied');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      
      // Use html5-qrcode's scanFile method for image-based QR code detection
      const html5QrCode = new Html5Qrcode('qr-scanner-container');
      const decodedText = await html5QrCode.scanFile(file, true);
      
      // Process the QR code same way as camera scanning
      await handleQRCodeScanned(decodedText);
    } catch (err: any) {
      console.error('File upload QR scan error:', err);
      setError('Invalid QR code image. Please upload a clear image of a Scandee vendor QR code.');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

            {/* Bottom instruction and upload button */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-4 py-8 text-center">
              <p className="text-sm text-white mb-4">Position the QR code within the frame</p>
              <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-white cursor-pointer transition-colors text-sm font-medium">
                <span>📷 Choose from Gallery</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload QR code image"
                />
              </label>
            </div>
          </div>
        )}

        {/* Error state with fallback file upload */}
        {error && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 px-4 py-8">
            <div className="rounded-3xl bg-rose-50 p-6 max-w-sm mx-auto text-center">
              <h3 className="text-lg font-semibold text-rose-900">Unable to Scan</h3>
              <p className="mt-3 text-sm text-rose-700">{error}</p>
              
              {/* Fallback file upload option */}
              <div className="mt-5 border-t border-rose-200 pt-5">
                <p className="text-xs font-semibold text-rose-800 mb-3">FALLBACK OPTION</p>
                <label className="flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 cursor-pointer transition-colors">
                  <span>📷 Upload QR Code Image</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload QR code image"
                  />
                </label>
                <p className="mt-2 text-xs text-rose-600">Upload a photo or screenshot of a QR code</p>
              </div>

              <button
                onClick={handleRetry}
                className="mt-4 w-full rounded-2xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
              >
                Try Camera Again
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
          <div className="rounded-3xl bg-white p-6 max-w-sm mx-auto text-center">
            <h3 className="text-lg font-semibold text-slate-900">Cart from Different Vendor</h3>
            <p className="mt-3 text-sm text-slate-600">You already have items from another vendor. Clear your cart first?</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPendingStorePath(null);
                  setIsScanning(true);
                  restartScanning();
                }}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-50"
              >
                Keep Scanning
              </button>
              <button
                onClick={() => {
                  clear();
                  if (pendingStorePath) {
                    router.push(pendingStorePath);
                  }
                }}
                className="rounded-2xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
