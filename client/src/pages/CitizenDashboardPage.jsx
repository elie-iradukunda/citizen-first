import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardState from '../components/dashboard/DashboardState';
import SectionCard from '../components/dashboard/SectionCard';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  fetchCitizenContext,
  fetchCitizenDashboard,
  submitCitizenComplaint,
} from '../lib/dashboardApi';
import { formatDateTime } from '../lib/time';

const VIEW_MODES = {
  overview: {
    title: 'Clear case visibility and trusted follow-up',
  },
  submit: {
    title: 'Submit issue from your citizen dashboard',
  },
  services: {
    title: 'Explore services by province to village',
  },
  leaders: {
    title: 'View leaders and responsibilities by level',
  },
};

const INITIAL_FILTERS = {
  province: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
};

const INITIAL_COMPLAINT = {
  category: 'Delayed service',
  reportingMode: 'verified',
  targetLevel: 'village',
  primaryLeaderEmployeeId: '',
  secondaryLeaderEmployeeId: '',
  message: '',
};

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

function CitizenDashboardPage({ mode = 'overview' }) {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState('');

  const [complaintForm, setComplaintForm] = useState(INITIAL_COMPLAINT);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    fetchCitizenDashboard()
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
  }, [refreshToken]);

  useEffect(() => {
    if (filtersInitialized) {
      return;
    }

    setFilters({
      province: user?.location?.province ?? '',
      district: user?.location?.district ?? '',
      sector: user?.location?.sector ?? '',
      cell: user?.location?.cell ?? '',
      village: user?.location?.village ?? '',
    });
    setFiltersInitialized(true);
  }, [
    filtersInitialized,
    user?.location?.province,
    user?.location?.district,
    user?.location?.sector,
    user?.location?.cell,
    user?.location?.village,
  ]);

  useEffect(() => {
    if (!filtersInitialized) {
      return;
    }

    let isActive = true;
    setContextLoading(true);
    setContextError('');

    fetchCitizenContext(filters)
      .then((payload) => {
        if (isActive) {
          setContext(payload);
        }
      })
      .catch((error) => {
        if (isActive) {
          setContext(null);
          setContextError(error.message);
        }
      })
      .finally(() => {
        if (isActive) {
          setContextLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [filtersInitialized, filters]);

  const availablePrimaryLeaders = useMemo(() => {
    const targets = context?.complaintTargetLeaders ?? [];
    return targets.filter((entry) => entry.level === complaintForm.targetLevel);
  }, [context?.complaintTargetLeaders, complaintForm.targetLevel]);

  useEffect(() => {
    if (availablePrimaryLeaders.length === 0) {
      setComplaintForm((current) => ({
        ...current,
        primaryLeaderEmployeeId: '',
        secondaryLeaderEmployeeId: '',
      }));
      return;
    }

    setComplaintForm((current) => {
      const exists = availablePrimaryLeaders.some(
        (entry) => entry.leader.employeeId === current.primaryLeaderEmployeeId,
      );
      if (exists) {
        return current;
      }

      return {
        ...current,
        primaryLeaderEmployeeId: availablePrimaryLeaders[0].leader.employeeId,
        secondaryLeaderEmployeeId: '',
      };
    });
  }, [availablePrimaryLeaders]);

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Loading citizen dashboard"
            description="Preparing your complaint, service, and leader visibility workspace."
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
            title="Citizen dashboard unavailable"
            description="We could not fetch your dashboard data. Please confirm the API server is running and try again."
          />
        </section>
      </div>
    );
  }

  const viewMode = VIEW_MODES[mode] ?? VIEW_MODES.overview;
  const options = context?.options ?? {
    provinces: [],
    districts: [],
    sectors: [],
    cells: [],
    villages: [],
  };
  const complaintTargets = context?.complaintTargetLeaders ?? [];
  const services = context?.services ?? [];
  const leaderChain = context?.leaderChain ?? [];

  const updateFilter = (field, value) => {
    setFilters((current) => resetFilterChildren({ ...current, [field]: value }, field));
  };

  const updateComplaintField = (field, value) => {
    setComplaintForm((current) => ({ ...current, [field]: value }));
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    try {
      const taggedLeaderEmployeeIds = [];
      if (
        complaintForm.secondaryLeaderEmployeeId &&
        complaintForm.secondaryLeaderEmployeeId !== complaintForm.primaryLeaderEmployeeId
      ) {
        taggedLeaderEmployeeIds.push(complaintForm.secondaryLeaderEmployeeId);
      }

      const response = await submitCitizenComplaint({
        category: complaintForm.category,
        message: complaintForm.message,
        reportingMode: complaintForm.reportingMode,
        targetLevel: complaintForm.targetLevel,
        primaryLeaderEmployeeId: complaintForm.primaryLeaderEmployeeId,
        taggedLeaderEmployeeIds,
      });

      setSubmitSuccess(
        `${response.item.id} submitted. Tagged: ${response.item.taggedLeaders
          .map((entry) => `${entry.leaderName} (${entry.level})`)
          .join(', ')}`,
      );
      setComplaintForm((current) => ({
        ...current,
        message: '',
        secondaryLeaderEmployeeId: '',
      }));
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Citizen Dashboard</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
              {viewMode.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/citizen" className="rounded-full border border-ink/20 bg-white px-5 py-3 text-sm font-bold text-ink">
              Overview
            </Link>
            <Link to="/dashboard/citizen/submit" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
              Submit issue
            </Link>
            <Link to="/dashboard/citizen/services" className="rounded-full border border-ink/20 bg-white px-5 py-3 text-sm font-bold text-ink">
              Services
            </Link>
            <Link to="/dashboard/citizen/leaders" className="rounded-full border border-ink/20 bg-white px-5 py-3 text-sm font-bold text-ink">
              Leaders
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} note={item.note} />
          ))}
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-tide">Location filter</p>
          <p className="mt-2 text-sm text-slate">
            Choose area from province to village to view services and leaders.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <select
              value={filters.province}
              onChange={(event) => updateFilter('province', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select province</option>
              {options.provinces.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.district}
              onChange={(event) => updateFilter('district', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select district</option>
              {options.districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.sector}
              onChange={(event) => updateFilter('sector', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select sector</option>
              {options.sectors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.cell}
              onChange={(event) => updateFilter('cell', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select cell</option>
              {options.cells.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.village}
              onChange={(event) => updateFilter('village', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select village</option>
              {options.villages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          {contextLoading ? (
            <p className="mt-3 text-sm text-slate">Loading location context...</p>
          ) : null}
          {contextError ? (
            <p className="mt-3 text-sm text-clay">{contextError}</p>
          ) : null}
        </div>

        {mode === 'submit' ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SectionCard
              title="Submit complaint from dashboard"
              subtitle="Start with village-level reporting and tag up to two leaders."
            >
              <form className="space-y-4" onSubmit={submitComplaint}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink">Issue category</span>
                    <input
                      value={complaintForm.category}
                      onChange={(event) => updateComplaintField('category', event.target.value)}
                      className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      required
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink">Reporting mode</span>
                    <select
                      value={complaintForm.reportingMode}
                      onChange={(event) => updateComplaintField('reportingMode', event.target.value)}
                      className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                    >
                      <option value="verified">Verified</option>
                      <option value="anonymous">Anonymous</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink">Target level</span>
                    <select
                      value={complaintForm.targetLevel}
                      onChange={(event) => updateComplaintField('targetLevel', event.target.value)}
                      className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                    >
                      <option value="village">Village leader</option>
                      <option value="cell">Cell leader</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink">Primary leader</span>
                    <select
                      value={complaintForm.primaryLeaderEmployeeId}
                      onChange={(event) =>
                        updateComplaintField('primaryLeaderEmployeeId', event.target.value)
                      }
                      className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      required
                    >
                      <option value="">Select primary leader</option>
                      {availablePrimaryLeaders.map((item) => (
                        <option key={item.leader.employeeId} value={item.leader.employeeId}>
                          {item.leader.fullName} ({item.level} - {item.institutionName})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Second leader tag (optional)</span>
                  <select
                    value={complaintForm.secondaryLeaderEmployeeId}
                    onChange={(event) =>
                      updateComplaintField('secondaryLeaderEmployeeId', event.target.value)
                    }
                    className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                  >
                    <option value="">No additional tag</option>
                    {complaintTargets.map((item) => (
                      <option key={item.leader.employeeId} value={item.leader.employeeId}>
                        {item.leader.fullName} ({item.level} - {item.institutionName})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Issue details</span>
                  <textarea
                    rows={6}
                    value={complaintForm.message}
                    onChange={(event) => updateComplaintField('message', event.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                    placeholder="Describe what happened, where, when, and any evidence."
                    required
                  />
                </label>

                {submitError ? (
                  <p className="rounded-xl border border-clay/25 bg-clay/10 px-3 py-2 text-sm text-clay">
                    {submitError}
                  </p>
                ) : null}
                {submitSuccess ? (
                  <p className="rounded-xl border border-pine/25 bg-pine/10 px-3 py-2 text-sm text-pine">
                    {submitSuccess}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit issue'}
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title="Submission rule"
              subtitle="Each level has 3 working days (Mon-Fri)."
            >
              <div className="space-y-3 text-sm text-slate">
                <article className="rounded-xl bg-mist px-4 py-3">
                  Start at village or cell level based on issue context.
                </article>
                <article className="rounded-xl bg-mist px-4 py-3">
                  You can tag up to two leaders so both are notified immediately.
                </article>
                <article className="rounded-xl bg-mist px-4 py-3">
                  If unresolved in 3 working days, escalate to the next level.
                </article>
                <article className="rounded-xl bg-mist px-4 py-3">
                  Current target leaders available: {complaintTargets.length}
                </article>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {mode === 'services' ? (
          <div className="mt-8">
            <SectionCard title="Services in selected area" subtitle="From province down to village.">
              <div className="grid gap-4 md:grid-cols-2">
                {services.length > 0 ? (
                  services.map((item, index) => (
                    <article
                      key={`${item.institutionId}-${item.name}-${index}`}
                      className="rounded-2xl bg-mist p-4"
                    >
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="mt-1 text-sm text-slate">
                        {item.institutionName} ({item.level})
                      </p>
                      {item.description ? <p className="mt-2 text-sm text-slate">{item.description}</p> : null}
                    </article>
                  ))
                ) : (
                  <article className="rounded-2xl bg-mist p-4 text-sm text-slate">
                    No services found for selected location.
                  </article>
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {mode === 'leaders' ? (
          <div className="mt-8">
            <SectionCard title="Leaders and responsibilities" subtitle="Village to province leadership chain.">
              <div className="grid gap-4 md:grid-cols-2">
                {leaderChain.length > 0 ? (
                  leaderChain.map((entry) => (
                    <article key={`${entry.level}-${entry.institutionId}`} className="rounded-2xl bg-mist p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">{entry.level}</p>
                      <p className="mt-1 font-semibold text-ink">{entry.institutionName}</p>
                      {entry.leader ? (
                        <>
                          <p className="mt-2 text-sm font-semibold text-ink">
                            {entry.leader.fullName} ({entry.leader.positionTitle})
                          </p>
                          <p className="mt-1 text-sm text-slate">
                            Responsibility: {entry.leader.description || entry.leader.reportsTo || 'Leadership and service oversight.'}
                          </p>
                          <p className="mt-1 text-sm text-slate">
                            Contact: {entry.leader.phone || 'N/A'} | {entry.leader.email || 'N/A'}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate">Leader information not available.</p>
                      )}
                    </article>
                  ))
                ) : (
                  <article className="rounded-2xl bg-mist p-4 text-sm text-slate">
                    No leaders found for selected location.
                  </article>
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {mode === 'overview' ? (
          <>
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <SectionCard
                title="My cases"
                subtitle="Every case remains visible with status, institution level, and deadline."
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                        <th className="pb-3">Case</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Level</th>
                        <th className="pb-3">Assigned</th>
                        <th className="pb-3">Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.cases.map((item) => (
                        <tr key={item.id} className="border-b border-ink/10">
                          <td className="py-4 font-semibold text-ink">{item.id}</td>
                          <td className="py-4 text-slate">{item.category}</td>
                          <td className="py-4">
                            <StatusBadge value={item.status} />
                          </td>
                          <td className="py-4 text-slate">{item.currentLevel}</td>
                          <td className="py-4 text-slate">{item.assignedOfficer}</td>
                          <td className="py-4 text-slate">{formatDateTime(item.deadlineAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard
                title="Recent updates"
                subtitle="Timeline events explain what changed and when."
              >
                <div className="space-y-4">
                  {dashboard.timeline.map((item) => (
                    <article key={`${item.title}-${item.time}`} className="rounded-2xl bg-mist p-4">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-tide">{item.time}</p>
                      <p className="mt-2 text-sm leading-6 text-slate">{item.detail}</p>
                    </article>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="mt-8">
              <SectionCard
                title="Citizen awareness"
                subtitle="Guidance designed to protect users and improve report quality."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {dashboard.awareness.map((item) => (
                    <article key={item.title} className="rounded-2xl bg-mist p-5">
                      <p className="font-display text-xl font-black text-ink">{item.title}</p>
                      <p className="mt-3 text-sm leading-7 text-slate">{item.description}</p>
                    </article>
                  ))}
                </div>
              </SectionCard>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

export default CitizenDashboardPage;
