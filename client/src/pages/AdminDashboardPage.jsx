import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardState from '../components/dashboard/DashboardState';
import SectionCard from '../components/dashboard/SectionCard';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import { fetchAdminDashboard } from '../lib/dashboardApi';
import { formatDateTime } from '../lib/time';

const ADMIN_SECTION_TABS = [
  { key: 'overview', label: 'Overview', hash: '' },
  { key: 'reports', label: 'Province Reports', hash: '#province-reports' },
  { key: 'issues', label: 'Issue Types', hash: '#issue-types' },
  { key: 'feed', label: 'National Reports', hash: '#national-feed' },
  { key: 'hierarchy', label: 'Hierarchy Coverage', hash: '#registration-hierarchy' },
];

const HASH_TO_SECTION = {
  '': 'overview',
  '#system-alerts': 'overview',
  '#province-reports': 'reports',
  '#issue-types': 'issues',
  '#national-feed': 'feed',
  '#registration-hierarchy': 'hierarchy',
};

function sectionLinkClass(isActive) {
  return [
    'rounded-full px-4 py-2 text-sm font-bold transition',
    isActive ? 'bg-ink text-white' : 'border border-ink/15 bg-white text-ink hover:bg-mist',
  ].join(' ');
}

function AdminDashboardPage() {
  const location = useLocation();
  const sectionNavRef = useRef(null);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeSection, setActiveSection] = useState(
    HASH_TO_SECTION[location.hash] ?? 'overview',
  );

  useEffect(() => {
    let isActive = true;

    fetchAdminDashboard()
      .then((payload) => {
        if (isActive) {
          setDashboard(payload);
          setHasError(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setActiveSection(HASH_TO_SECTION[location.hash] ?? 'overview');
  }, [location.hash]);

  useEffect(() => {
    if (!dashboard || !location.hash) {
      return;
    }

    const handle = window.requestAnimationFrame(() => {
      sectionNavRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(handle);
  }, [dashboard, location.hash]);

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Loading admin dashboard"
            description="Building oversight metrics, province-wide reports, and invite governance views."
          />
        </section>
      </div>
    );
  }

  if (hasError || !dashboard) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Admin dashboard unavailable"
            description="Oversight metrics could not be loaded. Verify the dashboard API and try again."
          />
        </section>
      </div>
    );
  }

  const provinceReports = dashboard.provinceReports ?? [];
  const locationHotspots = dashboard.locationHotspots ?? [];
  const institutionPerformance = dashboard.institutionPerformance ?? [];
  const nationalCoverage = dashboard.nationalCoverage ?? [];
  const issuePortfolio = dashboard.issuePortfolio ?? [];
  const issueCategories = dashboard.issueCategories ?? [];
  const reportingModes = dashboard.reportingModes ?? [];
  const recentReports = dashboard.recentReports ?? [];
  const inviteOverview = dashboard.inviteOverview ?? [];
  const recentInvites = dashboard.recentInvites ?? [];
  const hierarchyCoverage = dashboard.registrationHierarchy?.coverageByProvince ?? [];
  const hierarchyByLevel = dashboard.registrationHierarchy?.byLevel ?? {};

  const overviewPanel = (
    <div id="system-alerts" className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <SectionCard title="System alerts" subtitle="Critical national signals requiring immediate attention.">
        <div className="space-y-3">
          {dashboard.alerts.map((item) => (
            <article key={item.title} className="rounded-2xl bg-mist p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">{item.title}</p>
                <StatusBadge value={item.severity} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate">{item.detail}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="National command coverage"
        subtitle="Full-country visibility the national admin can act on immediately."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nationalCoverage.map((item) => (
            <article key={item.label} className="rounded-2xl bg-mist p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{item.label}</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const reportsPanel = (
    <div id="province-reports" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Province-wide complaint report"
          subtitle="National view of active, overdue, escalated, resolved, and corruption-risk cases across provinces."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                  <th className="pb-3">Province</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Active</th>
                  <th className="pb-3">Overdue</th>
                  <th className="pb-3">Escalated</th>
                  <th className="pb-3">Corruption</th>
                  <th className="pb-3">Resolved</th>
                  <th className="pb-3">District Coverage</th>
                </tr>
              </thead>
              <tbody>
                {provinceReports.map((item) => (
                  <tr key={item.province} className="border-b border-ink/10">
                    <td className="py-4 font-semibold text-ink">{item.province}</td>
                    <td className="py-4 text-slate">{item.totalIssues}</td>
                    <td className="py-4 text-slate">{item.activeIssues}</td>
                    <td className="py-4 text-slate">{item.overdueIssues}</td>
                    <td className="py-4 text-slate">{item.escalatedIssues}</td>
                    <td className="py-4 text-slate">{item.corruptionIssues}</td>
                    <td className="py-4 text-slate">{item.resolvedIssues}</td>
                    <td className="py-4 text-slate">
                      {item.registeredDistricts}/{item.expectedDistricts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Location hotspots"
          subtitle="Highest-risk provinces based on corruption, overdue, and escalated complaint load."
        >
          <div className="space-y-3">
            {locationHotspots.length > 0 ? (
              locationHotspots.map((item) => (
                <article key={item.province} className="rounded-2xl bg-mist p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{item.province}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-clay">Hotspot</p>
                  </div>
                  <p className="mt-2 text-sm text-slate">
                    Active: {item.activeIssues} | Overdue: {item.overdueIssues} | Escalated:{' '}
                    {item.escalatedIssues}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
                </article>
              ))
            ) : (
              <article className="rounded-2xl bg-mist p-4 text-sm text-slate">
                No hotspot locations detected yet.
              </article>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Institution performance"
        subtitle="Operational quality by office currently appearing in the national complaint feed."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                <th className="pb-3">Institution</th>
                <th className="pb-3">Province</th>
                <th className="pb-3">Level</th>
                <th className="pb-3">Open</th>
                <th className="pb-3">Overdue</th>
                <th className="pb-3">Resolved</th>
                <th className="pb-3">SLA score</th>
              </tr>
            </thead>
            <tbody>
              {institutionPerformance.map((item) => (
                <tr key={item.institution} className="border-b border-ink/10">
                  <td className="py-4 font-semibold text-ink">{item.institution}</td>
                  <td className="py-4 text-slate">{item.province}</td>
                  <td className="py-4 text-slate">{item.level}</td>
                  <td className="py-4 text-slate">{item.openCases}</td>
                  <td className="py-4 text-slate">{item.overdueCases}</td>
                  <td className="py-4 text-slate">{item.resolvedCases}</td>
                  <td className="py-4 text-slate">{item.slaScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );

  const issuesPanel = (
    <div id="issue-types" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Issue portfolio"
          subtitle="Classified issue mix for corruption, service delivery, abuse, and response gaps."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {issuePortfolio.map((item) => (
              <article key={item.key} className="rounded-2xl bg-mist p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-2xl font-black text-ink">{item.label}</p>
                  <p className="text-sm font-bold text-slate">{item.percentage}%</p>
                </div>
                <p className="mt-3 font-display text-4xl font-black text-ink">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Issue categories"
          subtitle="Detailed issue-type count across the full national monitoring dataset."
        >
          <div className="space-y-4">
            {issueCategories.map((item) => (
              <article key={item.category}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{item.category}</p>
                    <p className="text-sm text-slate">{item.classification}</p>
                  </div>
                  <p className="text-sm text-slate">
                    {item.count} reports | {item.percentage}%
                  </p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-mist">
                  <div
                    className="h-2 rounded-full bg-tide"
                    style={{ width: `${Math.max(item.percentage, 8)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Reporting modes" subtitle="How citizens are raising issues nationwide.">
          <div className="grid gap-4 md:grid-cols-2">
            {reportingModes.map((item) => (
              <article key={item.mode} className="rounded-2xl bg-mist p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{item.mode}</p>
                <p className="mt-3 font-display text-3xl font-black text-ink">{item.count}</p>
                <p className="mt-2 text-sm text-slate">{item.percentage}% of all reports</p>
                <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Distribution by current level"
          subtitle="Active complaints currently spread across the escalation chain."
        >
          <div className="space-y-4">
            {dashboard.distributionByLevel.map((item) => (
              <article key={item.level}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold capitalize text-ink">{item.level}</p>
                  <p className="text-sm text-slate">{item.count} active</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-mist">
                  <div
                    className="h-2 rounded-full bg-tide"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );

  const feedPanel = (
    <div id="national-feed" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SectionCard
        title="Recent national reports"
        subtitle="Latest issue records from different provinces, institutions, and report types."
      >
        <div className="space-y-3">
          {recentReports.map((item) => (
            <article key={item.id} className="rounded-2xl bg-mist p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-black text-ink">{item.id}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.category}</p>
                </div>
                <StatusBadge value={item.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate sm:grid-cols-2">
                <p>Province: {item.province}</p>
                <p>District: {item.district}</p>
                <p>Institution: {item.institution}</p>
                <p>Level: {item.currentLevel}</p>
                <p>Classification: {item.classification}</p>
                <p>Mode: {item.reportingMode}</p>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-tide">
                Submitted {formatDateTime(item.submittedAt)} | Deadline {formatDateTime(item.deadlineAt)}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Compliance insights"
        subtitle="Policy, privacy, and investigation-quality indicators for the national office."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {dashboard.compliance.map((item) => (
            <article key={item.title} className="rounded-2xl bg-mist p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{item.title}</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const hierarchyPanel = (
    <div id="registration-hierarchy" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Invite governance"
          subtitle="National control of next-level onboarding and invite completion."
          headerAction={
            <Link
              to="/register/invite"
              className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
            >
              Create Invite
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {inviteOverview.map((item) => (
              <article key={item.label} className="rounded-2xl bg-mist p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{item.label}</p>
                <p className="mt-3 font-display text-3xl font-black text-ink">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-tide">Recent invite activity</p>
            {recentInvites.length > 0 ? (
              recentInvites.map((item) => (
                <article key={item.inviteId} className="rounded-2xl bg-mist p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{item.institutionNameHint}</p>
                      <p className="mt-1 text-sm text-slate">
                        {item.targetLevel} | {item.province} | {item.district}
                      </p>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-tide">
                    Created {formatDateTime(item.createdAt)} | Expires {formatDateTime(item.expiresAt)}
                  </p>
                </article>
              ))
            ) : (
              <article className="rounded-2xl bg-mist p-4 text-sm text-slate">
                No invite records yet. National admin can create province-level invites from Invite Setup.
              </article>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Registered hierarchy summary"
          subtitle="Live registration progress from province offices down to village structures."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl bg-mist p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Total Institutions</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">
                {dashboard.registrationHierarchy.totalInstitutions}
              </p>
              <p className="mt-2 text-sm text-slate">All offices registered into the hierarchy tree.</p>
            </article>
            <article className="rounded-2xl bg-mist p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Province Coverage</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">
                {dashboard.registrationHierarchy.registeredProvinces}/
                {dashboard.registrationHierarchy.expectedProvinces}
              </p>
              <p className="mt-2 text-sm text-slate">Province offices currently connected to the platform.</p>
            </article>
            {Object.entries(hierarchyByLevel).map(([level, count]) => (
              <article key={level} className="rounded-2xl bg-mist p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{level}</p>
                <p className="mt-3 font-display text-3xl font-black text-ink">{count}</p>
                <p className="mt-2 text-sm text-slate">
                  Registered {level}-level institutions inside the national hierarchy.
                </p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Province registration coverage"
        subtitle="Coverage view for province office registration and lower-level structure readiness."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                <th className="pb-3">Province</th>
                <th className="pb-3">Province Office</th>
                <th className="pb-3">Districts</th>
                <th className="pb-3">Sectors</th>
                <th className="pb-3">Cells</th>
                <th className="pb-3">Villages</th>
                <th className="pb-3">Leaders</th>
              </tr>
            </thead>
            <tbody>
              {hierarchyCoverage.map((item) => (
                <tr key={item.province} className="border-b border-ink/10">
                  <td className="py-4 font-semibold text-ink">{item.province}</td>
                  <td className="py-4">
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]',
                        item.provinceOfficeRegistered
                          ? 'bg-pine/15 text-pine'
                          : 'bg-gold/30 text-ink',
                      ].join(' ')}
                    >
                      {item.provinceOfficeRegistered ? 'Registered' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 text-slate">
                    {item.districtsRegistered}/{item.expectedDistricts}
                  </td>
                  <td className="py-4 text-slate">{item.sectorsRegistered}</td>
                  <td className="py-4 text-slate">{item.cellsRegistered}</td>
                  <td className="py-4 text-slate">{item.villagesRegistered}</td>
                  <td className="py-4 text-slate">{item.leadersRegistered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );

  const activePanel = {
    overview: overviewPanel,
    reports: reportsPanel,
    issues: issuesPanel,
    feed: feedPanel,
    hierarchy: hierarchyPanel,
  }[activeSection];

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">National Admin Dashboard</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
              National command center without long-page fatigue
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
              Keep the important national metrics visible, then switch between smaller report panels instead of
              scrolling one very long dashboard from top to bottom.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-ink/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink">
              Generated {formatDateTime(dashboard.generatedAt)}
            </div>
            <Link
              to="/register/invite"
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
            >
              Invite Province Leader
            </Link>
            <Link
              to="/dashboard/admin#province-reports"
              className="rounded-full border border-ink/20 bg-white px-5 py-3 text-sm font-bold text-ink"
            >
              Open Province Report
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} note={item.note} />
          ))}
        </div>

        <div
          ref={sectionNavRef}
          className="sticky top-20 z-20 mt-8 rounded-[1.8rem] border border-ink/10 bg-white/90 p-4 shadow-soft backdrop-blur md:top-24"
        >
          <div className="flex flex-wrap gap-3">
            {ADMIN_SECTION_TABS.map((item) => (
              <Link
                key={item.key}
                to={`/dashboard/admin${item.hash}`}
                onClick={() => setActiveSection(item.key)}
                className={sectionLinkClass(activeSection === item.key)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate">
            Use the sticky section switcher or the fixed sidebar to jump directly to the report area you need.
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="mt-8"
          >
            {activePanel}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
