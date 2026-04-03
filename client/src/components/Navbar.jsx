import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { publicNavLinks } from '../data/publicContent';

function linkClassName({ isActive }) {
  return [
    'rounded-md px-3 py-2 text-sm font-bold uppercase tracking-[0.08em] transition',
    isActive ? 'bg-gold text-ink' : 'text-ink hover:bg-ink/10',
  ].join(' ');
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/20 bg-white shadow-sm">
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
              Service • Protection • Integrity
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {publicNavLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="hidden rounded-full border border-ink/20 bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-mist md:inline-flex"
          >
            Report
          </Link>
          <Link
            to="/assistant"
            className="hidden rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-pine md:inline-flex"
          >
            Ask AI
          </Link>

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
            {publicNavLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={linkClassName}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
