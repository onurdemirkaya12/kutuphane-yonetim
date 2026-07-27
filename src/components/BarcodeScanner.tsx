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
          { 
            facingMode: "environment",
            // @ts-ignore - advanced constraints like focusMode might not be typed
            advanced: [{ focusMode: "continuous" }]
          },
          {
            fps: 30, // FPS'yi artırdık, daha hızlı okuma yapacak
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Genişliği ekrana göre dinamik ayarla, barcode (ISBN) için yatay uzun bir kutu yap
              const width = Math.min(viewfinderWidth * 0.9, 450);
              const height = Math.min(viewfinderHeight * 0.4, 200);
              return { width, height };
            },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E
            ],
            // @ts-ignore - experimental özellikleri kullanarak cihazın kendi okuyucusunu (native) destekliyorsa onu kullanmasını sağlıyoruz (çok daha hızlıdır)
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          (decodedText) => {
            if (isMounted && html5Qrcode?.isScanning) {
              html5Qrcode.pause(true); // Pause scanning to prevent multiple triggers
              onResult(decodedText);
              
              // Çoklu tarama (bulk mode) için 2 saniye sonra otomatik devam et
              setTimeout(() => {
                if (isMounted && html5Qrcode) {
                  try {
                    // getState() !== 1 (NOT_STARTED) and not scanning
                    html5Qrcode.resume();
                  } catch (e) {
                    console.log("Resume error:", e);
                  }
                }
              }, 2000);
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
