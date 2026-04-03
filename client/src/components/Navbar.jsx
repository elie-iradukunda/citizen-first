import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { publicNavLinks } from '../data/publicContent';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';

function linkClassName({ isActive }) {
  return [
    'rounded-md px-3 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-colors',
    isActive ? 'bg-gold text-ink' : 'text-ink hover:bg-ink/10',
  ].join(' ');
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const dashboardPath = getRoleDashboardPath(user?.role);
  const primaryNavLinks = publicNavLinks.filter((item) => !item.to.startsWith('/login'));

  const onLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink/20 bg-white/95 shadow-sm backdrop-blur">
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold uppercase tracking-[0.12em] text-gold">Citizen First</span>
            <span>Public Service Support Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <PhoneIcon className="h-4 w-4" />
              Emergency 112
            </span>
            <span>Anti-Corruption 997</span>
            {isAuthenticated ? (
              <span className="rounded-full border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
                Signed in
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-lg font-black text-white">
            CF
          </div>
          <div>
            <p className="font-display text-lg font-black uppercase tracking-[0.06em] text-ink">
              Citizen First
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">
              Service - Protection - Integrity
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNavLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                className="hidden rounded-full border border-ink/20 bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-mist md:inline-flex"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="hidden rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-pine md:inline-flex"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register/citizen"
                className="hidden rounded-full border border-ink/20 bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-mist md:inline-flex"
              >
                Join
              </Link>
              <Link
                to="/login?redirect=%2Fdashboards"
                className="hidden rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-pine md:inline-flex"
              >
                Login
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-md border border-ink/20 p-2 text-ink lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-ink/10 bg-white px-4 py-4 lg:hidden">
          <nav className="grid gap-2">
            {primaryNavLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={linkClassName}
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md bg-ink px-3 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md border border-ink/20 px-3 py-3 text-left text-sm font-bold uppercase tracking-[0.08em] text-ink"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register/citizen"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md border border-ink/20 px-3 py-3 text-sm font-bold uppercase tracking-[0.08em] text-ink"
                >
                  Join
                </Link>
                <Link
                  to="/login?redirect=%2Fdashboards"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md bg-ink px-3 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white"
                >
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
