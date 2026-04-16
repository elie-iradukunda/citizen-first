import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ComplaintEvidencePanel from '../components/dashboard/ComplaintEvidencePanel';
import DashboardState from '../components/dashboard/DashboardState';
import InstitutionAccessQrPanel from '../components/dashboard/InstitutionAccessQrPanel';
import SectionCard from '../components/dashboard/SectionCard';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  fetchOfficerDashboard,
  fetchOfficerExplorer,
  submitOfficerComplaintResponse,
} from '../lib/dashboardApi';
import {
  createInstitutionStaffAccount,
  createInstitutionStaffMember,
  fetchInstitutionManagement,
  updateInstitutionManagement,
} from '../lib/registrationApi';
import { formatDateTime } from '../lib/time';

const WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', detail: 'Mandate and hierarchy summary' },
  { id: 'cases', label: 'Case Queue', detail: 'Citizen complaints and escalations' },
  { id: 'territory', label: 'Territory', detail: 'Explorer and scope coverage' },
  { id: 'team', label: 'Team Watch', detail: 'Notifications and workload' },
  { id: 'institution-admin', label: 'Institution Admin', detail: 'Services, staff, and platform access' },
];

const CASE_VIEW_CONFIG = {
  queue: {
    label: 'Assigned queue',
    description: 'All active complaints assigned to this dashboard scope.',
  },
  overdue: {
    label: 'Overdue cases',
    description: 'Cases that passed the SLA and need immediate review.',
  },
  resolved: {
    label: 'Resolved this week',
    description: 'Recently closed complaints with full status and feedback context.',
  },
  escalations: {
    label: 'Escalation watch',
    description: 'Cases that moved upward for oversight or intervention.',
  },
};

const PAGE_SIZES = {
  queue: 3,
  escalations: 4,
  leaders: 4,
  workers: 4,
  services: 4,
  institutions: 4,
  taggedIssues: 4,
  notifications: 4,
  institutionServices: 4,
  institutionStaff: 4,
};

const INITIAL_PAGES = {
  queue: 1,
  escalations: 1,
  leaders: 1,
  workers: 1,
  services: 1,
  institutions: 1,
  taggedIssues: 1,
  notifications: 1,
  institutionServices: 1,
  institutionStaff: 1,
};

function createEmptyInstitutionForm() {
  return {
    institutionType: '',
    officialEmail: '',
    officialPhone: '',
    officeAddress: '',
    services: [],
  };
}

function createEmptyStaffDraft() {
  return {
    fullName: '',
    nationalId: '',
    phone: '',
    email: '',
    password: '',
    positionTitle: '',
    positionKinyarwanda: '',
    reportsTo: '',
    description: '',
    status: 'Active',
    createPlatformAccount: true,
  };
}

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

function formatLevel(level = '') {
  return level
    ? level.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : 'Unknown';
}

function getActiveWorkspace(hash) {
  const value = String(hash ?? '').replace('#', '');
  const [workspace] = value.split('/');
  return WORKSPACE_TABS.some((item) => item.id === workspace) ? workspace : 'overview';
}

function getActiveCaseView(hash) {
  const value = String(hash ?? '').replace('#', '');
  const [workspace, view] = value.split('/');
  if (workspace !== 'cases') {
    return 'queue';
  }
  return Object.prototype.hasOwnProperty.call(CASE_VIEW_CONFIG, view) ? view : 'queue';
}

function isOverdueCase(item) {
  if (!item?.deadlineAt) {
    return false;
  }

  return item.status !== 'resolved' && new Date(item.deadlineAt).getTime() < Date.now();
}

function paginateItems(items = [], page = 1, pageSize = 4) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}

function PaginationControls({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-full border border-ink/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-full border border-ink/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function OfficerDashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeWorkspace = getActiveWorkspace(location.hash);
  const activeCaseView = getActiveCaseView(location.hash);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pages, setPages] = useState(INITIAL_PAGES);
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
  const [responseDrafts, setResponseDrafts] = useState({});
  const [respondingComplaintId, setRespondingComplaintId] = useState('');
  const [responseError, setResponseError] = useState('');
  const [responseSuccess, setResponseSuccess] = useState('');
  const [institutionAdmin, setInstitutionAdmin] = useState(null);
  const [institutionAdminLoading, setInstitutionAdminLoading] = useState(true);
  const [institutionAdminError, setInstitutionAdminError] = useState('');
  const [institutionForm, setInstitutionForm] = useState(createEmptyInstitutionForm);
  const [serviceDraft, setServiceDraft] = useState({ name: '', description: '' });
  const [staffDraft, setStaffDraft] = useState(createEmptyStaffDraft);
  const [accountDrafts, setAccountDrafts] = useState({});
  const [institutionSaveError, setInstitutionSaveError] = useState('');
  const [institutionSaveSuccess, setInstitutionSaveSuccess] = useState('');
  const [isSavingInstitution, setIsSavingInstitution] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [creatingAccountEmployeeId, setCreatingAccountEmployeeId] = useState('');

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
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
  }, [refreshToken]);

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

  useEffect(() => {
    const institutionId = dashboard?.institutionManagement?.institutionId;
    const hasInstitutionRecord = dashboard?.institutionManagement?.hasInstitutionRecord;

    if (!institutionId || !hasInstitutionRecord) {
      setInstitutionAdmin(null);
      setInstitutionAdminLoading(false);
      return undefined;
    }

    let isActive = true;
    setInstitutionAdminLoading(true);
    setInstitutionAdminError('');

    fetchInstitutionManagement(institutionId)
      .then((payload) => {
        if (!isActive) {
          return;
        }

        const item = payload.item ?? null;
        setInstitutionAdmin(item);
        setInstitutionForm({
          institutionType: item?.institutionType ?? '',
          officialEmail: item?.officialEmail ?? '',
          officialPhone: item?.officialPhone ?? '',
          officeAddress: item?.officeAddress ?? '',
          services: item?.services ?? [],
        });
      })
      .catch((error) => {
        if (isActive) {
          setInstitutionAdmin(null);
          setInstitutionAdminError(error.message);
        }
      })
      .finally(() => {
        if (isActive) {
          setInstitutionAdminLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [dashboard?.institutionManagement?.hasInstitutionRecord, dashboard?.institutionManagement?.institutionId]);

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
    slug: null,
    institutionName: 'Institution not yet registered',
    institutionType: null,
    expectedChildUnits: null,
    registeredChildUnits: 0,
    childUnitLabel: null,
    officeAddress: null,
    officialEmail: null,
    officialPhone: null,
    leader: null,
    services: [],
    servicesCount: 0,
    employeeCount: 0,
    children: [],
  };
  const explorerOptions = explorer?.options ?? {
    provinces: [],
    districts: [],
    sectors: [],
    cells: [],
    villages: [],
  };
  const escalationsPagination = paginateItems(
    dashboard.escalationWatch ?? [],
    pages.escalations,
    PAGE_SIZES.escalations,
  );
  const recentResolvedPagination = paginateItems(
    dashboard.recentResolved ?? [],
    pages.queue,
    PAGE_SIZES.queue,
  );
  const leadersPagination = paginateItems(
    explorer?.leaders ?? [],
    pages.leaders,
    PAGE_SIZES.leaders,
  );
  const workersPagination = paginateItems(
    explorer?.workers ?? [],
    pages.workers,
    PAGE_SIZES.workers,
  );
  const servicesPagination = paginateItems(
    explorer?.services ?? [],
    pages.services,
    PAGE_SIZES.services,
  );
  const institutionsPagination = paginateItems(
    explorer?.institutions ?? [],
    pages.institutions,
    PAGE_SIZES.institutions,
  );
  const taggedIssuesPagination = paginateItems(
    dashboard.citizenTaggedIssues ?? [],
    pages.taggedIssues,
    PAGE_SIZES.taggedIssues,
  );
  const notificationsPagination = paginateItems(
    dashboard.notifications ?? [],
    pages.notifications,
    PAGE_SIZES.notifications,
  );
  const institutionServicesPagination = paginateItems(
    institutionForm.services ?? [],
    pages.institutionServices,
    PAGE_SIZES.institutionServices,
  );
  const institutionStaffPagination = paginateItems(
    institutionAdmin?.employees ?? [],
    pages.institutionStaff,
    PAGE_SIZES.institutionStaff,
  );
  const caseStatusCounts = {
    queue: dashboard.queue?.length ?? 0,
    overdue: (dashboard.queue ?? []).filter(isOverdueCase).length,
    resolved: dashboard.recentResolved?.length ?? 0,
    escalations: dashboard.escalationWatch?.length ?? 0,
  };

  const activeCaseCollection = (() => {
    if (activeCaseView === 'overdue') {
      return (dashboard.queue ?? []).filter(isOverdueCase);
    }
    if (activeCaseView === 'resolved') {
      return dashboard.recentResolved ?? [];
    }
    return dashboard.queue ?? [];
  })();

  const activeCasePagination =
    activeCaseView === 'resolved'
      ? recentResolvedPagination
      : paginateItems(activeCaseCollection, pages.queue, PAGE_SIZES.queue);

  const caseViewMeta = CASE_VIEW_CONFIG[activeCaseView];

  const updateFilter = (field, value) => {
    setFilters((current) => resetFilterChildren({ ...current, [field]: value }, field));
    setPages((current) => ({
      ...current,
      leaders: 1,
      workers: 1,
      services: 1,
      institutions: 1,
    }));
  };

  const updatePage = (key, value) => {
    setPages((current) => ({
      ...current,
      [key]: Math.max(1, value),
    }));
  };

  const openCaseView = (view) => {
    navigate(view === 'queue' ? '/dashboard/officer#cases' : `/dashboard/officer#cases/${view}`);
    setPages((current) => ({
      ...current,
      queue: 1,
      escalations: 1,
    }));
  };

  const replaceInstitutionAdminState = (item) => {
    setInstitutionAdmin(item);
    setInstitutionForm({
      institutionType: item?.institutionType ?? '',
      officialEmail: item?.officialEmail ?? '',
      officialPhone: item?.officialPhone ?? '',
      officeAddress: item?.officeAddress ?? '',
      services: item?.services ?? [],
    });
  };

  const updateInstitutionField = (field, value) => {
    setInstitutionForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addServiceDraft = () => {
    const name = serviceDraft.name.trim();
    const description = serviceDraft.description.trim();
    if (!name) {
      return;
    }

    setInstitutionForm((current) => {
      const alreadyExists = current.services.some(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      );
      if (alreadyExists) {
        return current;
      }

      return {
        ...current,
        services: [...current.services, { name, description }],
      };
    });
    setServiceDraft({ name: '', description: '' });
    setPages((current) => ({ ...current, institutionServices: 1 }));
  };

  const removeInstitutionService = (name) => {
    setInstitutionForm((current) => ({
      ...current,
      services: current.services.filter((item) => item.name !== name),
    }));
  };

  const saveInstitutionProfile = async () => {
    if (!institutionAdmin?.institutionId) {
      return;
    }

    setInstitutionSaveError('');
    setInstitutionSaveSuccess('');
    setIsSavingInstitution(true);

    try {
      const result = await updateInstitutionManagement(institutionAdmin.institutionId, {
        institutionType: institutionForm.institutionType,
        officialEmail: institutionForm.officialEmail,
        officialPhone: institutionForm.officialPhone,
        officeAddress: institutionForm.officeAddress,
        services: institutionForm.services,
      });
      replaceInstitutionAdminState(result.item ?? null);
      setInstitutionSaveSuccess(result.message);
    } catch (error) {
      setInstitutionSaveError(error.message);
    } finally {
      setIsSavingInstitution(false);
    }
  };

  const createStaffMember = async () => {
    if (!institutionAdmin?.institutionId) {
      return;
    }

    setInstitutionSaveError('');
    setInstitutionSaveSuccess('');
    setIsCreatingStaff(true);

    try {
      const result = await createInstitutionStaffMember(institutionAdmin.institutionId, staffDraft);
      replaceInstitutionAdminState(result.item ?? null);
      setStaffDraft(createEmptyStaffDraft());
      setPages((current) => ({ ...current, institutionStaff: 1 }));
      setInstitutionSaveSuccess(
        result.createdAccount
          ? `${result.message} Access key: ${result.createdAccount.accessKey}`
          : result.message,
      );
    } catch (error) {
      setInstitutionSaveError(error.message);
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const createExistingStaffAccount = async (employeeId) => {
    if (!institutionAdmin?.institutionId) {
      return;
    }

    const draft = accountDrafts[employeeId] ?? { email: '', password: '' };
    setInstitutionSaveError('');
    setInstitutionSaveSuccess('');
    setCreatingAccountEmployeeId(employeeId);

    try {
      const result = await createInstitutionStaffAccount(institutionAdmin.institutionId, employeeId, draft);
      replaceInstitutionAdminState(result.item ?? null);
      setAccountDrafts((current) => ({
        ...current,
        [employeeId]: { email: '', password: '' },
      }));
      setInstitutionSaveSuccess(
        `${result.message} Access key: ${result.createdAccount?.accessKey ?? 'generated'}`,
      );
    } catch (error) {
      setInstitutionSaveError(error.message);
    } finally {
      setCreatingAccountEmployeeId('');
    }
  };

  const submitResponse = async (complaintId) => {
    const draft = responseDrafts[complaintId] ?? { message: '', actionTaken: '' };
    setResponseError('');
    setResponseSuccess('');
    setRespondingComplaintId(complaintId);

    try {
      const result = await submitOfficerComplaintResponse(complaintId, {
        message: draft.message,
        actionTaken: draft.actionTaken,
      });
      setResponseSuccess(result.message);
      setResponseDrafts((current) => ({
        ...current,
        [complaintId]: { message: '', actionTaken: '' },
      }));
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setResponseError(error.message);
    } finally {
      setRespondingComplaintId('');
    }
  };

  const renderComplaintCard = (item, allowResponse = false) => (
    <article key={item.id} className="rounded-2xl bg-mist p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-black text-ink">{item.id}</p>
          <p className="mt-1 text-sm text-slate">{item.category}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={item.status} />
          {item.priority ? <StatusBadge value={item.priority} /> : null}
          {item.feedbackStatus ? <StatusBadge value={item.feedbackStatus} /> : null}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate sm:grid-cols-2">
        <p>Institution: {item.institution}</p>
        <p>Level: {item.currentLevel}</p>
        <p>Assigned: {item.assignedOfficer}</p>
        <p>Deadline: {formatDateTime(item.deadlineAt)}</p>
        <p>Submitted: {formatDateTime(item.submittedAt)}</p>
        <p>Updated: {formatDateTime(item.updatedAt)}</p>
        {item.resolvedAt ? <p>Resolved: {formatDateTime(item.resolvedAt)}</p> : null}
      </div>
      {item.sourceInstitution ? (
        <div className="mt-3 rounded-xl bg-white px-3 py-3 text-sm text-slate">
          <p className="font-semibold text-ink">{item.sourceInstitution.institutionName}</p>
          <p className="mt-1">{item.sourceInstitution.serviceName || 'General institution complaint'}</p>
        </div>
      ) : null}
      {item.reporterProfile ? (
        <div className="mt-3 rounded-xl bg-white px-3 py-3 text-sm text-slate">
          <p className="font-semibold text-ink">Citizen profile</p>
          <p className="mt-1">
            {item.reporterProfile.fullName} | {item.reporterProfile.citizenId || 'No citizen ID'}
          </p>
          <p className="mt-1">National ID: {item.reporterProfile.nationalId || 'Not available'}</p>
          <p className="mt-1">
            {item.reporterProfile.phone || 'No phone'} | {item.reporterProfile.email || 'No email'}
          </p>
          <p className="mt-1">
            {[
              item.reporterProfile.location?.village,
              item.reporterProfile.location?.cell,
              item.reporterProfile.location?.sector,
              item.reporterProfile.location?.district,
              item.reporterProfile.location?.province,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      ) : null}
      {item.accusedLeaders?.length > 0 ? (
        <div className="mt-3 rounded-xl bg-white px-3 py-3 text-sm text-slate">
          <p className="font-semibold text-ink">Accused leaders</p>
          <p className="mt-1">
            {item.accusedLeaders.map((entry) => `${entry.leaderName} (${entry.level})`).join(', ')}
          </p>
        </div>
      ) : null}
      {item.message ? (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm leading-6 text-slate">{item.message}</p>
      ) : null}
      <ComplaintEvidencePanel image={item.evidenceImage} voiceNote={item.voiceNote} title="Citizen evidence" />
      {item.response ? (
        <div className="mt-3 rounded-xl border border-pine/20 bg-pine/10 px-3 py-3 text-sm text-slate">
          <p className="font-semibold text-ink">Latest feedback sent</p>
          <p className="mt-1">
            {item.response.respondedByName} | {formatDateTime(item.response.respondedAt)}
          </p>
          {item.response.actionTaken ? (
            <p className="mt-1 font-semibold text-ink">Action: {item.response.actionTaken}</p>
          ) : null}
          <p className="mt-2 leading-6">{item.response.message}</p>
        </div>
      ) : null}
      {allowResponse && item.canRespond ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[0.35fr_0.65fr]">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">
                Action Taken
              </span>
              <input
                value={responseDrafts[item.id]?.actionTaken ?? ''}
                onChange={(event) =>
                  setResponseDrafts((current) => ({
                    ...current,
                    [item.id]: {
                      message: current[item.id]?.message ?? '',
                      actionTaken: event.target.value,
                    },
                  }))
                }
                className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                placeholder="Example: Investigation started"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">
                Citizen Feedback
              </span>
              <textarea
                rows={4}
                value={responseDrafts[item.id]?.message ?? ''}
                onChange={(event) =>
                  setResponseDrafts((current) => ({
                    ...current,
                    [item.id]: {
                      actionTaken: current[item.id]?.actionTaken ?? '',
                      message: event.target.value,
                    },
                  }))
                }
                className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                placeholder="Explain what was reviewed, what action was taken, and what the citizen should expect next."
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => submitResponse(item.id)}
            disabled={respondingComplaintId === item.id || !(responseDrafts[item.id]?.message ?? '').trim()}
            className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
          >
            {respondingComplaintId === item.id ? 'Sending...' : 'Send feedback'}
          </button>
        </div>
      ) : null}
    </article>
  );

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

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              note={item.note}
              onClick={
                item.label === 'Assigned queue'
                  ? () => openCaseView('queue')
                  : item.label === 'Overdue cases'
                    ? () => openCaseView('overdue')
                    : item.label === 'Resolved this week'
                      ? () => openCaseView('resolved')
                      : item.label === 'Escalation watch'
                        ? () => openCaseView('escalations')
                        : undefined
              }
              isActive={
                (item.label === 'Assigned queue' && activeWorkspace === 'cases' && activeCaseView === 'queue') ||
                (item.label === 'Overdue cases' && activeWorkspace === 'cases' && activeCaseView === 'overdue') ||
                (item.label === 'Resolved this week' && activeWorkspace === 'cases' && activeCaseView === 'resolved') ||
                (item.label === 'Escalation watch' && activeWorkspace === 'cases' && activeCaseView === 'escalations')
              }
            />
          ))}
        </div>

        <div className="sticky top-24 z-20 mt-8">
          <div className="overflow-x-auto rounded-[1.75rem] border border-ink/10 bg-white/95 p-2 shadow-soft backdrop-blur">
            <div className="flex w-max gap-2">
              {WORKSPACE_TABS.map((item) => (
                <Link
                  key={item.id}
                  to={item.id === 'overview' ? '/dashboard/officer' : `/dashboard/officer#${item.id}`}
                  className={`min-w-[12.5rem] rounded-[1.25rem] px-4 py-3 text-left transition ${
                    activeWorkspace === item.id ? 'bg-ink text-white shadow-soft' : 'bg-white text-ink hover:bg-mist'
                  }`}
                >
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className={`mt-1 text-xs ${activeWorkspace === item.id ? 'text-white/80' : 'text-slate'}`}>
                    {item.detail}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {activeWorkspace === 'overview' ? (
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
        ) : null}

        {activeWorkspace === 'overview' ? (
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

          <SectionCard
            title="Citizen access QR"
            subtitle="One scan opens the institution page where a citizen can choose full information or continue to issue reporting."
          >
            {institutionManagement.hasInstitutionRecord && institutionManagement.slug ? (
              <InstitutionAccessQrPanel
                institutionSlug={institutionManagement.slug}
                institutionName={institutionManagement.institutionName}
              />
            ) : (
              <article className="rounded-2xl bg-gold/25 px-4 py-4 text-sm font-semibold text-ink">
                Finish institution registration before publishing the citizen access QR for this dashboard.
              </article>
            )}
          </SectionCard>
        </div>
        ) : null}

        {activeWorkspace === 'institution-admin' ? (
        <div className="mt-8 grid gap-6">
          {!institutionManagement.hasInstitutionRecord ? (
            <SectionCard
              title="Institution admin unavailable"
              subtitle="Complete institution registration first so this dashboard can manage services, staff, and access."
            >
              <article className="rounded-2xl bg-gold/25 px-4 py-4 text-sm font-semibold text-ink">
                This account is not yet linked to a registered institution record.
              </article>
            </SectionCard>
          ) : institutionAdminLoading ? (
            <SectionCard
              title="Loading institution admin"
              subtitle="Preparing service catalog, staff directory, and access control."
            >
              <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                Loading institution management data...
              </article>
            </SectionCard>
          ) : institutionAdminError ? (
            <SectionCard
              title="Institution admin unavailable"
              subtitle="The management endpoint did not respond for this institution."
            >
              <article className="rounded-2xl border border-clay/25 bg-clay/10 px-4 py-4 text-sm font-semibold text-clay">
                {institutionAdminError}
              </article>
            </SectionCard>
          ) : (
            <>
              {institutionSaveError ? (
                <div className="rounded-2xl border border-clay/25 bg-clay/10 px-4 py-4 text-sm font-semibold text-clay">
                  {institutionSaveError}
                </div>
              ) : null}
              {institutionSaveSuccess ? (
                <div className="rounded-2xl border border-pine/20 bg-pine/10 px-4 py-4 text-sm font-semibold text-ink">
                  {institutionSaveSuccess}
                </div>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <SectionCard
                  title="Institution profile"
                  subtitle="Keep service office details current so citizens and other leaders see accurate information."
                  headerAction={
                    <button
                      type="button"
                      onClick={saveInstitutionProfile}
                      disabled={isSavingInstitution}
                      className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-70"
                    >
                      {isSavingInstitution ? 'Saving...' : 'Save profile'}
                    </button>
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Institution type</span>
                      <input
                        value={institutionForm.institutionType}
                        onChange={(event) => updateInstitutionField('institutionType', event.target.value)}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Official email</span>
                      <input
                        type="email"
                        value={institutionForm.officialEmail}
                        onChange={(event) => updateInstitutionField('officialEmail', event.target.value)}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Official phone</span>
                      <input
                        value={institutionForm.officialPhone}
                        onChange={(event) => updateInstitutionField('officialPhone', event.target.value)}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Institution slug</span>
                      <input
                        value={institutionAdmin?.slug ?? ''}
                        disabled
                        className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-slate"
                      />
                    </label>
                  </div>
                  <label className="mt-4 block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Office address</span>
                    <textarea
                      rows={3}
                      value={institutionForm.officeAddress}
                      onChange={(event) => updateInstitutionField('officeAddress', event.target.value)}
                      className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                    />
                  </label>
                </SectionCard>

                <SectionCard
                  title="Access and hierarchy"
                  subtitle="A quick view of what this institution already manages on the platform."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Primary leader</p>
                      <p className="mt-1 font-semibold text-ink">
                        {institutionManagement.leader?.fullName ?? 'Not linked'}
                      </p>
                      <p className="mt-1">
                        {institutionManagement.leader?.positionTitle ?? 'No role title available'}
                      </p>
                    </article>
                    <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Registered staff</p>
                      <p className="mt-1 text-2xl font-black text-ink">{institutionAdmin?.employeeCount ?? 0}</p>
                    </article>
                    <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Departments</p>
                      <p className="mt-1 text-2xl font-black text-ink">{institutionAdmin?.departments?.length ?? 0}</p>
                    </article>
                    <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Child units</p>
                      <p className="mt-1 text-2xl font-black text-ink">{institutionAdmin?.children?.length ?? 0}</p>
                    </article>
                  </div>

                  {institutionAdmin?.departments?.length ? (
                    <div className="mt-4 space-y-3">
                      {institutionAdmin.departments.slice(0, 4).map((department) => (
                        <article key={department.departmentId} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                          <p className="font-semibold text-ink">{department.name}</p>
                          {department.description ? <p className="mt-1">{department.description}</p> : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <article className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                      No department records have been added for this institution yet.
                    </article>
                  )}
                </SectionCard>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <SectionCard title="Service catalog" subtitle="Publish the services this institution offers so citizens see the right options.">
                  <div className="grid gap-3 md:grid-cols-[0.42fr_0.58fr_auto]">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Service name</span>
                      <input
                        value={serviceDraft.name}
                        onChange={(event) => setServiceDraft((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                        placeholder="Example: Complaint intake"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Description</span>
                      <input
                        value={serviceDraft.description}
                        onChange={(event) =>
                          setServiceDraft((current) => ({ ...current, description: event.target.value }))
                        }
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                        placeholder="What citizens should expect from this service"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addServiceDraft}
                        className="w-full rounded-full bg-ink px-4 py-2 text-sm font-bold text-white"
                      >
                        Add service
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {institutionServicesPagination.items.length > 0 ? (
                      institutionServicesPagination.items.map((service) => (
                        <article key={service.name} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink">{service.name}</p>
                              {service.description ? <p className="mt-1">{service.description}</p> : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeInstitutionService(service.name)}
                              className="rounded-full border border-ink/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink"
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                        No service records are published yet for this institution.
                      </article>
                    )}
                  </div>
                  <PaginationControls
                    currentPage={institutionServicesPagination.currentPage}
                    totalPages={institutionServicesPagination.totalPages}
                    onChange={(value) => updatePage('institutionServices', value)}
                  />
                </SectionCard>

                <SectionCard
                  title="Publish QR access"
                  subtitle="Citizens can scan one code to read institution information or continue to issue reporting."
                >
                  {institutionAdmin?.slug ? (
                    <InstitutionAccessQrPanel
                      institutionSlug={institutionAdmin.slug}
                      institutionName={institutionAdmin.institutionName}
                    />
                  ) : (
                    <article className="rounded-2xl bg-gold/25 px-4 py-4 text-sm font-semibold text-ink">
                      This institution does not have a public access slug yet.
                    </article>
                  )}
                </SectionCard>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <SectionCard title="Add staff or leaders" subtitle="Register new institution team members and optionally create login access immediately.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Full name</span>
                      <input
                        value={staffDraft.fullName}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, fullName: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">National ID</span>
                      <input
                        value={staffDraft.nationalId}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, nationalId: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Phone</span>
                      <input
                        value={staffDraft.phone}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, phone: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Email</span>
                      <input
                        type="email"
                        value={staffDraft.email}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, email: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Position title</span>
                      <input
                        value={staffDraft.positionTitle}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, positionTitle: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Reports to</span>
                      <input
                        value={staffDraft.reportsTo}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, reportsTo: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                        placeholder={institutionManagement.leader?.positionTitle ?? 'Primary institution leader'}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Kinyarwanda title</span>
                      <input
                        value={staffDraft.positionKinyarwanda}
                        onChange={(event) =>
                          setStaffDraft((current) => ({ ...current, positionKinyarwanda: event.target.value }))
                        }
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Temporary password</span>
                      <input
                        type="password"
                        value={staffDraft.password}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, password: event.target.value }))}
                        className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                        placeholder="Required when platform access is enabled"
                      />
                    </label>
                  </div>
                  <label className="mt-4 block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate">Description</span>
                    <textarea
                      rows={3}
                      value={staffDraft.description}
                      onChange={(event) => setStaffDraft((current) => ({ ...current, description: event.target.value }))}
                      className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={staffDraft.createPlatformAccount}
                        onChange={(event) =>
                          setStaffDraft((current) => ({
                            ...current,
                            createPlatformAccount: event.target.checked,
                          }))
                        }
                      />
                      Create platform login for this staff member
                    </label>
                    <button
                      type="button"
                      onClick={createStaffMember}
                      disabled={isCreatingStaff}
                      className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
                    >
                      {isCreatingStaff ? 'Creating...' : 'Add team member'}
                    </button>
                  </div>
                </SectionCard>

                <SectionCard title="Current staff and account access" subtitle="Review who is already listed in the institution and who can sign in to work cases.">
                  <div className="space-y-3">
                    {institutionStaffPagination.items.length > 0 ? (
                      institutionStaffPagination.items.map((employee) => (
                        <article key={employee.employeeId} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink">
                                {employee.fullName}
                                {employee.isLeader ? ' | Primary leader' : ''}
                              </p>
                              <p className="mt-1">
                                {employee.positionTitle}
                                {employee.positionKinyarwanda ? ` | ${employee.positionKinyarwanda}` : ''}
                              </p>
                              <p className="mt-1">{employee.phone} | {employee.email || 'No email yet'}</p>
                              {employee.reportsTo ? <p className="mt-1">Reports to: {employee.reportsTo}</p> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <StatusBadge value={employee.status} />
                              <StatusBadge value={employee.hasPlatformAccount ? 'platform access' : 'no account'} />
                            </div>
                          </div>

                          {employee.description ? (
                            <p className="mt-3 rounded-xl bg-white px-3 py-2 leading-6">{employee.description}</p>
                          ) : null}

                          {employee.account ? (
                            <div className="mt-3 rounded-xl border border-pine/20 bg-pine/10 px-3 py-3 text-sm text-slate">
                              <p className="font-semibold text-ink">Platform access ready</p>
                              <p className="mt-1">
                                {employee.account.role} | {employee.account.email || 'No email'}
                              </p>
                              <p className="mt-1">Status: {employee.account.status}</p>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-xl border border-ink/10 bg-white p-4">
                              <p className="text-sm font-semibold text-ink">Create platform account</p>
                              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                                <input
                                  type="email"
                                  value={accountDrafts[employee.employeeId]?.email ?? employee.email ?? ''}
                                  onChange={(event) =>
                                    setAccountDrafts((current) => ({
                                      ...current,
                                      [employee.employeeId]: {
                                        email: event.target.value,
                                        password: current[employee.employeeId]?.password ?? '',
                                      },
                                    }))
                                  }
                                  className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                                  placeholder="Email for login"
                                />
                                <input
                                  type="password"
                                  value={accountDrafts[employee.employeeId]?.password ?? ''}
                                  onChange={(event) =>
                                    setAccountDrafts((current) => ({
                                      ...current,
                                      [employee.employeeId]: {
                                        email: current[employee.employeeId]?.email ?? employee.email ?? '',
                                        password: event.target.value,
                                      },
                                    }))
                                  }
                                  className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                                  placeholder="Temporary password"
                                />
                                <button
                                  type="button"
                                  onClick={() => createExistingStaffAccount(employee.employeeId)}
                                  disabled={creatingAccountEmployeeId === employee.employeeId}
                                  className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
                                >
                                  {creatingAccountEmployeeId === employee.employeeId ? 'Creating...' : 'Create login'}
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      ))
                    ) : (
                      <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                        No staff members have been recorded for this institution yet.
                      </article>
                    )}
                  </div>
                  <PaginationControls
                    currentPage={institutionStaffPagination.currentPage}
                    totalPages={institutionStaffPagination.totalPages}
                    onChange={(value) => updatePage('institutionStaff', value)}
                  />
                </SectionCard>
              </div>
            </>
          )}
        </div>
        ) : null}

        {activeWorkspace === 'territory' ? (
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
        ) : null}

        {activeWorkspace === 'territory' && explorer ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SectionCard title="Leaders in scope" subtitle="All leaders from province to village in selected filter.">
              <div className="space-y-3">
                {leadersPagination.items.length > 0 ? (
                  leadersPagination.items.map((item) => (
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
              <PaginationControls
                currentPage={leadersPagination.currentPage}
                totalPages={leadersPagination.totalPages}
                onChange={(value) => updatePage('leaders', value)}
              />
            </SectionCard>

            <SectionCard title="Workers in scope" subtitle="Staff members registered under filtered institutions.">
              <div className="space-y-3">
                {workersPagination.items.length > 0 ? (
                  workersPagination.items.map((item) => (
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
              <PaginationControls
                currentPage={workersPagination.currentPage}
                totalPages={workersPagination.totalPages}
                onChange={(value) => updatePage('workers', value)}
              />
            </SectionCard>
          </div>
        ) : null}

        {activeWorkspace === 'territory' && explorer ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SectionCard title="Services in scope" subtitle="All services provided by filtered institutions.">
              <div className="space-y-3">
                {servicesPagination.items.length > 0 ? (
                  servicesPagination.items.map((item, index) => (
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
              <PaginationControls
                currentPage={servicesPagination.currentPage}
                totalPages={servicesPagination.totalPages}
                onChange={(value) => updatePage('services', value)}
              />
            </SectionCard>

            <SectionCard title="Institutions in scope" subtitle="Hierarchy units available under current filters.">
              <div className="space-y-3">
                {institutionsPagination.items.length > 0 ? (
                  institutionsPagination.items.map((item) => (
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
              <PaginationControls
                currentPage={institutionsPagination.currentPage}
                totalPages={institutionsPagination.totalPages}
                onChange={(value) => updatePage('institutions', value)}
              />
            </SectionCard>
          </div>
        ) : null}

        {activeWorkspace === 'team' ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard title="Citizen tagged issues" subtitle="Issues where this account was selected by citizens.">
            <div className="space-y-3">
              {taggedIssuesPagination.items.length > 0 ? (
                taggedIssuesPagination.items.map((item) => (
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
            <PaginationControls
              currentPage={taggedIssuesPagination.currentPage}
              totalPages={taggedIssuesPagination.totalPages}
              onChange={(value) => updatePage('taggedIssues', value)}
            />
          </SectionCard>

          <SectionCard title="Notifications" subtitle="Latest complaint alerts sent to this leader account.">
            <div className="space-y-3">
              {notificationsPagination.items.length > 0 ? (
                notificationsPagination.items.map((item) => (
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
            <PaginationControls
              currentPage={notificationsPagination.currentPage}
              totalPages={notificationsPagination.totalPages}
              onChange={(value) => updatePage('notifications', value)}
            />
          </SectionCard>
        </div>
        ) : null}

        {activeWorkspace === 'cases' ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Case status navigator"
            subtitle="Open the exact list you want instead of scanning the full dashboard."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(CASE_VIEW_CONFIG).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => openCaseView(key)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    activeCaseView === key
                      ? 'border-tide bg-tide text-white shadow-soft'
                      : 'border-ink/10 bg-mist text-ink hover:border-tide/30'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em]">
                    {item.label}
                  </p>
                  <p className={`mt-3 font-display text-3xl font-black ${activeCaseView === key ? 'text-white' : 'text-ink'}`}>
                    {caseStatusCounts[key]}
                  </p>
                  <p className={`mt-2 text-sm leading-6 ${activeCaseView === key ? 'text-white/85' : 'text-slate'}`}>
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={caseViewMeta.label}
            subtitle={caseViewMeta.description}
          >
            {responseError ? (
              <div className="mb-4 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay">
                {responseError}
              </div>
            ) : null}
            {responseSuccess ? (
              <div className="mb-4 rounded-xl border border-pine/25 bg-pine/10 px-4 py-3 text-sm text-pine">
                {responseSuccess}
              </div>
            ) : null}
            <div className="space-y-3">
              {activeCaseView === 'escalations' ? (
                escalationsPagination.items.length > 0 ? (
                  escalationsPagination.items.map((item) => (
                    <article key={item.complaintId} className="rounded-2xl bg-mist p-4">
                      <p className="font-semibold text-ink">{item.complaintId}</p>
                      <p className="mt-1 text-sm text-slate">{item.institution}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">
                        {formatLevel(item.fromLevel)} to {formatLevel(item.toLevel)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate">{item.reason}</p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate">
                        Escalated {formatDateTime(item.escalatedAt)}
                      </p>
                    </article>
                  ))
                ) : (
                  <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                    No escalations are currently waiting in this workspace.
                  </article>
                )
              ) : activeCasePagination.items.length > 0 ? (
                activeCasePagination.items.map((item) => renderComplaintCard(item, activeCaseView !== 'resolved'))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                  {activeCaseView === 'resolved'
                    ? 'No resolved complaints were recorded in the last seven days for this scope.'
                    : activeCaseView === 'overdue'
                      ? 'No overdue complaints are currently waiting in this dashboard scope.'
                      : 'No active complaint is currently assigned to this dashboard scope.'}
                </article>
              )}
            </div>
            {activeCaseView === 'escalations' ? (
              <PaginationControls
                currentPage={escalationsPagination.currentPage}
                totalPages={escalationsPagination.totalPages}
                onChange={(value) => updatePage('escalations', value)}
              />
            ) : (
              <PaginationControls
                currentPage={activeCasePagination.currentPage}
                totalPages={activeCasePagination.totalPages}
                onChange={(value) => updatePage('queue', value)}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Escalation watch"
            subtitle={
              activeCaseView === 'escalations'
                ? 'Escalation status is active. Use this side panel for a compact snapshot.'
                : 'Recent escalations requiring quality review and intervention.'
            }
          >
            <div className="space-y-3">
              {escalationsPagination.items.length > 0 ? (
              escalationsPagination.items.map((item) => (
                <article key={item.complaintId} className="rounded-2xl bg-mist p-4">
                  <p className="font-semibold text-ink">{item.complaintId}</p>
                  <p className="mt-1 text-sm text-slate">{item.institution}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">
                    {formatLevel(item.fromLevel)} to {formatLevel(item.toLevel)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate">{item.reason}</p>
                </article>
              ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                  No escalations are currently waiting in this workspace.
                </article>
              )}
            </div>
            <PaginationControls
              currentPage={escalationsPagination.currentPage}
              totalPages={escalationsPagination.totalPages}
              onChange={(value) => updatePage('escalations', value)}
            />
          </SectionCard>
        </div>
        ) : null}

        {activeWorkspace === 'team' ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard title="Team workload" subtitle="Balanced assignment improves response time and fairness.">
            <div className="space-y-4">
              {dashboard.workload.map((item) => (
                <article key={item.officerName}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">
                      {item.officerName} ({formatLevel(item.level)})
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
        ) : null}
      </section>
    </div>
  );
}

export default OfficerDashboardPage;
