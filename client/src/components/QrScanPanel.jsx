import { useCallback, useEffect, useRef, useState } from 'react';
import { QrCode, Camera, X } from 'lucide-react';
import { extractInstitutionSlug } from '../lib/qrDestination';

// The citizen's entry point is the camera: they scan whatever institution QR is
// in front of them, and only then does that institution's information appear.
// Nothing is shown before a scan, so no office is treated as the default.
function QrScanPanel({ onSlug }) {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [manualValue, setManualValue] = useState('');
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
    setStatus('');
  }, []);

  const handleValue = useCallback(
    (rawValue) => {
      const slug = extractInstitutionSlug(rawValue);
      if (!slug) {
        setError('That QR code is not an SACCFP institution code. Try another one.');
        return;
      }

      controlsRef.current?.stop();
      controlsRef.current = null;
      setIsScanning(false);
      setStatus('');
      onSlug(slug);
    },
    [onSlug],
  );

  useEffect(() => {
    if (!isScanning) {
      return undefined;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot open the camera. Use Chrome or Safari on your phone.');
      setIsScanning(false);
      return undefined;
    }

    let isActive = true;
    setError('');
    setStatus('Allow camera access, then hold the QR code inside the frame.');

    import('@zxing/browser')
      .then(({ BrowserQRCodeReader }) => {
        if (!isActive) {
          return null;
        }

        const reader = new BrowserQRCodeReader();
        return reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (isActive && result) {
              handleValue(result.getText());
            }
          },
        );
      })
      .then((controls) => {
        if (!controls) {
          return;
        }
        if (!isActive) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus('Camera is ready. Point it at the institution QR code.');
      })
      .catch((startError) => {
        if (!isActive) {
          return;
        }
        const message = String(startError?.message ?? '').toLowerCase();
        setError(
          message.includes('permission')
            ? 'Camera permission was denied. Allow camera access and try again.'
            : 'The camera could not start. Open this page over HTTPS or on localhost.',
        );
        setStatus('');
        setIsScanning(false);
      });

    return () => {
      isActive = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [handleValue, isScanning]);

  return (
    <section className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
        <QrCode className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-black text-slate-900">Scan an institution QR code</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Point your phone camera at the QR code displayed at any government office to see its
        services, official fees, working hours, and the staff responsible.
      </p>

      {isScanning ? (
        <div className="mt-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <video ref={videoRef} className="h-64 w-full object-cover md:h-80" playsInline muted />
            <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" />
          </div>
          <button
            type="button"
            onClick={stopScanner}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Stop camera
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError('');
            setIsScanning(true);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500"
        >
          <Camera className="h-4 w-4" />
          Open camera & scan
        </button>
      )}

      {status ? <p className="mt-4 text-xs font-semibold text-slate-500">{status}</p> : null}
      {error ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
          {error}
        </p>
      ) : null}

      {/* Laptops used for review often have no usable camera, so the code can also be typed. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleValue(manualValue);
        }}
        className="mt-7 border-t border-slate-100 pt-5"
      >
        <label className="block text-left">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            No camera? Enter the code under the QR
          </span>
          <div className="mt-2 flex gap-2">
            <input
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="e.g. kacyiru-sector-office"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-300 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!manualValue.trim()}
              className="shrink-0 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Open
            </button>
          </div>
        </label>
      </form>
    </section>
  );
}

export default QrScanPanel;
