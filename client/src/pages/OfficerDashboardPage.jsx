import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardState from '../components/dashboard/DashboardState';
import SectionCard from '../components/dashboard/SectionCard';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { fetchOfficerDashboard, fetchOfficerExplorer } from '../lib/dashboardApi';
import { formatDateTime } from '../lib/time';

function resetFilterChildren(filters, field) {
  if (field === 'province') {
    return { ...filters, district: '', sector: '', cell: '', village: '' };
  }
  if (field === 'district') {
    return { ...filters, sector: '', cell: '', village: '' };
  }
  if (field === 'sector') {
    return { ...filters, cell: '', village: '' };
  }
  if (field === 'cell') {
    return { ...filters, village: '' };
  }
  return filters;
}

function OfficerDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filters, setFilters] = useState({
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
  });
  const [hasInitializedFilters, setHasInitializedFilters] = useState(false);
  const [explorer, setExplorer] = useState(null);
  const [explorerLoading, setExplorerLoading] = useState(true);
  const [explorerError, setExplorerError] = useState('');

  useEffect(() => {
    let isActive = true;

    fetchOfficerDashboard()
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
    if (hasInitializedFilters) {
      return;
    }

    setFilters({
      province: user?.location?.province ?? '',
      district: user?.location?.district ?? '',
      sector: user?.location?.sector ?? '',
      cell: user?.location?.cell ?? '',
      village: user?.location?.village ?? '',
    });
    setHasInitializedFilters(true);
  }, [
    hasInitializedFilters,
    user?.location?.province,
    user?.location?.district,
    user?.location?.sector,
    user?.location?.cell,
    user?.location?.village,
  ]);

  useEffect(() => {
    if (!hasInitializedFilters) {
      return;
    }

    let isActive = true;
    setExplorerLoading(true);
    setExplorerError('');

    fetchOfficerExplorer(filters)
      .then((payload) => {
        if (isActive) {
          setExplorer(payload);
        }
      })
      .catch((error) => {
        if (isActive) {
          setExplorer(null);
          setExplorerError(error.message);
        }
      })
      .finally(() => {
        if (isActive) {
          setExplorerLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [hasInitializedFilters, filters]);

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Loading officer dashboard"
            description="Preparing action queue, escalation watch, and workload intelligence."
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
            title="Officer dashboard unavailable"
            description="The management data endpoint did not respond. Please check the API and retry."
          />
        </section>
      </div>
    );
  }

  const managerProfile = dashboard.managerProfile ?? {
    title: 'Institution Level Dashboard',
    scopeLabel: 'Case management and service accountability',
    nextInviteLevel: null,
    responsibilities: [],
    requiredDecisions: [],
    responseWindow: '3 working days per level',
  };
  const institutionManagement = dashboard.institutionManagement ?? {
    hasInstitutionRecord: false,
    institutionId: null,
    institutionName: 'Institution not yet registered',
    expectedChildUnits: null,
    registeredChildUnits: 0,
    childUnitLabel: null,
    services: [],
    servicesCount: 0,
    employeeCount: 0,
    children: [],
  };
  const notifications = dashboard.notifications ?? [];
  const citizenTaggedIssues = dashboard.citizenTaggedIssues ?? [];
  const explorerOptions = explorer?.options ?? {
    provinces: [],
    districts: [],
    sectors: [],
    cells: [],
    villages: [],
  };

  const updateFilter = (field, value) => {
    setFilters((current) => resetFilterChildren({ ...current, [field]: value }, field));
  };

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">
          {user?.role?.replaceAll('_', ' ') ?? 'Officer Dashboard'}
        </p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          {managerProfile.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          {managerProfile.scopeLabel}. Prioritize urgent complaints, monitor overdue risk, and keep governance flow active.
        </p>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard title="Management mandate" subtitle={managerProfile.responseWindow}>
            <div className="space-y-3">
              {managerProfile.responsibilities.map((item) => (
                <article key={item} className="rounded-2xl bg-mist px-4 py-3 text-sm leading-7 text-slate">
                  {item}
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Required decisions"
            subtitle="Leadership actions that keep the hierarchy accountable."
            headerAction={
              managerProfile.nextInviteLevel ? (
                <Link
                  to="/register/invite"
                  className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                >
                  Invite {managerProfile.nextInviteLevel}
                </Link>
              ) : null
            }
          >
            <div className="space-y-3">
              {managerProfile.requiredDecisions.map((item) => (
                <article key={item} className="rounded-2xl bg-mist px-4 py-3 text-sm leading-7 text-slate">
                  {item}
                </article>
              ))}
              {!managerProfile.nextInviteLevel ? (
                <article className="rounded-2xl bg-gold/25 px-4 py-3 text-sm font-semibold text-ink">
                  No lower-level invite required for this role. Focus on case quality and response deadlines.
                </article>
              ) : null}
            </div>
          </SectionCard>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            title="Institution structure"
            subtitle="Parent-child registration chain and management coverage."
          >
            {institutionManagement.hasInstitutionRecord ? (
              <div className="space-y-3 text-sm text-slate">
                <article className="rounded-2xl bg-mist px-4 py-3">
                  <p className="font-semibold text-ink">{institutionManagement.institutionName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em]">
                    {institutionManagement.institutionId} | {institutionManagement.level}
                  </p>
                </article>
                {institutionManagement.childUnitLabel ? (
                  <article className="rounded-2xl bg-mist px-4 py-3">
                    Registered {institutionManagement.childUnitLabel}: {institutionManagement.registeredChildUnits}
                    {institutionManagement.expectedChildUnits !== null
                      ? ` / ${institutionManagement.expectedChildUnits}`
                      : ''}
                  </article>
                ) : (
                  <article className="rounded-2xl bg-mist px-4 py-3">
                    No lower-level governance unit for this level.
                  </article>
                )}
                <article className="rounded-2xl bg-mist px-4 py-3">
                  Staff registered: {institutionManagement.employeeCount}
                </article>
              </div>
            ) : (
              <article className="rounded-2xl bg-gold/25 px-4 py-3 text-sm font-semibold text-ink">
                This account has not completed institution registration yet. Use invite link to onboard institution.
              </article>
            )}
          </SectionCard>

          <SectionCard title="Services and lower levels" subtitle="Operational profile for this governance unit.">
            <div className="space-y-3">
              <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                Services listed: {institutionManagement.servicesCount}
              </article>
              {institutionManagement.services.slice(0, 4).map((service) => (
                <article key={service.name} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                  <p className="font-semibold text-ink">{service.name}</p>
                  {service.description ? <p className="mt-1">{service.description}</p> : null}
                </article>
              ))}
              {institutionManagement.children.slice(0, 4).map((child) => (
                <article key={child.institutionId} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                  <p className="font-semibold text-ink">
                    {child.institutionName} ({child.level})
                  </p>
                  <p className="mt-1">
                    Staff: {child.employeeCount} | Services: {child.servicesCount}
                  </p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <SectionCard
            title="Province to village explorer"
            subtitle="Filter and review institutions, services, leaders, and workers in your governance scope."
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Province</span>
                <select
                  value={filters.province}
                  onChange={(event) => updateFilter('province', event.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-tide"
                >
                  <option value="">All</option>
                  {explorerOptions.provinces.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">District</span>
                <select
                  value={filters.district}
                  onChange={(event) => updateFilter('district', event.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-tide"
                >
                  <option value="">All</option>
                  {explorerOptions.districts.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Sector</span>
                <select
                  value={filters.sector}
                  onChange={(event) => updateFilter('sector', event.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-tide"
                >
                  <option value="">All</option>
                  {explorerOptions.sectors.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Cell</span>
                <select
                  value={filters.cell}
                  onChange={(event) => updateFilter('cell', event.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-tide"
                >
                  <option value="">All</option>
                  {explorerOptions.cells.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Village</span>
                <select
                  value={filters.village}
                  onChange={(event) => updateFilter('village', event.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-tide"
                >
                  <option value="">All</option>
                  {explorerOptions.villages.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {explorerLoading ? (
              <div className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                Loading filtered management data...
              </div>
            ) : null}
            {explorerError ? (
              <div className="mt-4 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay">
                {explorerError}
              </div>
            ) : null}

            {explorer ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Institutions</p>
                  <p className="mt-1 text-xl font-black text-ink">{explorer.summary.institutions}</p>
                </article>
                <article className="rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Services</p>
                  <p className="mt-1 text-xl font-black text-ink">{explorer.summary.services}</p>
                </article>
                <article className="rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Leaders</p>
                  <p className="mt-1 text-xl font-black text-ink">{explorer.summary.leaders}</p>
                </article>
                <article className="rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Workers</p>
                  <p className="mt-1 text-xl font-black text-ink">{explorer.summary.workers}</p>
                </article>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Coverage snapshot"
            subtitle="What is currently visible in the selected filter scope."
          >
            {explorer ? (
              <div className="space-y-3 text-sm text-slate">
                <article className="rounded-xl bg-mist px-4 py-3">
                  <p className="font-semibold text-ink">Districts ({explorer.summary.districts})</p>
                  <p className="mt-1">{explorer.coverage.districts.join(', ') || 'No districts in current filter.'}</p>
                </article>
                <article className="rounded-xl bg-mist px-4 py-3">
                  <p className="font-semibold text-ink">Sectors ({explorer.summary.sectors})</p>
                  <p className="mt-1">{explorer.coverage.sectors.join(', ') || 'No sectors in current filter.'}</p>
                </article>
                <article className="rounded-xl bg-mist px-4 py-3">
                  <p className="font-semibold text-ink">Cells ({explorer.summary.cells})</p>
                  <p className="mt-1">{explorer.coverage.cells.join(', ') || 'No cells in current filter.'}</p>
                </article>
                <article className="rounded-xl bg-mist px-4 py-3">
                  <p className="font-semibold text-ink">Villages ({explorer.summary.villages})</p>
                  <p className="mt-1">{explorer.coverage.villages.join(', ') || 'No villages in current filter.'}</p>
                </article>
              </div>
            ) : (
              <article className="rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                Explorer data will appear here.
              </article>
            )}
          </SectionCard>
        </div>

        {explorer ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SectionCard title="Leaders in scope" subtitle="All leaders from province to village in selected filter.">
              <div className="space-y-3">
                {explorer.leaders.length > 0 ? (
                  explorer.leaders.map((item) => (
                    <article key={item.employeeId} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      <p className="font-semibold text-ink">{item.fullName}</p>
                      <p className="mt-1">{item.positionTitle} | {item.institutionName}</p>
                      <p className="mt-1">Phone: {item.phone || 'N/A'} | Email: {item.email || 'N/A'}</p>
                    </article>
                  ))
                ) : (
                  <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                    No leaders found in this filter.
                  </article>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Workers in scope" subtitle="Staff members registered under filtered institutions.">
              <div className="space-y-3">
                {explorer.workers.length > 0 ? (
                  explorer.workers.map((item) => (
                    <article key={item.employeeId} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      <p className="font-semibold text-ink">{item.fullName}</p>
                      <p className="mt-1">{item.positionTitle} | {item.institutionName}</p>
                      <p className="mt-1">Reports to: {item.reportsTo || 'N/A'}</p>
                    </article>
                  ))
                ) : (
                  <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                    No workers found in this filter.
                  </article>
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {explorer ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SectionCard title="Services in scope" subtitle="All services provided by filtered institutions.">
              <div className="space-y-3">
                {explorer.services.length > 0 ? (
                  explorer.services.map((item, index) => (
                    <article
                      key={`${item.institutionId}-${item.name}-${index}`}
                      className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate"
                    >
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="mt-1">{item.institutionName} ({item.level})</p>
                      {item.description ? <p className="mt-1">{item.description}</p> : null}
                    </article>
                  ))
                ) : (
                  <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                    No services found in this filter.
                  </article>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Institutions in scope" subtitle="Hierarchy units available under current filters.">
              <div className="space-y-3">
                {explorer.institutions.length > 0 ? (
                  explorer.institutions.map((item) => (
                    <article key={item.institutionId} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      <p className="font-semibold text-ink">{item.institutionName}</p>
                      <p className="mt-1">
                        {item.level} | Services: {item.servicesCount} | Staff: {item.employeeCount}
                      </p>
                      {item.childUnitLabel ? (
                        <p className="mt-1">
                          {item.childUnitLabel}: {item.registeredChildUnits}
                          {item.expectedChildUnits !== null ? ` / ${item.expectedChildUnits}` : ''}
                        </p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                    No institutions found in this filter.
                  </article>
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard title="Citizen tagged issues" subtitle="Issues where this account was selected by citizens.">
            <div className="space-y-3">
              {citizenTaggedIssues.length > 0 ? (
                citizenTaggedIssues.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                    <p className="font-semibold text-ink">
                      {item.id} | {item.category}
                    </p>
                    <p className="mt-1">{item.institution} ({item.currentLevel})</p>
                    <p className="mt-1 leading-6">{item.message}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-tide">
                      Deadline: {formatDateTime(item.deadlineAt)}
                    </p>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                  No direct tagged issues yet.
                </article>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Notifications" subtitle="Latest complaint alerts sent to this leader account.">
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                    <p className="font-semibold text-ink">{item.complaintId}</p>
                    <p className="mt-1">{item.message}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-tide">
                      {formatDateTime(item.createdAt)} | {item.status}
                    </p>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                  No new notifications.
                </article>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} note={item.note} />
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Action queue"
            subtitle="Cases are ordered by nearest deadline to reduce delay risk."
          >
            <div className="space-y-3">
              {dashboard.queue.map((item) => (
                <article key={item.id} className="rounded-2xl bg-mist p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-black text-ink">{item.id}</p>
                      <p className="mt-1 text-sm text-slate">{item.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge value={item.status} />
                      <StatusBadge value={item.priority} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate sm:grid-cols-2">
                    <p>Institution: {item.institution}</p>
                    <p>Level: {item.currentLevel}</p>
                    <p>Assigned: {item.assignedOfficer}</p>
                    <p>Deadline: {formatDateTime(item.deadlineAt)}</p>
                  </div>
                  {item.message ? (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm leading-6 text-slate">
                      {item.message}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Escalation watch"
            subtitle="Recent escalations requiring quality review and intervention."
          >
            <div className="space-y-3">
              {dashboard.escalationWatch.map((item) => (
                <article key={item.complaintId} className="rounded-2xl bg-mist p-4">
                  <p className="font-semibold text-ink">{item.complaintId}</p>
                  <p className="mt-1 text-sm text-slate">{item.institution}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">
                    {item.fromLevel} to {item.toLevel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate">{item.reason}</p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard title="Team workload" subtitle="Balanced assignment improves response time and fairness.">
            <div className="space-y-4">
              {dashboard.workload.map((item) => (
                <article key={item.officerName}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">
                      {item.officerName} ({item.level})
                    </p>
                    <p className="text-sm text-slate">
                      Active: {item.activeCases} | Resolved this week: {item.resolvedThisWeek}
                    </p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-mist">
                    <div
                      className="h-2 rounded-full bg-tide"
                      style={{ width: `${item.capacityUsage}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Category load" subtitle="Current demand by complaint category.">
            <div className="space-y-4">
              {dashboard.categoryLoad.map((item) => (
                <article key={item.category}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">{item.category}</p>
                    <p className="text-sm text-slate">{item.count} active</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-mist">
                    <div
                      className="h-2 rounded-full bg-clay"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}

export default OfficerDashboardPage;
