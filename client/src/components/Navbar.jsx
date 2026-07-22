import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, PhoneIcon, QrCodeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const dashboardPath = getRoleDashboardPath(user?.role);

  const requestScan = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('saccfp_open_scanner', 'true');
      window.dispatchEvent(new Event('saccfp:start-scan'));
    }
    setMobileOpen(false);
  };

  const onLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const primaryLink = 'rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500';
  const ghostLink = 'rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur">
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs lg:px-8">
          <span className="font-bold uppercase tracking-[0.18em] text-brand-700">SACCFP</span>
          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <span className="inline-flex items-center gap-1">
              <PhoneIcon className="h-4 w-4 text-brand-600" />
              Account help: +250 788 300 210
            </span>
            <span>Anti-Corruption 997</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white shadow-soft">
            SA
          </div>
          <div>
            <p className="text-xl font-black uppercase tracking-[0.06em] text-slate-900">SACCFP</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              Scan - Account - Report
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          <Link to="/#scan" onClick={requestScan} className={`inline-flex items-center gap-2 ${ghostLink}`}>
            <QrCodeIcon className="h-4 w-4 text-brand-600" />
            Scan Service
          </Link>
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath} className={ghostLink}>Dashboard</Link>
              <button type="button" onClick={onLogout} className={primaryLink}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/register/citizen" className={ghostLink}>Create Account</Link>
              <Link to="/login?redirect=%2Fdashboard%2Fcitizen%2Fscan-services" className={primaryLink}>Login</Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <nav className="grid gap-2">
            <Link to="/#scan" onClick={requestScan} className={ghostLink}>Scan Service</Link>
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className={ghostLink}>Dashboard</Link>
                <button type="button" onClick={onLogout} className={`text-left ${primaryLink}`}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/register/citizen" onClick={() => setMobileOpen(false)} className={ghostLink}>Create Account</Link>
                <Link to="/login?redirect=%2Fdashboard%2Fcitizen%2Fscan-services" onClick={() => setMobileOpen(false)} className={primaryLink}>Login</Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
