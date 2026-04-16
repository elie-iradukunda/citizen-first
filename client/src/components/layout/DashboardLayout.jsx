import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  canAccessInviteSetup,
  getRoleDashboardPath,
  isAdminDashboardRole,
  isCitizenDashboardRole,
} from '../../lib/authRouting';

const levelWorkspaceLabels = {
  national_admin: 'National Governance Command',
  oversight_admin: 'Oversight and Compliance Center',
  province_leader: 'Province Leadership Console',
  district_leader: 'District Operations Console',
  sector_leader: 'Sector Service Console',
  cell_leader: 'Cell Frontline Console',
  village_leader: 'Village Coordination Console',
  institution_officer: 'Institution Officer Console',
  citizen: 'Citizen Self-Service Dashboard',
};

function buildDashboardLinkClass(isActive) {
  return [
    'block rounded-xl px-4 py-3 text-sm font-semibold transition',
    isActive ? 'bg-gold text-ink' : 'text-white/90 hover:bg-white/10',
  ].join(' ');
}

function isDashboardLinkActive(item, location) {
  const [pathname, hashFragment] = item.to.split('#');

  if (location.pathname !== pathname) {
    return false;
  }

  if (hashFragment) {
    return location.hash === `#${hashFragment}`;
  }

  return !location.hash;
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = user?.role ?? 'citizen';
  const dashboardHomePath = getRoleDashboardPath(role);

  const dashboardLinks = isCitizenDashboardRole(role)
    ? [
        { to: dashboardHomePath, label: 'Dashboard Home' },
        { to: '/dashboard/citizen/submit', label: 'Submit Issue' },
        { to: '/dashboard/citizen/services', label: 'Service Explorer' },
        { to: '/dashboard/citizen/leaders', label: 'Leaders and Roles' },
      ]
    : isAdminDashboardRole(role)
      ? [
          { to: '/dashboard/admin', label: 'Admin Overview' },
          { to: '/dashboard/admin#system-alerts', label: 'System Alerts' },
          { to: '/dashboard/admin#province-reports', label: 'Province Reports' },
          { to: '/dashboard/admin#issue-types', label: 'Issue Types' },
          { to: '/dashboard/admin#national-feed', label: 'National Reports' },
          { to: '/dashboard/admin#registration-hierarchy', label: 'Hierarchy Coverage' },
          ...(canAccessInviteSetup(role) ? [{ to: '/register/invite', label: 'Invite Setup' }] : []),
        ]
      : [
          { to: dashboardHomePath, label: 'Overview' },
          { to: `${dashboardHomePath}#cases`, label: 'Case Queue' },
          { to: `${dashboardHomePath}#territory`, label: 'Territory Explorer' },
          { to: `${dashboardHomePath}#team`, label: 'Team Watch' },
          { to: `${dashboardHomePath}#institution-admin`, label: 'Institution Admin' },
          ...(canAccessInviteSetup(role) ? [{ to: '/register/invite', label: 'Invite Setup' }] : []),
        ];

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderDashboardLink = (item) => (
    <Link
      key={item.to}
      to={item.to}
      onClick={() => setMobileMenuOpen(false)}
      className={buildDashboardLinkClass(isDashboardLinkActive(item, location))}
    >
      {item.label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-mist">
      <div className="flex min-h-screen lg:items-start">
        <aside className="hidden w-72 shrink-0 self-start bg-ink px-5 py-6 text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
          <p className="font-display text-2xl font-black uppercase tracking-[0.06em]">Citizen First</p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-gold">
            {levelWorkspaceLabels[role] ?? 'Dashboard Console'}
          </p>

          <nav className="mt-8 space-y-2">{dashboardLinks.map((item) => renderDashboardLink(item))}</nav>

          <button
            type="button"
            onClick={onLogout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-3 text-sm font-bold text-white"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Authenticated Dashboard</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {user?.fullName} ({user?.role})
                </p>
                {user?.level ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                    Level: {user.level}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink"
                >
                  Public Site
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white"
                >
                  Logout
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className="rounded-md border border-ink/15 p-2 text-ink lg:hidden"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </header>

          {mobileMenuOpen ? (
            <div className="sticky top-[73px] z-20 border-b border-ink/10 bg-ink px-4 py-4 lg:hidden">
              <nav className="space-y-2">{dashboardLinks.map((item) => renderDashboardLink(item))}</nav>
            </div>
          ) : null}

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
