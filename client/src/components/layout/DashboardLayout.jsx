import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const adminRoles = new Set(['national_admin', 'oversight_admin']);
const managementRoles = new Set([
  'institution_officer',
  'province_leader',
  'district_leader',
  'sector_leader',
  'cell_leader',
  'village_leader',
  'national_admin',
  'oversight_admin',
]);
const inviteRoles = new Set([
  'national_admin',
  'province_leader',
  'district_leader',
  'sector_leader',
  'cell_leader',
]);
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

function dashboardLinkClass({ isActive }) {
  return [
    'block rounded-xl px-4 py-3 text-sm font-semibold transition',
    isActive ? 'bg-gold text-ink' : 'text-white/90 hover:bg-white/10',
  ].join(' ');
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = user?.role ?? 'citizen';
  const isCitizenRole = role === 'citizen';

  const dashboardLinks = isCitizenRole
    ? [
        { to: '/dashboards', label: 'Dashboard Home' },
        { to: '/dashboard/citizen', label: 'My Dashboard' },
        { to: '/dashboard/citizen/submit', label: 'Submit Issue' },
        { to: '/dashboard/citizen/services', label: 'Service Explorer' },
        { to: '/dashboard/citizen/leaders', label: 'Leaders and Roles' },
      ]
    : [
        { to: '/dashboards', label: 'Dashboard Home' },
        ...(role === 'citizen' || adminRoles.has(role)
          ? [{ to: '/dashboard/citizen', label: 'Citizen View' }]
          : []),
        ...(managementRoles.has(role) ? [{ to: '/dashboard/officer', label: 'Level Management' }] : []),
        ...(adminRoles.has(role) ? [{ to: '/dashboard/admin', label: 'Admin Oversight' }] : []),
        ...(inviteRoles.has(role) ? [{ to: '/register/invite', label: 'Invite Setup' }] : []),
      ];

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-mist">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-ink px-5 py-6 text-white lg:block">
          <p className="font-display text-2xl font-black uppercase tracking-[0.06em]">Citizen First</p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-gold">
            {levelWorkspaceLabels[role] ?? 'Dashboard Console'}
          </p>

          <nav className="mt-8 space-y-2">
            {dashboardLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className={dashboardLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-3 text-sm font-bold text-white"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <div className="flex-1">
          <header className="border-b border-ink/10 bg-white">
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
            <div className="border-b border-ink/10 bg-ink px-4 py-4 lg:hidden">
              <nav className="space-y-2">
                {dashboardLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={dashboardLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ) : null}

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
