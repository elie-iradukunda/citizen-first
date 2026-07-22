import {
  LayoutDashboard, QrCode, Send, ClipboardList, Search, Users, Wrench, Building2,
  UserCog, Link2, Inbox, ShieldCheck, Clock, CornerUpRight, Activity, CheckCircle2,
  Bell, ChevronDown, LogOut, Menu, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BRAND = { primary: '#087536', dark: '#075126' };

const levelWorkspaceLabels = {
  citizen: 'Citizen Reporting Dashboard',
  institution_admin: 'Institution Administration Dashboard',
  rib_officer_1: 'RIB Officer 1 Case Intake Dashboard',
  rib_officer_2: 'RIB Officer 2 Escalation Dashboard',
  institution_officer: 'RIB Workflow Review Dashboard',
  national_admin: 'RIB National Oversight Dashboard',
  oversight_admin: 'RIB National Oversight Dashboard',
  province_leader: 'Province Governance Review Dashboard',
  district_leader: 'District Governance Review Dashboard',
  sector_leader: 'Sector Governance Review Dashboard',
  cell_leader: 'Cell Governance Review Dashboard',
  village_leader: 'Village Governance Review Dashboard',
};

const dashboardLinksByRole = {
  citizen: [
    { to: '/dashboard/citizen', label: 'Dashboard Home', icon: LayoutDashboard },
    { to: '/dashboard/citizen/scan-services', label: 'Scan QR & Services', icon: QrCode },
    { to: '/dashboard/citizen/submit', label: 'Submit Report', icon: Send },
    { to: '/dashboard/citizen/reports', label: 'My Reports', icon: ClipboardList },
    { to: '/dashboard/citizen/track', label: 'Track Case', icon: Search },
  ],
  institution_admin: [
    { to: '/dashboard/institution', label: 'Dashboard Home', icon: LayoutDashboard },
    { to: '/dashboard/institution#services', label: 'Register Services', icon: Wrench },
    { to: '/dashboard/institution#departments', label: 'Departments', icon: Building2 },
    { to: '/dashboard/institution#staff', label: 'Register Staff', icon: UserCog },
    { to: '/dashboard/institution#linking', label: 'Link Staff to Services', icon: Link2 },
    { to: '/dashboard/institution#qr-code', label: 'Generate QR Code', icon: QrCode },
  ],
  rib_officer_1: [
    { to: '/dashboard/rib-officer-1', label: 'Dashboard Home', icon: LayoutDashboard },
    { to: '/dashboard/rib-officer-1#new-reports', label: 'New Reports', icon: Inbox },
    { to: '/dashboard/rib-officer-1#review-evidence', label: 'Review Evidence', icon: ShieldCheck },
    { to: '/dashboard/rib-officer-1#response-window', label: '3-Day Response', icon: Clock },
    { to: '/dashboard/rib-officer-1#respond', label: 'Respond to Citizen', icon: Send },
    { to: '/dashboard/rib-officer-1#escalate', label: 'Escalate to Officer 2', icon: CornerUpRight },
  ],
  rib_officer_2: [
    { to: '/dashboard/rib-officer-2', label: 'Dashboard Home', icon: LayoutDashboard },
    { to: '/dashboard/rib-officer-2#escalated-reports', label: 'Escalated Reports', icon: Inbox },
    { to: '/dashboard/rib-officer-2#overdue-cases', label: 'Overdue Cases', icon: Clock },
    { to: '/dashboard/rib-officer-2#final-review', label: 'Final Review', icon: ShieldCheck },
    { to: '/dashboard/rib-officer-2#status-update', label: 'Case Status Update', icon: Activity },
    { to: '/dashboard/rib-officer-2#follow-up', label: 'Follow-up Summary', icon: CheckCircle2 },
  ],
  national_admin: [
    { to: '/dashboard/admin', label: 'Dashboard Home', icon: LayoutDashboard },
    { to: '/dashboard/admin#institutions', label: 'Institutions', icon: Building2 },
    { to: '/dashboard/admin#cases', label: 'Citizen Reports', icon: Inbox },
    { to: '/dashboard/admin#citizens', label: 'Citizens', icon: Users },
    { to: '/register/invite', label: 'Register Institutions', icon: Link2 },
  ],
};

// RIB workflow-chain leaders and seeded governance leaders share the RIB
// Officer 1 review pages; national oversight roles share the admin pages.
dashboardLinksByRole.institution_officer = dashboardLinksByRole.rib_officer_1;
dashboardLinksByRole.oversight_admin = dashboardLinksByRole.national_admin;

// Governance leaders (province → village) both review cases on the officer
// pages AND own an institution, so their nav combines case review with the
// institution management (Settings) links.
const governanceLeaderLinks = [
  ...dashboardLinksByRole.rib_officer_1,
  { to: '/dashboard/institution', label: 'Manage Institution', icon: Building2 },
  { to: '/dashboard/institution#services', label: 'Register Services', icon: Wrench },
  { to: '/dashboard/institution#departments', label: 'Departments', icon: Building2 },
  { to: '/dashboard/institution#staff', label: 'Register Staff', icon: UserCog },
  { to: '/dashboard/institution#linking', label: 'Link Staff to Services', icon: Link2 },
  { to: '/dashboard/institution#qr-code', label: 'Institution QR Code', icon: QrCode },
];
dashboardLinksByRole.province_leader = governanceLeaderLinks;
dashboardLinksByRole.district_leader = governanceLeaderLinks;
dashboardLinksByRole.sector_leader = governanceLeaderLinks;
dashboardLinksByRole.cell_leader = governanceLeaderLinks;
dashboardLinksByRole.village_leader = governanceLeaderLinks;

function initials(name = '') {
  return name.split(' ').map((part) => part[0] || '').join('').slice(0, 2).toUpperCase();
}

function isDashboardLinkActive(item, location) {
  const [pathname, hashFragment] = item.to.split('#');
  if (hashFragment && location.pathname !== pathname) return false;
  if (hashFragment) return location.hash === `#${hashFragment}`;
  return location.pathname === pathname && !location.hash;
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = user?.role ?? 'citizen';
  const dashboardLinks = dashboardLinksByRole[role] ?? dashboardLinksByRole.citizen;
  const workspaceLabel = levelWorkspaceLabels[role] ?? 'Dashboard Console';

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!location.hash) return undefined;
    const targetId = decodeURIComponent(location.hash.slice(1));
    const timeoutId = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash, location.pathname]);

  const renderLink = (item) => {
    const Icon = item.icon;
    const active = isDashboardLinkActive(item, location);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
          active ? 'bg-white shadow-sm' : 'text-white/85 hover:bg-white/10 hover:text-white'
        }`}
        style={active ? { color: BRAND.primary } : undefined}
      >
        <Icon className="h-[17px] w-[17px]" />
        {item.label}
      </Link>
    );
  };

  const Brand = () => (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-black text-white">SA</span>
      <div>
        <p className="text-[13px] font-black tracking-wide text-white">SACCFP</p>
        <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/60">Anti-Corruption Platform</p>
      </div>
    </div>
  );

  const SidebarInner = () => (
    <div
      className="flex h-full flex-col text-white"
      style={{ background: `linear-gradient(180deg, ${BRAND.dark}, ${BRAND.primary})` }}
    >
      <div className="flex h-[76px] items-center border-b border-white/10 px-5"><Brand /></div>
      <p className="px-5 pt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">{workspaceLabel}</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{dashboardLinks.map(renderLink)}</nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[17px] w-[17px]" />Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="saccfp-dashboard min-h-screen bg-[#f5f8fc]">
      <div className="grid min-h-screen lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 lg:block"><SidebarInner /></aside>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
            <div className="relative h-full w-64 shadow-2xl">
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="absolute right-3 top-3 z-10 rounded-lg bg-white/10 p-2 text-white">
                <X className="h-5 w-5" />
              </button>
              <SidebarInner />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 lg:col-start-2">
          <header className="sticky top-0 z-30 h-[76px] border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-full items-center gap-4 px-4 sm:px-6 xl:px-8">
              <button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-lg border border-slate-200 p-2.5 text-slate-600 lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-slate-800">{workspaceLabel}</p>
                <p className="mt-0.5 text-xs text-slate-400">Smart Anti-Corruption &amp; Citizen Feedback Platform</p>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <Link to="/" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600 sm:inline-flex">
                  Public Site
                </Link>
                <button type="button" className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
                </button>
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: BRAND.primary }}>
                    {initials(user?.fullName)}
                  </span>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800">{user?.fullName}</p>
                    <p className="text-[10px] text-slate-400">{workspaceLabel}</p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0"><Outlet /></main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
