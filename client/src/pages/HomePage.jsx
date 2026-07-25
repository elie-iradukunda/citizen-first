import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';
import { normalizeQrDestination } from '../lib/qrDestination';

const processSteps = [
  {
    title: 'Scan institution QR',
    description: 'Citizen opens the office service page from the QR code.',
  },
  {
    title: 'View public information',
    description: 'Services, staff, schedules, fees, and required documents become visible.',
  },
  {
    title: 'Report corruption with evidence',
    description: 'Report bribery, unofficial fees, or abuse of authority to RIB with a case ID.',
  },
];

function HomePage() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanError, setScanError] = useState('');
  const [lastQrValue, setLastQrValue] = useState('');
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = useMemo(() => getRoleDashboardPath(user?.role), [user?.role]);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScannerOpen(false);
    setScanStatus('');
  }, []);

  const openScanner = useCallback(() => {
    setLastQrValue('');
    setScanError('');
    setScanStatus('Starting camera scanner...');
    setScannerOpen(true);
  }, []);

  const handleQrValue = useCallback(
    (rawValue) => {
      const destination = normalizeQrDestination(rawValue);
      setLastQrValue(rawValue);

      if (!destination) {
        setScanError('QR code detected, but it is not an SACCFP institution QR.');
        setScanStatus('Point the camera to a SACCFP institution QR code.');
        return;
      }

      controlsRef.current?.stop();
      controlsRef.current = null;
      setScannerOpen(false);
      setScanStatus('QR detected. Opening institution public information...');
      navigate(destination);
    },
    [navigate],
  );

  useEffect(() => {
    const openFromNavigation = () => {
      window.sessionStorage.removeItem('saccfp_open_scanner');
      openScanner();
    };

    window.addEventListener('saccfp:start-scan', openFromNavigation);

    const shouldOpenFromHash =
      location.hash === '#scan' || window.sessionStorage.getItem('saccfp_open_scanner') === 'true';
    if (shouldOpenFromHash) {
      openFromNavigation();
    }

    return () => {
      window.removeEventListener('saccfp:start-scan', openFromNavigation);
    };
  }, [location.hash, openScanner]);

  useEffect(() => {
    if (!scannerOpen) {
      return undefined;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('This browser does not support camera scanning. Use Chrome/Safari on phone or open the demo QR info.');
      setScanStatus('');
      return undefined;
    }

    let isActive = true;
    setScanError('');
    setScanStatus('Allow camera access, then point your phone at the institution QR code.');

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
          if (!isActive || !result) {
            return;
          }

          handleQrValue(result.getText());
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
        setScanStatus('Camera is ready. Hold the QR code inside the frame.');
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        const message = String(error?.message ?? '');
        setScanError(
          message.toLowerCase().includes('permission')
            ? 'Camera permission was denied. Allow camera access and try again.'
            : 'Camera scanner could not start. Use HTTPS/localhost and a browser with camera access.',
        );
        setScanStatus('');
      });

    return () => {
      isActive = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [handleQrValue, scannerOpen]);

  return (
    <div className="bg-[#f5f8fc] text-slate-900">
      <section
        id="scan"
        className="mx-auto grid min-h-[calc(100vh-150px)] max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8"
      >
        <div>
          <p className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
            SACCFP - QR anti-corruption reporting
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">
            Scan, then report corruption to RIB with evidence.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
            SACCFP is a QR-based anti-corruption platform. A citizen scans an institution QR code, sees the
            official services and fees, and reports bribery, unofficial payments, or abuse of authority to RIB
            with evidence. Every corruption report is tracked with a case ID, a deadline, and independent review.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openScanner}
              className="inline-flex items-center gap-3 rounded-lg bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-500"
            >
              <QrCodeIcon className="h-5 w-5" />
              Scan Institutional Service
            </button>
            <Link
              to={isAuthenticated ? dashboardPath : '/login?redirect=%2Fdashboard%2Fcitizen%2Fscan-services'}
              className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Login'}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {scannerOpen || scanError || lastQrValue ? (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                    Phone camera scanner
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Scan the institution QR code</h2>
                </div>
                {scannerOpen ? (
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-brand-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Stop
                  </button>
                ) : null}
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                {scannerOpen ? (
                  <video
                    ref={videoRef}
                    className="h-72 w-full object-cover"
                    muted
                    playsInline
                    autoPlay
                  />
                ) : (
                  <div className="grid h-48 place-items-center px-6 text-center text-sm font-semibold text-slate-300">
                    Camera is not active.
                  </div>
                )}
              </div>

              {scanStatus ? <p className="mt-4 text-sm font-medium text-slate-600">{scanStatus}</p> : null}
              {scanError ? <p className="mt-4 text-sm font-medium text-rose-600">{scanError}</p> : null}
              {lastQrValue ? (
                <p className="mt-3 break-all rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Last QR value: {lastQrValue}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                {!scannerOpen ? (
                  <button
                    type="button"
                    onClick={openScanner}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
                  >
                    <QrCodeIcon className="h-4 w-4" />
                    Try Camera Again
                  </button>
                ) : null}
                <Link
                  to="/institutions/kacyiru-sector-office#info"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-600"
                >
                  Open Kacyiru Demo QR Info
                </Link>
                {!isAuthenticated ? (
                  <Link
                    to="/register/citizen"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-600"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Create Account
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Citizen entry</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Institution QR access</h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
              <QrCodeIcon className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {['Camera opens on phone', 'QR opens public service info', 'Account is used for reporting'].map(
              (item, index) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
                    Step {index + 1}
                  </p>
                  <p className="mt-1.5 font-semibold text-slate-800">{item}</p>
                </div>
              ),
            )}
          </div>

          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="mt-0.5 h-6 w-6 text-brand-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Simple presentation flow</h3>
                <p className="mt-1.5 text-sm leading-7 text-slate-600">
                  Scan the office QR, view public service information, create an account only when
                  reporting corruption or poor service, then track RIB follow-up.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-3 lg:px-8">
          {processSteps.map((step, index) => (
            <article key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
              </p>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Contact us</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Need help creating an account?</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Contact support if registration, login, or QR access does not work during the presentation.
            </p>
          </div>
          <div className="grid gap-3 text-sm font-semibold text-slate-700">
            <a href="tel:+250788300210" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 hover:border-brand-200 hover:text-brand-600">
              <PhoneIcon className="h-4 w-4 text-brand-600" />
              +250 788 300 210
            </a>
            <a href="mailto:support@saccfp.rw" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 hover:border-brand-200 hover:text-brand-600">
              <EnvelopeIcon className="h-4 w-4 text-brand-600" />
              support@saccfp.rw
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
