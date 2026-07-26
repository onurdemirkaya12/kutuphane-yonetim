import React, { useEffect, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onResult: (isbn: string) => void;
}

export function BarcodeScanner({ onResult }: BarcodeScannerProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let html5Qrcode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        html5Qrcode = new Html5Qrcode("isbn-reader");
        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13]
          },
          (decodedText) => {
            if (isMounted && html5Qrcode?.isScanning) {
              html5Qrcode.pause(true); // Pause scanning to prevent multiple triggers
              onResult(decodedText);
            }
          },
          undefined // Ignore frame scan errors
        );

        if (!isMounted) {
          // If the component was unmounted while the camera was starting up
          await html5Qrcode.stop();
          html5Qrcode.clear();
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (isMounted) {
          setErrorMsg("Kameraya erişilemedi veya izin verilmedi.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5Qrcode) {
        if (html5Qrcode.isScanning) {
          html5Qrcode.stop().then(() => {
            html5Qrcode?.clear();
          }).catch(console.error);
        } else if (html5Qrcode.getState() === 2) { // 2 = PAUSED
           html5Qrcode.stop().then(() => {
            html5Qrcode?.clear();
          }).catch(console.error);
        }
      }
    };
  }, [onResult]);

  return (
    <div className="w-full bg-stone-900 rounded-xl overflow-hidden relative min-h-[250px] flex items-center justify-center border border-stone-800">
      {errorMsg ? (
        <p className="text-red-400 text-sm p-4 text-center">{errorMsg}</p>
      ) : (
        <div id="isbn-reader" className="w-full h-full" />
      )}
    </div>
  );
}
