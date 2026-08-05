import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  MapPin,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import QrScanPanel from '../components/QrScanPanel';
import DetailsModal, { DetailRow } from '../components/dashboard/DetailsModal';
import CaseChat from '../components/dashboard/CaseChat';
import ExportButton from '../components/dashboard/ExportButton';
import {
  acceptCitizenFeedback,
  escalateCitizenComplaint,
  fetchCitizenContext,
  fetchCitizenDashboard,
  submitCitizenComplaint,
} from '../lib/dashboardApi';

const BRAND = '#087536';

const scannedInstitutionFallback = {
  name: 'Kacyiru Sector Office',
  type: 'Government service office',
  qrCode: 'SACCFP-QR-KACYIRU-SECTOR-001',
  location: 'Kacyiru Sector, Gasabo District, City of Kigali',
  responseWindow: '3 working days',
};

const MONEY_PAID_LABELS = {
  paid: 'Yes, I paid',
  not_paid: 'No, I refused',
  unknown: 'I prefer not to say',
};

const ribReviewFallbacks = [
  {
    id: 'rib-intake',
    institutionName: 'RIB Anti-Corruption Intake Desk',
    officer: 'RIB Officer 1',
    position: 'New report review and citizen response',
  },
  {
    id: 'rib-escalation',
    institutionName: 'RIB Escalation and Final Review',
    officer: 'RIB Officer 2',
    position: 'Escalated case review and final follow-up',
  },
];

const issueCategories = {
  service_issue: [
    'Poor service or refusal to serve',
    'Unclear procedure or delayed service',
    'Staff misconduct during service delivery',
  ],
  corruption_issue: [
    'Bribery or unofficial payment request',
    'Unofficial or unknown service fee',
    'Abuse of authority (abuse of office)',
    'Intimidation after refusing corruption',
  ],
};

const STATUS_STYLES = {
  submitted: 'bg-sky-50 text-sky-700 border-sky-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  responded: 'bg-teal-50 text-teal-700 border-teal-200',
  escalated: 'bg-rose-50 text-rose-700 border-rose-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-slate-100 text-slate-600 border-slate-200',
};

/* ------------------------------------------------------------------ */
/* Data + formatting helpers                                           */
/* ------------------------------------------------------------------ */

function useCitizenData(institutionSlug = '') {
  const [state, setState] = useState({
    dashboard: null,
    context: null,
    isLoading: true,
    error: '',
  });
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let isActive = true;

    setState((current) => ({ ...current, isLoading: true, error: '' }));

    const filters = institutionSlug ? { institution: institutionSlug } : {};

    Promise.all([fetchCitizenDashboard(), fetchCitizenContext(filters)])
      .then(([dashboard, context]) => {
        if (isActive) {
          setState({ dashboard, context, isLoading: false, error: '' });
        }
      })
      .catch((error) => {
        if (isActive) {
          setState({
            dashboard: null,
            context: null,
            isLoading: false,
            error: error.message || 'Citizen dashboard data could not be loaded.',
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [institutionSlug, reloadIndex]);

  return {
    ...state,
    reload: () => setReloadIndex((value) => value + 1),
  };
}

function formatLabel(value = '') {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLocation(location = {}) {
  return [location.village, location.cell, location.sector, location.district, location.province, location.country]
    .filter(Boolean)
    .join(', ');
}

function daysUntil(value) {
  if (!value) {
    return 'No deadline';
  }

  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) {
    return 'Deadline passed';
  }

  const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? '' : 's'} left`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File could not be read.'));
    reader.readAsDataURL(file);
  });
}

async function buildFileEvidence(file, kind) {
  if (!file) {
    return null;
  }

  const dataUrl = await fileToDataUrl(file);
  const base = {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    dataUrl,
  };

  return kind === 'voice' ? { ...base, durationSeconds: 30 } : base;
}

function getDefaultTarget(context) {
  return context?.complaintTargetLeaders?.[0]?.leader?.employeeId ?? '';
}

function getDefaultAccused(context) {
  return context?.accusedLeaderOptions?.[0]?.leader?.employeeId ?? '';
}

/* ------------------------------------------------------------------ */
/* UI building blocks                                                  */
/* ------------------------------------------------------------------ */

function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div
      className="rounded-xl p-6 text-white shadow-sm"
      style={{ background: 'linear-gradient(120deg, #075126, #087536)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{eyebrow}</p>
          <h1 className="mt-1.5 max-w-3xl text-2xl font-black leading-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/80">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

function Card({ id, title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: BRAND }}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
            ) : null}
            <div>
              <h2 className="text-sm font-bold text-slate-800">{title}</h2>
              {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
            </div>
          </div>
          {action}
        </div>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function DataTable({ headers, children, minWidth = 720 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {headers.map((header) => (
              <th key={header} className="px-3 pb-3 first:pl-0 last:pr-0">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function RowButton({ onClick, tone = 'view', children }) {
  const tones = {
    view: 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600',
    solid: 'border-transparent text-white',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${tones[tone]}`}
      style={tone === 'solid' ? { backgroundColor: BRAND } : undefined}
    >
      {children}
    </button>
  );
}

function FilterChip({ isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
        isActive
          ? 'border-transparent text-white'
          : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600'
      }`}
      style={isActive ? { backgroundColor: BRAND } : undefined}
    >
      {children}
    </button>
  );
}

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-[11px] font-semibold text-slate-400">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`h-8 w-8 rounded-lg border text-[11px] font-bold transition ${
              value === page ? 'border-transparent text-white' : 'border-slate-200 text-slate-600'
            }`}
            style={value === page ? { backgroundColor: BRAND } : undefined}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function usePaged(items, pageSize) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { paged, page: safePage, pageCount, setPage };
}

function LoadingCard({ title = 'Loading citizen workflow' }) {
  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">
      {title}...
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-8 text-sm font-semibold text-rose-700 shadow-sm">
      {message}
    </div>
  );
}

function PageShell({ children }) {
  return <div className="px-4 py-6 sm:px-6 xl:px-8">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* 1. Citizen Dashboard Home                                           */
/* ------------------------------------------------------------------ */

const processSteps = [
  {
    title: 'Scan QR & Services',
    detail: 'Scan the office QR code and see services, staff, schedules, and official fees.',
    to: '/dashboard/citizen/scan-services',
    icon: QrCode,
  },
  {
    title: 'Submit Report',
    detail: 'Report corruption or poor service, select the official involved, attach evidence.',
    to: '/dashboard/citizen/submit',
    icon: Send,
  },
  {
    title: 'My Reports',
    detail: 'See submitted cases, RIB responses, deadlines, and escalation options.',
    to: '/dashboard/citizen/reports',
    icon: ClipboardList,
  },
  {
    title: 'Track Case',
    detail: 'Follow the case ID until RIB responds or the case is escalated.',
    to: '/dashboard/citizen/track',
    icon: Search,
  },
];

export function CitizenDashboardHomePage() {
  const { dashboard, context, isLoading, error } = useCitizenData();

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorCard message={error} />
      </PageShell>
    );
  }

  const cases = dashboard?.cases ?? [];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Citizen Dashboard"
        title="Report corruption after scanning an institution QR code"
        description="Scan the QR code, review services and staff, submit an evidence-based report, then track the RIB response within the three-day window."
        actions={
          <Link
            to="/dashboard/citizen/scan-services"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-emerald-50"
            style={{ color: BRAND }}
          >
            <QrCode className="h-4 w-4" />
            Start QR Process
          </Link>
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(dashboard?.kpis ?? []).slice(0, 4).map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{item.value}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {processSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.to}
              to={step.to}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                  Step {index + 1}
                </span>
              </div>
              <h2 className="mt-3 text-sm font-bold text-slate-800 group-hover:text-brand-600">{step.title}</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">{step.detail}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card
          title="Citizen identity used by RIB"
          subtitle="Verified reports keep your contact details for follow-up."
          icon={UserRound}
        >
          <div className="grid gap-3">
            <DetailRow label="Name" value={dashboard?.profile?.fullName} />
            <DetailRow label="National ID" value={dashboard?.profile?.nationalId} />
            <DetailRow label="Phone" value={dashboard?.profile?.phone || 'Not provided'} />
            <DetailRow label="Address" value={formatLocation(dashboard?.profile?.location)} />
          </div>
        </Card>

        <Card
          title="Latest citizen cases"
          subtitle="Your most recent reports with status and deadline."
          icon={ClipboardList}
          action={
            <Link
              to="/dashboard/citizen/reports"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              View All
            </Link>
          }
        >
          <DataTable headers={['Case ID', 'Category', 'Status', 'Deadline', '']} minWidth={560}>
            {cases.slice(0, 4).map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-50">
                <td className="px-3 py-3 font-semibold text-slate-800 first:pl-0">{item.id}</td>
                <td className="px-3 py-3 text-slate-600">{item.category}</td>
                <td className="px-3 py-3">
                  <StatusPill status={item.status} />
                </td>
                <td className="px-3 py-3 text-slate-500">{daysUntil(item.deadlineAt)}</td>
                <td className="px-3 py-3 last:pr-0">
                  <Link
                    to={`/dashboard/citizen/track?caseId=${item.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
                  >
                    Track
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
          {cases.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No submitted reports yet. Use Submit Report to create the first citizen case.
            </p>
          ) : null}
        </Card>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ['Visible services', context?.summary?.services ?? 0],
          ['Visible review offices', context?.summary?.leaders ?? 0],
          ['Response rule', '3 working days'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-1.5 text-lg font-black text-slate-800">{value}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Scan QR & Services                                               */
/* ------------------------------------------------------------------ */

export function CitizenScanServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const institutionSlug = searchParams.get('institution') ?? '';
  const { context, isLoading, error } = useCitizenData(institutionSlug);
  const [searchTerm, setSearchTerm] = useState('');
  const [feeFilter, setFeeFilter] = useState('all');
  // modal = { type: 'service' | 'leader', data }
  const [modal, setModal] = useState(null);

  const scannedProfile = useMemo(() => {
    const selected = context?.selectedInstitution;
    if (!selected) {
      return scannedInstitutionFallback;
    }

    return {
      name: selected.institutionName,
      type: selected.level ? `${formatLabel(selected.level)} institution` : 'Government service office',
      qrCode: `SACCFP-QR-${(selected.institutionSlug ?? '').toUpperCase()}`,
      location: formatLocation(selected.location) || scannedInstitutionFallback.location,
      responseWindow: '3 working days',
    };
  }, [context]);

  const leaderDirectory = useMemo(() => {
    const contextLeaders = (context?.complaintTargetLeaders ?? []).map((entry) => ({
      id: entry.leader.employeeId,
      institutionName: entry.institutionName,
      officer: entry.leader.fullName,
      position: entry.leader.positionTitle,
      leader: entry.leader,
      level: entry.level,
    }));

    return contextLeaders.length > 0 ? contextLeaders : ribReviewFallbacks;
  }, [context]);

  const serviceDirectory = useMemo(() => {
    const sourceServices = context?.selectedInstitution
      ? (context.selectedInstitution.services ?? []).map((service) => ({
          ...service,
          institutionName: context.selectedInstitution.institutionName,
          helpLeader: context.selectedInstitution.helpLeader,
        }))
      : context?.services ?? [];

    const realServices = sourceServices.map((service, index) => ({
      id: `${service.institutionSlug ?? service.institutionName ?? 'svc'}-${service.name}-${index}`,
      name: service.name,
      department: service.institutionName ?? 'Institution service',
      staffName:
        service.responsibleStaff?.[0]?.fullName ?? service.helpLeader?.fullName ?? 'Institution leader',
      staffTitle:
        service.responsibleStaff?.[0]?.positionTitle ??
        service.helpLeader?.positionTitle ??
        'Responsible officer',
      schedule: service.schedule || 'Working days, 08:00 - 16:00',
      feeType: service.feeType ?? 'free',
      fee:
        service.feeType === 'paid'
          ? `${Number(service.officialFeeRwf ?? 0).toLocaleString()} RWF official fee, receipt required`
          : 'Free service - no payment allowed',
      documents: service.documents || 'National ID and supporting documents where required',
      description: service.description ?? '',
      accessNote: service.accessNote ?? '',
      helpLeader: service.helpLeader ?? null,
    }));

    // No sample services here: an institution with nothing registered must show
    // an empty directory rather than another office's service list.
    return realServices;
  }, [context]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredServices = useMemo(() => {
    return serviceDirectory.filter((service) => {
      if (feeFilter !== 'all' && service.feeType !== feeFilter) {
        return false;
      }
      if (!normalizedSearchTerm) {
        return true;
      }
      return [
        service.name,
        service.department,
        service.staffName,
        service.staffTitle,
        service.schedule,
        service.fee,
        service.documents,
        service.description,
        service.accessNote,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm);
    });
  }, [serviceDirectory, feeFilter, normalizedSearchTerm]);

  const filteredLeaders = useMemo(() => {
    if (!normalizedSearchTerm) {
      return leaderDirectory;
    }

    return leaderDirectory.filter((entry) =>
      [entry.institutionName, entry.officer, entry.position, entry.level]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm),
    );
  }, [leaderDirectory, normalizedSearchTerm]);

  const servicesPaging = usePaged(filteredServices, 5);
  const leadersPaging = usePaged(filteredLeaders, 5);

  // Until a QR code is scanned there is no institution to describe, so the page
  // is the scanner and nothing else.
  if (!institutionSlug) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Scan QR & Services"
          title="Scan an institution QR code"
          description="Scan the QR code of any registered institution to see its official services, fees, schedules, and responsible staff."
        />
        <QrScanPanel onSlug={(slug) => setSearchParams({ institution: slug })} />
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorCard message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Scan QR & Services"
        title={`${scannedProfile.name} QR scan result`}
        description="Official services with responsible staff, schedules, fees, and required documents. Report from any service if something is wrong."
        actions={
          <>
            <Link
              to={`/dashboard/citizen/submit?source=qr${institutionSlug ? `&institution=${institutionSlug}` : ''}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-emerald-50"
              style={{ color: BRAND }}
            >
              <AlertTriangle className="h-4 w-4" />
              Submit Report
            </Link>
            <Link
              to="/dashboard/citizen/track"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
              Track Case
            </Link>
          </>
        }
      />

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-h-[56px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 focus-within:border-brand-300 focus-within:bg-white">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search service, staff, document, fee, or RIB leader"
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="rounded-md px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Clear
              </button>
            ) : null}
          </label>
          <div className="flex flex-wrap gap-2">
            {['certificate', 'land', 'Mutuelle', 'bribery'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSearchTerm(term)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Services found', filteredServices.length, ClipboardList],
            ['Leaders found', filteredLeaders.length, UserRound],
            ['Response rule', scannedProfile.responseWindow, CalendarDays],
            ['Evidence', 'Ready', FileText],
          ].map(([label, value, Icon]) => (
            <article key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                <Icon className="h-4 w-4" style={{ color: BRAND }} />
              </div>
              <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Scanned institution summary */}
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {[
          ['Scanned institution', scannedProfile.name, MapPin],
          ['Office type', scannedProfile.type, ShieldCheck],
          ['QR code', scannedProfile.qrCode, QrCode],
          ['Response rule', scannedProfile.responseWindow, CalendarDays],
        ].map(([label, value, Icon]) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Icon className="h-3.5 w-3.5" style={{ color: BRAND }} />
              {label}
            </div>
            <p className="mt-1.5 break-words text-sm font-bold text-slate-800">{value}</p>
          </article>
        ))}
      </div>

      {/* Services table */}
      <div className="mt-5">
        <Card
          title="Official service directory"
          subtitle="Each service shows how to get it, who handles it, the working time, official fee, and required documents."
          icon={ClipboardList}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip isActive={feeFilter === 'all'} onClick={() => setFeeFilter('all')}>
                All
              </FilterChip>
              <FilterChip isActive={feeFilter === 'free'} onClick={() => setFeeFilter('free')}>
                Free
              </FilterChip>
              <FilterChip isActive={feeFilter === 'paid'} onClick={() => setFeeFilter('paid')}>
                Paid
              </FilterChip>
            </div>
          }
        >
          <DataTable headers={['Service', 'Fee', 'Schedule', 'Responsible staff', 'Actions']} minWidth={860}>
            {servicesPaging.paged.map((service) => (
              <tr key={service.id} className="transition hover:bg-slate-50">
                <td className="px-3 py-3 first:pl-0">
                  <p className="font-semibold text-slate-800">{service.name}</p>
                  <p className="text-[11px] text-slate-400">{service.department}</p>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      service.feeType === 'paid'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {service.feeType === 'paid' ? 'Paid - official fee' : 'Free'}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600">{service.schedule}</td>
                <td className="px-3 py-3 text-slate-600">
                  {service.staffName}
                  <p className="text-[11px] text-slate-400">{service.staffTitle}</p>
                </td>
                <td className="px-3 py-3 last:pr-0">
                  <div className="flex gap-2">
                    <RowButton onClick={() => setModal({ type: 'service', data: service })}>
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </RowButton>
                    <Link
                      to={`/dashboard/citizen/submit?source=qr&issue=corruption_issue&service=${encodeURIComponent(service.name)}&staff=${encodeURIComponent(service.staffName)}${institutionSlug ? `&institution=${institutionSlug}` : ''}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: BRAND }}
                    >
                      Report
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          {filteredServices.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No service matched this search. Try a staff name, document, or fee word.
            </p>
          ) : null}
          <Pagination page={servicesPaging.page} pageCount={servicesPaging.pageCount} onChange={servicesPaging.setPage} />
        </Card>
      </div>

      {/* Leaders table */}
      <div className="mt-5">
        <Card
          title="Leaders and review offices"
          subtitle="These offices receive or review your case after you submit a report."
          icon={ShieldCheck}
        >
          <DataTable headers={['Institution', 'Leader', 'Role', 'Actions']} minWidth={680}>
            {leadersPaging.paged.map((entry) => (
              <tr key={entry.id} className="transition hover:bg-slate-50">
                <td className="px-3 py-3 font-semibold text-slate-800 first:pl-0">{entry.institutionName}</td>
                <td className="px-3 py-3 text-slate-600">{entry.officer}</td>
                <td className="px-3 py-3 text-slate-600">{entry.position}</td>
                <td className="px-3 py-3 last:pr-0">
                  {entry.leader ? (
                    <RowButton onClick={() => setModal({ type: 'leader', data: entry })}>
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </RowButton>
                  ) : (
                    <span className="text-[11px] text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
          {filteredLeaders.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No review office matched this search.</p>
          ) : null}
          <Pagination page={leadersPaging.page} pageCount={leadersPaging.pageCount} onChange={leadersPaging.setPage} />
        </Card>
      </div>

      {/* Side drawer: service details */}
      <DetailsModal
        variant="drawer"
        isOpen={modal?.type === 'service'}
        title={modal?.data?.name ?? 'Service details'}
        subtitle="Full official service information from the scanned institution."
        onClose={() => setModal(null)}
      >
        {modal?.data ? (
          <div className="grid gap-3">
            <DetailRow label="Institution / department" value={modal.data.department} />
            <DetailRow label="Description" value={modal.data.description || 'Not provided'} />
            <DetailRow label="Responsible staff" value={`${modal.data.staffName} (${modal.data.staffTitle})`} />
            <DetailRow label="Service time" value={modal.data.schedule} />
            <DetailRow label="Official fee" value={modal.data.fee} />
            {modal.data.accessNote ? <DetailRow label="Payment note" value={modal.data.accessNote} /> : null}
            <DetailRow label="Required documents" value={modal.data.documents} />
            {modal.data.helpLeader ? (
              <DetailRow
                label="Support contact"
                value={`${modal.data.helpLeader.fullName} - ${modal.data.helpLeader.phone ?? 'No phone'} - ${modal.data.helpLeader.email ?? 'No email'}`}
              />
            ) : null}
            <div className="mt-2 grid gap-2">
              <Link
                to={`/dashboard/citizen/submit?source=qr&issue=corruption_issue&service=${encodeURIComponent(modal.data.name)}&staff=${encodeURIComponent(modal.data.staffName)}${institutionSlug ? `&institution=${institutionSlug}` : ''}`}
                className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white"
                style={{ backgroundColor: BRAND }}
                onClick={() => setModal(null)}
              >
                Report Bribery on This Service
              </Link>
              <Link
                to={`/dashboard/citizen/submit?source=qr&issue=service_issue&service=${encodeURIComponent(modal.data.name)}&staff=${encodeURIComponent(modal.data.staffName)}${institutionSlug ? `&institution=${institutionSlug}` : ''}`}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-bold text-slate-700"
                onClick={() => setModal(null)}
              >
                Report Poor Service
              </Link>
            </div>
          </div>
        ) : null}
      </DetailsModal>

      {/* Side drawer: leader details */}
      <DetailsModal
        variant="drawer"
        isOpen={modal?.type === 'leader'}
        title={modal?.data?.officer ?? 'Leader details'}
        subtitle="Contact and accountability details for this review office leader."
        onClose={() => setModal(null)}
      >
        {modal?.data?.leader ? (
          <div className="grid gap-3">
            <DetailRow label="Institution" value={modal.data.institutionName} />
            <DetailRow label="Review level" value={formatLabel(modal.data.level ?? '')} />
            <DetailRow label="Position" value={modal.data.leader.positionTitle} />
            <DetailRow label="Position (Kinyarwanda)" value={modal.data.leader.positionKinyarwanda || 'Not provided'} />
            <DetailRow label="Phone" value={modal.data.leader.phone || 'No phone listed'} />
            <DetailRow label="Email" value={modal.data.leader.email || 'No email listed'} />
            <DetailRow label="Reports to" value={modal.data.leader.reportsTo || 'Not provided'} />
            <DetailRow label="Duties" value={modal.data.leader.description || 'Duties not yet published.'} />
          </div>
        ) : null}
      </DetailsModal>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Submit Report                                                    */
/* ------------------------------------------------------------------ */

// Corruption is not limited to a government desk: a citizen can be asked for a
// bribe by someone who holds no registered post and has no QR code. This form
// carries those reports — the person is described in words — straight to RIB.
function ManualCorruptionReportForm({ onBack }) {
  const [form, setForm] = useState({
    category: issueCategories.corruption_issue[0],
    reportedPersonName: '',
    reportedPersonRole: '',
    reportedPersonPhone: '',
    reportedPersonDescription: '',
    incidentLocation: '',
    incidentDate: '',
    amountRequestedRwf: '',
    moneyPaid: 'not_paid',
    paymentChannel: '',
    witnessDetails: '',
    reportingMode: 'verified',
    message: '',
  });
  const [files, setFiles] = useState({ evidenceImage: null, evidenceDocument: null, voiceNote: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedCase, setSubmittedCase] = useState(null);

  const selectClass =
    'mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-300';
  const labelClass = 'block text-xs font-bold text-slate-600';

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateFile = (event) => {
    const { name, files: selectedFiles } = event.target;
    setFiles((current) => ({ ...current, [name]: selectedFiles?.[0] ?? null }));
  };

  const submitManualReport = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmittedCase(null);

    if (!form.reportedPersonName.trim()) {
      setSubmitError('Write the name of the person you are reporting, or how they are known.');
      return;
    }

    if (form.message.trim().length < 20) {
      setSubmitError('Please explain what happened in at least 20 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const [evidenceImage, evidenceDocument, voiceNote] = await Promise.all([
        buildFileEvidence(files.evidenceImage, 'image'),
        buildFileEvidence(files.evidenceDocument, 'document'),
        buildFileEvidence(files.voiceNote, 'voice'),
      ]);

      const response = await submitCitizenComplaint({
        issueType: 'corruption_issue',
        category: form.category,
        reportingMode: form.reportingMode,
        submittedVia: 'dashboard',
        reportedPersonName: form.reportedPersonName.trim(),
        reportedPersonRole: form.reportedPersonRole.trim() || undefined,
        reportedPersonPhone: form.reportedPersonPhone.trim() || undefined,
        reportedPersonDescription: form.reportedPersonDescription.trim() || undefined,
        incidentLocation: form.incidentLocation.trim() || undefined,
        incidentDate: form.incidentDate || undefined,
        amountRequestedRwf: form.amountRequestedRwf ? Number(form.amountRequestedRwf) : undefined,
        moneyPaid: form.moneyPaid || undefined,
        paymentChannel: form.paymentChannel.trim() || undefined,
        witnessDetails: form.witnessDetails.trim() || undefined,
        message: [
          form.message.trim(),
          `Person reported: ${form.reportedPersonName.trim()}`,
          form.reportedPersonRole.trim() ? `Where they work / their role: ${form.reportedPersonRole.trim()}` : '',
          form.reportedPersonPhone.trim() ? `Their phone number: ${form.reportedPersonPhone.trim()}` : '',
          form.reportedPersonDescription.trim() ? `How to recognise them: ${form.reportedPersonDescription.trim()}` : '',
          form.incidentLocation.trim() ? `Where it happened: ${form.incidentLocation.trim()}` : '',
          form.incidentDate ? `When it happened: ${form.incidentDate}` : '',
          form.amountRequestedRwf ? `Amount asked for: ${Number(form.amountRequestedRwf).toLocaleString()} RWF` : '',
          form.moneyPaid ? `Money handed over: ${MONEY_PAID_LABELS[form.moneyPaid]}` : '',
          form.paymentChannel.trim() ? `How they asked to be paid: ${form.paymentChannel.trim()}` : '',
          form.witnessDetails.trim() ? `Witness: ${form.witnessDetails.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        evidenceImage: evidenceImage ?? undefined,
        evidenceDocument: evidenceDocument ?? undefined,
        voiceNote: voiceNote ?? undefined,
      });

      setSubmittedCase(response.item);
      setFiles({ evidenceImage: null, evidenceDocument: null, voiceNote: null });
      setForm((current) => ({ ...current, message: '' }));
    } catch (submitException) {
      setSubmitError(submitException.message || 'Report submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Card title="Reporting without a QR code" subtitle="Use this when the person is not at a government office.">
        <p className="text-sm leading-7 text-slate-600">
          Some bribery happens away from any office — a broker, an intermediary, or anyone who asks
          you for money to obtain a public service. There is no QR code to scan for them, so describe
          who they are and what they asked for.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The report goes directly to RIB national review with a case ID and the same three-day
          response window. Attach any evidence you have — a photo, a receipt, a message, or a voice
          note.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Back to reporting options
        </button>
      </Card>

      <Card title="Report form" subtitle="RIB receives this report directly.">
        <form className="space-y-4" onSubmit={submitManualReport}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={labelClass}>
              Category
              <select name="category" value={form.category} onChange={updateForm} className={selectClass}>
                {issueCategories.corruption_issue.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Person being reported
              <input
                name="reportedPersonName"
                value={form.reportedPersonName}
                onChange={updateForm}
                placeholder="Full name, or how the person is known"
                className={selectClass}
              />
            </label>
            <label className={labelClass}>
              Where they work or their role
              <input
                name="reportedPersonRole"
                value={form.reportedPersonRole}
                onChange={updateForm}
                placeholder="e.g. broker at the district market, private agent"
                className={selectClass}
              />
            </label>
            <label className={labelClass}>
              Their phone number, if you know it
              <input
                name="reportedPersonPhone"
                value={form.reportedPersonPhone}
                onChange={updateForm}
                placeholder="+250 7.. — this is what helps RIB find them"
                className={selectClass}
              />
            </label>
            <label className={labelClass}>
              Where it happened
              <input
                name="incidentLocation"
                value={form.incidentLocation}
                onChange={updateForm}
                placeholder="Village, cell, sector, or the place name"
                className={selectClass}
              />
            </label>
            <label className={labelClass}>
              When it happened
              <input
                name="incidentDate"
                type="date"
                value={form.incidentDate}
                onChange={updateForm}
                className={selectClass}
              />
            </label>
            <label className={labelClass}>
              Amount asked for (RWF)
              <input
                name="amountRequestedRwf"
                type="number"
                min="0"
                value={form.amountRequestedRwf}
                onChange={updateForm}
                placeholder="e.g. 50000"
                className={selectClass}
              />
            </label>
            <label className={labelClass}>
              Did you hand over the money?
              <select name="moneyPaid" value={form.moneyPaid} onChange={updateForm} className={selectClass}>
                <option value="not_paid">No, I refused</option>
                <option value="paid">Yes, I paid</option>
                <option value="unknown">I prefer not to say</option>
              </select>
            </label>
            <label className={labelClass}>
              How they asked to be paid
              <input
                name="paymentChannel"
                value={form.paymentChannel}
                onChange={updateForm}
                placeholder="Cash, MoMo number, or bank account they gave you"
                className={selectClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            How to recognise the person
            <input
              name="reportedPersonDescription"
              value={form.reportedPersonDescription}
              onChange={updateForm}
              placeholder="Age, height, clothing, the vehicle they use, where they are usually found"
              className={selectClass}
            />
          </label>

          <label className={labelClass}>
            Anyone who saw it happen
            <input
              name="witnessDetails"
              value={form.witnessDetails}
              onChange={updateForm}
              placeholder="Name and phone number of a witness, if there is one"
              className={selectClass}
            />
          </label>

          <label className={labelClass}>
            What happened
            <textarea
              name="message"
              value={form.message}
              onChange={updateForm}
              rows="5"
              placeholder="Explain what happened: the date, what service you were seeking, what you were asked for, how much money, and who else was present."
              className={`${selectClass} resize-y`}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['evidenceImage', 'Photo evidence', 'image/*'],
              ['evidenceDocument', 'Document evidence', '.pdf,.doc,.docx,.txt,image/*'],
              ['voiceNote', 'Voice evidence', 'audio/*'],
            ].map(([name, label, accept]) => (
              <label key={name} className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <FileText className="h-3.5 w-3.5" style={{ color: BRAND }} />
                  {label}
                </span>
                <input name={name} type="file" accept={accept} onChange={updateFile} className="mt-2 w-full text-[11px] text-slate-500" />
              </label>
            ))}
          </div>

          <label className={labelClass}>
            Reporting mode
            <select name="reportingMode" value={form.reportingMode} onChange={updateForm} className={selectClass}>
              <option value="verified">Verified citizen - RIB can identify and contact me</option>
              <option value="anonymous">Anonymous - protect my identity where possible</option>
            </select>
          </label>

          {submitError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {submitError}
            </div>
          ) : null}

          {submittedCase ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
              <span className="font-bold">Submitted:</span> {submittedCase.id}. RIB has a three-day response window.
              <div className="mt-3">
                <Link
                  to={`/dashboard/citizen/track?caseId=${submittedCase.id}`}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  Track this case
                </Link>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Sending to RIB...' : 'Send report to RIB'}
          </button>
        </form>
      </Card>
    </div>
  );
}

export function CitizenSubmitReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const institutionSlug = searchParams.get('institution') ?? '';
  const reportMode = searchParams.get('mode') ?? '';
  const { dashboard, context, isLoading, error, reload } = useCitizenData(institutionSlug);
  // SACCFP focuses on corruption reporting, so corruption is the default issue type.
  const initialIssueType = searchParams.get('issue') === 'service_issue' ? 'service_issue' : 'corruption_issue';
  const serviceFromQuery = searchParams.get('service') ?? '';
  const staffFromQuery = searchParams.get('staff') ?? '';
  const [form, setForm] = useState({
    issueType: initialIssueType,
    category: issueCategories[initialIssueType][0],
    serviceName: serviceFromQuery,
    officialInvolved: staffFromQuery,
    targetLeaderEmployeeId: '',
    accusedLeaderEmployeeIds: [],
    reportingMode: 'verified',
    message: '',
  });
  const [files, setFiles] = useState({
    evidenceImage: null,
    evidenceDocument: null,
    voiceNote: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedCase, setSubmittedCase] = useState(null);

  useEffect(() => {
    if (!context) {
      return;
    }

    setForm((current) => {
      const defaultAccused = getDefaultAccused(context);
      return {
        ...current,
        targetLeaderEmployeeId: current.targetLeaderEmployeeId || getDefaultTarget(context),
        accusedLeaderEmployeeIds:
          current.accusedLeaderEmployeeIds.length > 0 || !defaultAccused
            ? current.accusedLeaderEmployeeIds
            : [defaultAccused],
      };
    });
  }, [context]);

  const targetLeaders = context?.complaintTargetLeaders ?? [];
  const accusedOptions = context?.accusedLeaderOptions ?? [];
  const scannedOffice = context?.selectedInstitution ?? null;
  // Only the scanned institution's own services and staff are offered. Falling
  // back to a sample office would put another office's officials on a real
  // corruption report.
  const serviceOptions = useMemo(
    () => (scannedOffice?.services ?? []).map((service) => service.name),
    [scannedOffice],
  );
  const officialOptions = useMemo(
    () =>
      (scannedOffice?.accountabilityContacts ?? []).map(
        (contact) => `${contact.fullName} (${contact.positionTitle})`,
      ),
    [scannedOffice],
  );

  useEffect(() => {
    setForm((current) => {
      const next = { ...current };
      if (!serviceOptions.includes(current.serviceName)) {
        next.serviceName = serviceOptions[0] ?? '';
      }
      if (!officialOptions.includes(current.officialInvolved)) {
        next.officialInvolved = officialOptions[0] ?? '';
      }
      return next;
    });
  }, [serviceOptions, officialOptions]);

  const updateForm = (event) => {
    const { name, value } = event.target;

    if (name === 'issueType') {
      setForm((current) => ({
        ...current,
        issueType: value,
        category: issueCategories[value][0],
      }));
      setSubmittedCase(null);
      setSubmitError('');
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateAccused = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((current) => ({ ...current, accusedLeaderEmployeeIds: values }));
  };

  const updateFile = (event) => {
    const { name, files: selectedFiles } = event.target;
    setFiles((current) => ({ ...current, [name]: selectedFiles?.[0] ?? null }));
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmittedCase(null);

    if (form.message.trim().length < 20) {
      setSubmitError('Please explain the report in at least 20 characters.');
      return;
    }

    if (form.issueType === 'service_issue' && !form.targetLeaderEmployeeId) {
      setSubmitError('Select the RIB office that should receive the poor-service report.');
      return;
    }

    if (form.issueType === 'corruption_issue' && form.accusedLeaderEmployeeIds.length === 0) {
      setSubmitError('Select the official or workflow point involved in the corruption report.');
      return;
    }

    setIsSubmitting(true);

    try {
      const [evidenceImage, evidenceDocument, voiceNote] = await Promise.all([
        buildFileEvidence(files.evidenceImage, 'image'),
        buildFileEvidence(files.evidenceDocument, 'document'),
        buildFileEvidence(files.voiceNote, 'voice'),
      ]);

      const response = await submitCitizenComplaint({
        issueType: form.issueType,
        category: form.category,
        reportingMode: form.reportingMode,
        submittedVia: 'qr',
        sourceInstitutionSlug: institutionSlug || undefined,
        serviceName: form.serviceName,
        targetLeaderEmployeeId:
          form.issueType === 'service_issue' ? form.targetLeaderEmployeeId : undefined,
        accusedLeaderEmployeeIds:
          form.issueType === 'corruption_issue' ? form.accusedLeaderEmployeeIds : undefined,
        message: [
          form.message.trim(),
          `Scanned office: ${scannedOffice?.institutionName ?? scannedInstitutionFallback.name}`,
          `Service requested: ${form.serviceName}`,
          `Official selected by citizen: ${form.officialInvolved}`,
          `Citizen address: ${formatLocation(dashboard?.profile?.location)}`,
        ].join('\n'),
        evidenceImage: evidenceImage ?? undefined,
        evidenceDocument: evidenceDocument ?? undefined,
        voiceNote: voiceNote ?? undefined,
      });

      setSubmittedCase(response.item);
      setFiles({ evidenceImage: null, evidenceDocument: null, voiceNote: null });
      setForm((current) => ({ ...current, message: '' }));
      reload();
    } catch (error) {
      setSubmitError(error.message || 'Report submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Two ways in: scan the office QR so the report names its real services and
  // officials, or — when the person asking for the bribe holds no public post —
  // describe them by hand and send it straight to RIB.
  if (!institutionSlug && reportMode === 'manual') {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Submit Report"
          title="Report corruption without a QR code"
          description="Use this when the person who asked you for money does not work at a government office, so there is no QR code to scan."
        />
        <ManualCorruptionReportForm onBack={() => setSearchParams({})} />
      </PageShell>
    );
  }

  if (!institutionSlug && reportMode === 'scan') {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Submit Report"
          title="Scan the institution QR code"
          description="Scan the QR code of the office where the problem happened. Its real services and officials are then loaded into the report form."
        />
        <QrScanPanel
          onSlug={(slug) => {
            const next = new URLSearchParams(searchParams);
            next.delete('mode');
            next.set('institution', slug);
            setSearchParams(next);
          }}
        />
      </PageShell>
    );
  }

  if (!institutionSlug) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Submit Report"
          title="How do you want to report?"
          description="Choose the option that matches your situation. Both reports reach RIB with a case ID and a three-day response window."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            {
              key: 'scan',
              icon: QrCode,
              title: 'Scan an institution QR code',
              body: 'The problem happened at a government office. Scanning loads that office’s real services, official fees, and the staff responsible, so your report names them exactly.',
              action: 'Open the scanner',
            },
            {
              key: 'manual',
              icon: Send,
              title: 'Report without a QR code',
              body: 'The person who asked you for money does not work at a government office — a broker or an intermediary. Describe who they are, what they asked for, and attach any evidence.',
              action: 'Write the report',
            },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSearchParams({ mode: option.key })}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: BRAND }}
              >
                <option.icon className="h-5 w-5" />
              </span>
              <span className="mt-4 text-base font-black text-slate-900">{option.title}</span>
              <span className="mt-2 flex-1 text-sm leading-6 text-slate-500">{option.body}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: BRAND }}>
                {option.action}
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorCard message={error} />
      </PageShell>
    );
  }

  const selectClass =
    'mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-300';
  const labelClass = 'block text-xs font-bold text-slate-600';

  return (
    <PageShell>
      <PageHeader
        eyebrow="Submit Report"
        title="Report corruption to RIB with your identity and evidence"
        description="Corruption and bribery reports are routed to an independent higher review point with a three-day response rule. Poor-service issues are also accepted."
      />

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <Card
          title="Citizen identity and address"
          subtitle="RIB uses verified details for follow-up and investigation."
          icon={UserRound}
        >
          <div className="grid gap-3">
            <DetailRow label="Citizen" value={dashboard?.profile?.fullName} />
            <DetailRow label="National ID" value={dashboard?.profile?.nationalId} />
            <DetailRow label="Phone" value={dashboard?.profile?.phone} />
            <DetailRow label="Address" value={formatLocation(dashboard?.profile?.location)} />
          </div>
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-6 text-emerald-800">
            Your report receives a case ID and a three-day response window. If the response does not satisfy
            you, the case can be escalated to the next independent review level.
          </div>
        </Card>

        <Card title="Report form" subtitle="Complete the form so RIB receives the right information." icon={Send}>
          <form className="space-y-4" onSubmit={submitReport}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}>
                Issue type
                <select name="issueType" value={form.issueType} onChange={updateForm} className={selectClass}>
                  <option value="corruption_issue">Corruption or bribery</option>
                  <option value="service_issue">Poor service</option>
                </select>
              </label>

              <label className={labelClass}>
                Category
                <select name="category" value={form.category} onChange={updateForm} className={selectClass}>
                  {issueCategories[form.issueType].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}>
                Service requested
                <select name="serviceName" value={form.serviceName} onChange={updateForm} className={selectClass}>
                  {serviceOptions.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Official selected by citizen
                <select
                  name="officialInvolved"
                  value={form.officialInvolved}
                  onChange={updateForm}
                  className={selectClass}
                >
                  {officialOptions.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>

            {form.issueType === 'service_issue' ? (
              <label className={labelClass}>
                RIB office to receive poor-service report
                <select
                  name="targetLeaderEmployeeId"
                  value={form.targetLeaderEmployeeId}
                  onChange={updateForm}
                  className={selectClass}
                >
                  {targetLeaders.map((entry) => (
                    <option key={entry.leader.employeeId} value={entry.leader.employeeId}>
                      {entry.institutionName} - {entry.leader.fullName}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className={labelClass}>
                Official or workflow point being reported
                <select
                  multiple
                  value={form.accusedLeaderEmployeeIds}
                  onChange={updateAccused}
                  className={`${selectClass} min-h-28`}
                >
                  {accusedOptions.map((entry) => (
                    <option key={entry.leader.employeeId} value={entry.leader.employeeId}>
                      {entry.institutionName} - {entry.leader.fullName} ({entry.leader.positionTitle})
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-[11px] font-normal text-slate-400">
                  Hold Ctrl to select more than one person when the report involves several officials.
                </span>
              </label>
            )}

            <label className={labelClass}>
              Report details
              <textarea
                name="message"
                value={form.message}
                onChange={updateForm}
                rows="5"
                placeholder="Explain what happened: date, office, service requested, who was involved, what was asked, amount if any, and available evidence."
                className={`${selectClass} resize-y`}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['evidenceImage', 'Photo evidence', 'image/*'],
                ['evidenceDocument', 'Document evidence', '.pdf,.doc,.docx,.txt,image/*'],
                ['voiceNote', 'Voice evidence', 'audio/*'],
              ].map(([name, label, accept]) => (
                <label
                  key={name}
                  className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3"
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <FileText className="h-3.5 w-3.5" style={{ color: BRAND }} />
                    {label}
                  </span>
                  <input name={name} type="file" accept={accept} onChange={updateFile} className="mt-2 w-full text-[11px] text-slate-500" />
                </label>
              ))}
            </div>

            <label className={labelClass}>
              Reporting mode
              <select name="reportingMode" value={form.reportingMode} onChange={updateForm} className={selectClass}>
                <option value="verified">Verified citizen - RIB can identify and contact me</option>
                <option value="anonymous">Anonymous - protect my identity where possible</option>
              </select>
            </label>

            {submitError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {submitError}
              </div>
            ) : null}

            {submittedCase ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
                <span className="font-bold">Submitted:</span> {submittedCase.id}. RIB has a three-day response window.
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/dashboard/citizen/track?caseId=${submittedCase.id}`}
                    className="rounded-lg px-4 py-2 text-xs font-bold text-white"
                    style={{ backgroundColor: BRAND }}
                  >
                    Track Case
                  </Link>
                  <Link
                    to="/dashboard/citizen/reports"
                    className="rounded-lg border border-emerald-300 px-4 py-2 text-xs font-bold text-emerald-800"
                  >
                    My Reports
                  </Link>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit to RIB'}
            </button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* 4. My Reports                                                       */
/* ------------------------------------------------------------------ */

const STATUS_FILTERS = ['all', 'submitted', 'in_review', 'responded', 'escalated', 'resolved'];

export function CitizenMyReportsPage() {
  const { dashboard, isLoading, error, reload } = useCitizenData();
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeActionId, setActiveActionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsCase, setDetailsCase] = useState(null);

  const cases = useMemo(() => dashboard?.cases ?? [], [dashboard]);
  const filteredCases = useMemo(
    () => (statusFilter === 'all' ? cases : cases.filter((item) => item.status === statusFilter)),
    [cases, statusFilter],
  );
  const paging = usePaged(filteredCases, 4);

  const runCaseAction = async (caseId, action) => {
    setActiveActionId(`${action}-${caseId}`);
    setActionMessage('');
    setActionError('');

    try {
      if (action === 'accept') {
        await acceptCitizenFeedback(caseId, { note: 'Citizen accepted the official response.' });
        setActionMessage(`${caseId} was closed after citizen feedback acceptance.`);
      } else {
        await escalateCitizenComplaint(caseId, {
          note: 'Citizen requested further RIB review because the feedback was not satisfactory.',
        });
        setActionMessage(`${caseId} was escalated for further RIB follow-up.`);
      }
      reload();
    } catch (error) {
      setActionError(error.message || 'Case action failed.');
    } finally {
      setActiveActionId('');
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorCard message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="My Reports"
        title="Your reports, RIB responses, and escalation state"
        description="Every case stays visible with status, deadline, response, evidence, and escalation options — no repeated office visits."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg bg-white/95">
              <ExportButton
                dataset="cases"
                label="Export My Reports"
                onError={setActionError}
              />
            </div>
            <Link
              to="/dashboard/citizen/submit"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-emerald-50"
              style={{ color: BRAND }}
            >
              <Send className="h-4 w-4" />
              New Report
            </Link>
          </div>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((status) => (
          <FilterChip
            key={status}
            isActive={statusFilter === status}
            onClick={() => {
              setStatusFilter(status);
              paging.setPage(1);
            }}
          >
            {status === 'all' ? `All (${cases.length})` : formatLabel(status)}
          </FilterChip>
        ))}
      </div>

      {actionMessage ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {actionMessage}
        </div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {actionError}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {paging.paged.map((item) => (
          <section key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-slate-800">{item.id}</p>
                <p className="mt-0.5 text-sm text-slate-500">{item.category}</p>
              </div>
              <StatusPill status={item.status} />
            </div>

            <div className="mt-4 grid gap-2 text-[13px] text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
              <p className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-bold text-slate-800">Issue:</span> {formatLabel(item.issueType)}
              </p>
              <p className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-bold text-slate-800">RIB officer:</span> {item.assignedOfficer}
              </p>
              <p className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-bold text-slate-800">Deadline:</span> {daysUntil(item.deadlineAt)}
              </p>
              <p className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-bold text-slate-800">Level:</span> {formatLabel(item.currentLevel)}
              </p>
            </div>

            {item.response ? (
              <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-[13px] leading-6 text-teal-900">
                <p className="font-bold">RIB response from {item.response.respondedByName}</p>
                <p className="mt-1">{item.response.message}</p>
                {item.response.actionTaken ? <p className="mt-1 text-teal-700">Action: {item.response.actionTaken}</p> : null}
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-[13px] text-slate-500">
                Awaiting RIB response. The case remains visible during the three-day response window.
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <RowButton onClick={() => setDetailsCase(item)}>
                <Eye className="h-3.5 w-3.5" />
                View Details
              </RowButton>
              <Link
                to={`/dashboard/citizen/track?caseId=${item.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: BRAND }}
              >
                Track Case
              </Link>
              {item.canAcceptFeedback ? (
                <button
                  type="button"
                  onClick={() => runCaseAction(item.id, 'accept')}
                  disabled={activeActionId === `accept-${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-60"
                >
                  Accept Response
                </button>
              ) : null}
              {item.canEscalate ? (
                <button
                  type="button"
                  onClick={() => runCaseAction(item.id, 'escalate')}
                  disabled={activeActionId === `escalate-${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 disabled:opacity-60"
                >
                  Escalate
                </button>
              ) : null}
            </div>
          </section>
        ))}
        {filteredCases.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            {cases.length === 0
              ? 'No reports yet. Submit the first QR-based report and it will appear here with status and RIB follow-up.'
              : 'No case matches this status filter.'}
          </div>
        ) : null}
      </div>

      <Pagination page={paging.page} pageCount={paging.pageCount} onChange={paging.setPage} />

      {/* Side drawer: full case details */}
      <DetailsModal
        variant="drawer"
        isOpen={Boolean(detailsCase)}
        title={detailsCase ? `Case ${detailsCase.id}` : 'Case details'}
        subtitle="Complete case record: report, evidence, responses, and escalation history."
        onClose={() => setDetailsCase(null)}
      >
        {detailsCase ? (
          <div className="space-y-4">
            <div className="grid gap-3">
              <DetailRow label="Status" value={formatLabel(detailsCase.status)} />
              <DetailRow label="Issue type" value={formatLabel(detailsCase.issueType)} />
              <DetailRow label="Category" value={detailsCase.category} />
              <DetailRow label="Current level" value={formatLabel(detailsCase.currentLevel)} />
              <DetailRow label="Assigned officer" value={detailsCase.assignedOfficer} />
              <DetailRow label="Reporting mode" value={formatLabel(detailsCase.reportingMode)} />
              <DetailRow label="Submitted" value={formatDate(detailsCase.submittedAt)} />
              <DetailRow
                label="Response deadline"
                value={`${formatDate(detailsCase.deadlineAt)} (${daysUntil(detailsCase.deadlineAt)})`}
              />
              {detailsCase.sourceInstitution ? (
                <DetailRow label="Scanned institution" value={detailsCase.sourceInstitution.institutionName} />
              ) : null}
              {detailsCase.sourceInstitution?.serviceName ? (
                <DetailRow label="Service involved" value={detailsCase.sourceInstitution.serviceName} />
              ) : null}
            </div>

            <div className="rounded-lg bg-mist px-4 py-3">
              <p className="text-sm font-bold text-ink">Report message</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">{detailsCase.message}</p>
            </div>

            {detailsCase.accusedLeaders?.length > 0 ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Accused officials</p>
                <div className="mt-2 space-y-1.5">
                  {detailsCase.accusedLeaders.map((leader) => (
                    <p key={leader.leaderEmployeeId} className="text-sm text-slate">
                      {leader.leaderName} - {leader.positionTitle ?? 'Official'} ({leader.institutionName})
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg bg-mist px-4 py-3">
              <p className="text-sm font-bold text-ink">Evidence attached</p>
              <div className="mt-2 space-y-3">
                {detailsCase.evidenceImage?.dataUrl ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate">Photo evidence</p>
                    <img
                      src={detailsCase.evidenceImage.dataUrl}
                      alt={`Evidence for ${detailsCase.id}`}
                      className="mt-1.5 max-h-44 rounded-lg border border-ink/10 object-contain"
                    />
                  </div>
                ) : null}
                {detailsCase.evidenceDocument ? (
                  <p className="text-sm text-slate">Document: {detailsCase.evidenceDocument.name}</p>
                ) : null}
                {detailsCase.voiceNote?.dataUrl ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate">Voice note</p>
                    <audio controls src={detailsCase.voiceNote.dataUrl} className="mt-1.5 w-full" />
                  </div>
                ) : null}
                {!detailsCase.evidenceImage && !detailsCase.evidenceDocument && !detailsCase.voiceNote ? (
                  <p className="text-sm text-slate">No evidence files were attached to this report.</p>
                ) : null}
              </div>
            </div>

            {(detailsCase.responses ?? []).length > 0 ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Official responses</p>
                <div className="mt-2 space-y-2">
                  {detailsCase.responses.map((entry) => (
                    <div
                      key={`${entry.respondedAt}-${entry.respondedByEmployeeId}`}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm leading-6 text-teal-900"
                    >
                      <p className="font-bold">
                        {entry.respondedByName} ({formatLabel(entry.level ?? '')}) - {formatDate(entry.respondedAt)}
                      </p>
                      <p className="mt-1">{entry.message}</p>
                      {entry.actionTaken ? <p className="mt-1 text-teal-700">Action: {entry.actionTaken}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(detailsCase.escalationHistory ?? []).length > 0 ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Escalation history</p>
                <div className="mt-2 space-y-1.5">
                  {detailsCase.escalationHistory.map((entry) => (
                    <p key={`${entry.toLevel}-${entry.escalatedAt}`} className="text-sm leading-6 text-slate">
                      {formatDate(entry.escalatedAt)}: {formatLabel(entry.fromLevel)} → {formatLabel(entry.toLevel)} —{' '}
                      {entry.reason}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailsModal>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Track Case                                                       */
/* ------------------------------------------------------------------ */

const TRACK_STATUS_INFO = {
  submitted: {
    label: 'Submitted',
    message: 'Your report was received and is waiting for a RIB officer to pick it up.',
    icon: ClipboardList,
    accent: '#0284c7',
    soft: 'bg-sky-50 text-sky-700',
  },
  in_review: {
    label: 'In review',
    message: 'A RIB officer is reviewing your report and the evidence you shared.',
    icon: Eye,
    accent: '#d97706',
    soft: 'bg-amber-50 text-amber-700',
  },
  responded: {
    label: 'Responded',
    message: 'The RIB officer replied. Read the response below and tell them if it solved your issue.',
    icon: Send,
    accent: '#0d9488',
    soft: 'bg-teal-50 text-teal-700',
  },
  escalated: {
    label: 'Escalated',
    message: 'Your case was moved to a higher RIB level for deeper review.',
    icon: ArrowRight,
    accent: '#e11d48',
    soft: 'bg-rose-50 text-rose-700',
  },
  resolved: {
    label: 'Resolved',
    message: 'This case is closed and marked resolved. Thank you for reporting.',
    icon: ShieldCheck,
    accent: '#059669',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: 'Closed',
    message: 'This case was closed without further action.',
    icon: AlertTriangle,
    accent: '#64748b',
    soft: 'bg-slate-100 text-slate-600',
  },
};

const LIFECYCLE_STEPS = ['Submitted', 'In review', 'Responded', 'Resolved'];

function statusToStepIndex(status) {
  switch (status) {
    case 'submitted':
      return 0;
    case 'in_review':
    case 'escalated':
      return 1;
    case 'responded':
      return 2;
    case 'resolved':
    case 'rejected':
      return 3;
    default:
      return 0;
  }
}

export function CitizenTrackCasePage() {
  const [searchParams] = useSearchParams();
  const { dashboard, isLoading, error } = useCitizenData();
  const [caseId, setCaseId] = useState(searchParams.get('caseId') ?? '');
  const [threadCase, setThreadCase] = useState(null);

  const cases = useMemo(() => dashboard?.cases ?? [], [dashboard]);
  const activeCase = useMemo(() => {
    if (cases.length === 0) {
      return null;
    }

    if (!caseId.trim()) {
      return cases[0];
    }

    return cases.find((item) => item.id.toLowerCase() === caseId.trim().toLowerCase()) ?? null;
  }, [caseId, cases]);

  useEffect(() => {
    if (!caseId && cases[0]?.id) {
      setCaseId(cases[0].id);
    }
  }, [caseId, cases]);

  const timeline = useMemo(() => {
    if (!activeCase) {
      return [];
    }

    const baseTimeline = [
      {
        title: 'Report submitted',
        date: activeCase.submittedAt,
        detail: `Citizen submitted the case through ${formatLabel(activeCase.submittedVia)} reporting.`,
      },
      {
        title: 'Routed to RIB',
        date: activeCase.submittedAt,
        detail: `Assigned to ${activeCase.assignedOfficer} at ${formatLabel(activeCase.currentLevel)} level.`,
      },
      {
        title: 'Three-day response window',
        date: activeCase.deadlineAt,
        detail: daysUntil(activeCase.deadlineAt),
      },
    ];

    if (activeCase.response) {
      baseTimeline.push({
        title: 'RIB response added',
        date: activeCase.response.respondedAt,
        detail: activeCase.response.message,
      });
    } else {
      baseTimeline.push({
        title: 'Awaiting RIB response',
        date: activeCase.updatedAt,
        detail: 'The citizen can keep tracking the case without returning to the office.',
      });
    }

    (activeCase.escalationHistory ?? []).forEach((entry) => {
      baseTimeline.push({
        title: `Escalated to ${formatLabel(entry.toLevel)}`,
        date: entry.escalatedAt,
        detail: entry.reason,
      });
    });

    return baseTimeline;
  }, [activeCase]);

  const statusInfo = activeCase
    ? TRACK_STATUS_INFO[activeCase.status] ?? TRACK_STATUS_INFO.submitted
    : null;
  const stepIndex = activeCase ? statusToStepIndex(activeCase.status) : 0;
  const deadlineLabel = activeCase ? daysUntil(activeCase.deadlineAt) : '';
  const deadlineUrgent = deadlineLabel === 'Deadline passed' || deadlineLabel === '1 day left';

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorCard message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Track Case"
        title="Follow the RIB response instead of repeated visits"
        description="Tracking shows case status, assigned RIB officer, deadline, response, and escalation history."
      />

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.62fr_1.38fr]">
        <Card title="Your reports" subtitle="Search a case ID or pick one below." icon={Search}>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-300">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={caseId}
              onChange={(event) => setCaseId(event.target.value)}
              placeholder="Example: CF-2026-0101"
              className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="mt-3 space-y-2">
            {cases.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-[13px] text-slate-500">
                You have no reports yet. Submit a report to start tracking it here.
              </p>
            ) : null}
            {cases.slice(0, 8).map((item) => {
              const isActive = activeCase?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCaseId(item.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-brand-300 bg-emerald-50 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-brand-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-slate-800">{item.id}</span>
                    <StatusPill status={item.status} />
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">{item.category}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {activeCase && statusInfo ? (
          <div className="space-y-4">
            {/* Status hero */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start gap-4 p-5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: statusInfo.accent }}
                >
                  <statusInfo.icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">Case {activeCase.id}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusInfo.soft}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">{statusInfo.message}</p>
                </div>
                <div
                  className={`rounded-xl px-4 py-3 text-center ${
                    deadlineUrgent ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                    <Clock className="h-3.5 w-3.5" /> Deadline
                  </p>
                  <p className="mt-1 text-sm font-black">{deadlineLabel}</p>
                </div>
              </div>

              {/* Progress stepper */}
              <div className="border-t border-slate-100 px-5 py-5">
                <div className="flex items-center">
                  {LIFECYCLE_STEPS.map((label, index) => {
                    const done = index <= stepIndex;
                    const isCurrent = index === stepIndex;
                    return (
                      <div key={label} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black transition ${
                              done ? 'text-white' : 'bg-slate-100 text-slate-400'
                            } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                            style={done ? { backgroundColor: BRAND } : undefined}
                          >
                            {done ? <Check className="h-4 w-4" /> : index + 1}
                          </span>
                          <span
                            className={`mt-2 text-center text-[11px] font-semibold ${
                              done ? 'text-slate-700' : 'text-slate-400'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                        {index < LIFECYCLE_STEPS.length - 1 ? (
                          <span
                            className={`mx-1 mb-5 h-0.5 flex-1 rounded ${
                              index < stepIndex ? '' : 'bg-slate-100'
                            }`}
                            style={index < stepIndex ? { backgroundColor: BRAND } : undefined}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Key facts */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Assigned RIB', value: activeCase.assignedOfficer, icon: UserRound },
                { label: 'Current level', value: formatLabel(activeCase.currentLevel), icon: MapPin },
                { label: 'Reported via', value: formatLabel(activeCase.submittedVia), icon: QrCode },
                { label: 'Category', value: formatLabel(activeCase.category), icon: FileText },
              ].map((fact) => (
                <article key={fact.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50" style={{ color: BRAND }}>
                    <fact.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{fact.label}</p>
                  <p className="mt-1 text-[13px] font-bold text-slate-800">{fact.value || '—'}</p>
                </article>
              ))}
            </div>

            {/* RIB response callout */}
            {activeCase.response ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-black text-teal-800">
                  <Send className="h-4 w-4" /> Response from {activeCase.assignedOfficer}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-teal-900">{activeCase.response.message}</p>
                <p className="mt-2 text-[11px] font-semibold text-teal-600">{formatDate(activeCase.response.respondedAt)}</p>
              </div>
            ) : null}

            {/* Timeline */}
            <Card title="Case history" subtitle="Every step is recorded so you never lose track." icon={CalendarDays}>
              <ol className="relative space-y-6">
                {timeline.map((item, index) => {
                  const pending = /awaiting/i.test(item.title);
                  const isLast = index === timeline.length - 1;
                  return (
                    <li key={`${item.title}-${item.date}`} className="relative flex gap-4">
                      {!isLast ? (
                        <span className="absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-0.5 bg-slate-100" aria-hidden />
                      ) : null}
                      <span
                        className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          pending ? 'border-2 border-dashed border-slate-300 bg-white text-slate-400' : 'text-white'
                        }`}
                        style={pending ? undefined : { backgroundColor: BRAND }}
                      >
                        {pending ? <Clock className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800">{item.title}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <p className="mt-1 text-[13px] leading-6 text-slate-500">{item.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>

            <CaseChat
              caseData={threadCase && threadCase.id === activeCase.id ? threadCase : activeCase}
              viewerRole="citizen"
              onSent={setThreadCase}
            />
          </div>
        ) : (
          <Card title="Case not found" subtitle="Check the case ID and try again." icon={ClipboardList}>
            <p className="rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No citizen report matches that case ID in this account.
            </p>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
