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
  { key: 'reports', label: 'RIB Reports', hash: '#province-reports' },
  { key: 'issues', label: 'Risk Types', hash: '#issue-types' },
  { key: 'feed', label: 'Case Feed', hash: '#national-feed' },
  { key: 'hierarchy', label: 'Workflow Coverage', hash: '#registration-hierarchy' },
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

function formatLevel(level = '') {
  const workflowLabels = {
    village: 'QR Access',
    cell: 'Evidence Triage',
    sector: 'RIB Intake',
    district: 'Investigation Review',
    province: 'Supervisory Review',
    national: 'National Oversight',
  };

  return workflowLabels[level] ?? (level
    ? level.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : 'Unknown');
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
            title="Loading RIB oversight dashboard"
            description="Building oversight metrics, RIB case reports, and workflow coverage views."
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
            title="RIB oversight dashboard unavailable"
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
      <SectionCard title="RIB alerts" subtitle="Critical oversight signals requiring immediate attention.">
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
        title="RIB command coverage"
        subtitle="Workflow visibility the oversight admin can act on immediately."
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
          title="RIB complaint report"
          subtitle="Oversight view of active, overdue, escalated, resolved, and corruption-risk cases."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                  <th className="pb-3">Reporting area</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Active</th>
                  <th className="pb-3">Overdue</th>
                  <th className="pb-3">Escalated</th>
                  <th className="pb-3">Corruption</th>
                  <th className="pb-3">Resolved</th>
                  <th className="pb-3">Workflow Coverage</th>
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
          subtitle="Highest-risk reporting areas based on corruption, overdue, and escalated complaint load."
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
        title="RIB workflow performance"
        subtitle="Operational quality by workflow point currently appearing in the case feed."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                <th className="pb-3">Workflow point</th>
                <th className="pb-3">Area</th>
                <th className="pb-3">Stage</th>
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
                  <td className="py-4 text-slate">{formatLevel(item.level)}</td>
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
          title="RIB risk portfolio"
          subtitle="Classified mix for corruption, abuse, missing response, and evidence-backed reports."
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
          subtitle="Detailed issue-type count across the full RIB monitoring dataset."
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
        <SectionCard title="Reporting modes" subtitle="How citizens are raising RIB reports.">
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
          title="Distribution by current workflow stage"
          subtitle="Active reports currently spread across the RIB escalation chain."
        >
          <div className="space-y-4">
            {dashboard.distributionByLevel.map((item) => (
              <article key={item.level}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{formatLevel(item.level)}</p>
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
        title="Recent RIB case feed"
        subtitle="Latest issue records from reporting areas, workflow points, and report types."
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
                <p>Area: {item.province}</p>
                <p>Context: {item.district}</p>
                <p>Workflow point: {item.institution}</p>
                <p>Stage: {formatLevel(item.currentLevel)}</p>
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
        subtitle="Privacy and investigation-quality indicators for RIB oversight."
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
          title="RIB invite control"
          subtitle="Oversight control of workflow onboarding and invite completion."
          headerAction={
            <Link
              to="/register/invite"
              className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
            >
              Create RIB Invite
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
                        {formatLevel(item.targetLevel)} | {item.province} | {item.district}
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
                No invite records yet. RIB oversight can create workflow invites from Invite Setup.
              </article>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Registered workflow summary"
          subtitle="Live registration progress across RIB QR access, evidence, intake, investigation, and review stages."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl bg-mist p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Total workflow points</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">
                {dashboard.registrationHierarchy.totalInstitutions}
              </p>
              <p className="mt-2 text-sm text-slate">All offices registered into the RIB workflow tree.</p>
            </article>
            <article className="rounded-2xl bg-mist p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Supervisory coverage</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">
                {dashboard.registrationHierarchy.registeredProvinces}/
                {dashboard.registrationHierarchy.expectedProvinces}
              </p>
              <p className="mt-2 text-sm text-slate">Supervisory review records currently connected to the platform.</p>
            </article>
            {Object.entries(hierarchyByLevel).map(([level, count]) => (
              <article key={level} className="rounded-2xl bg-mist p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{formatLevel(level)}</p>
                <p className="mt-3 font-display text-3xl font-black text-ink">{count}</p>
                <p className="mt-2 text-sm text-slate">
                  Registered {formatLevel(level)} workflow points inside the RIB coverage tree.
                </p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Workflow registration coverage"
        subtitle="Coverage view for supervisory, investigation, intake, evidence, and QR access readiness."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                <th className="pb-3">Area</th>
                <th className="pb-3">Supervisory review</th>
                <th className="pb-3">Investigation</th>
                <th className="pb-3">Intake</th>
                <th className="pb-3">Evidence</th>
                <th className="pb-3">QR access</th>
                <th className="pb-3">RIB leads</th>
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
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">RIB Oversight Dashboard</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
              Anti-corruption command center for the RIB case study
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
              Keep RIB oversight metrics visible, then switch between case reports, risk types, feed,
              and workflow coverage without scrolling one long dashboard.
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
              Invite RIB User
            </Link>
            <Link
              to="/dashboard/admin#province-reports"
              className="rounded-full border border-ink/20 bg-white px-5 py-3 text-sm font-bold text-ink"
            >
              Open RIB Report
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
            Use the sticky section switcher or sidebar to jump directly to the RIB oversight area you need.
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
