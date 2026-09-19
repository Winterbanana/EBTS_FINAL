import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader';

  const stopScanningRef = useRef<() => Promise<void>>();

  useEffect(() => {
    const startScanning = async () => {
      try {
        const html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            setSuccess(true);
            onScan(decodedText);
            setTimeout(() => {
              stopScanningRef.current?.();
              onClose();
            }, 1000);
          },
          (errorMessage) => {
            // Ignore continuous scanning errors
          }
        );

        setScanning(true);
        setError('');
      } catch (err: any) {
        const errorMsg = err?.name === 'NotFoundError'
          ? 'No camera found. QR scanning requires a camera device.'
          : 'Failed to start camera. Please check camera permissions.';
        setError(errorMsg);
      }
    };

    const stopScanning = async () => {
      if (scannerRef.current) {
        try {
          const state = await scannerRef.current.getState();
          // Only stop if scanner is actually running
          if (state === 2) { // Html5QrcodeScannerState.SCANNING
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
          setScanning(false);
        } catch (err) {
          // Silently handle stop errors - scanner might not be running
        }
      }
    };

    stopScanningRef.current = stopScanning;

    startScanning();
    return () => {
      stopScanning();
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="text-lg">Scan QR Code</h3>
          </div>
          <button
            onClick={() => {
              stopScanningRef.current?.();
              onClose();
            }}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner */}
        <div className="p-4">
          <div
            id={qrRegionId}
            className="w-full rounded-lg overflow-hidden border-2 border-gray-300"
          />

          {/* Status Messages */}
          <div className="mt-4 space-y-2">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>QR Code scanned successfully!</span>
              </div>
            )}

            {scanning && !success && !error && (
              <div className="text-center text-sm text-gray-600">
                <p>Position the QR code within the frame</p>
                <p className="text-xs mt-1 text-gray-500">
                  The camera will scan automatically
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              stopScanningRef.current?.();
              onClose();
            }}
            className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
