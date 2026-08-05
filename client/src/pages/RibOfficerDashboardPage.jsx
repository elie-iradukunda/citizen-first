import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CornerUpRight,
  Eye,
  FileText,
  Inbox,
  Send,
  ShieldCheck,
} from 'lucide-react';
import DetailsModal, { DetailRow } from '../components/dashboard/DetailsModal';
import CaseChat from '../components/dashboard/CaseChat';
import ExportButton from '../components/dashboard/ExportButton';
import { useAuth } from '../context/AuthContext';
import { fetchOfficerDashboard, submitOfficerComplaintResponse } from '../lib/dashboardApi';

const BRAND = '#087536';

const STATUS_STYLES = {
  submitted: 'bg-sky-50 text-sky-700 border-sky-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  responded: 'bg-teal-50 text-teal-700 border-teal-200',
  escalated: 'bg-rose-50 text-rose-700 border-rose-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function formatLabel(value = '') {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(item) {
  return (
    ['submitted', 'in_review', 'escalated'].includes(item.status) &&
    new Date(item.deadlineAt).getTime() < Date.now()
  );
}

function deadlineText(item) {
  if (!item.deadlineAt) {
    return 'No deadline';
  }

  const remaining = new Date(item.deadlineAt).getTime() - Date.now();
  if (remaining <= 0) {
    return 'Deadline passed';
  }

  const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? '' : 's'} left`;
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

function Card({ id, title, subtitle, icon: Icon, action, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-sm">
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
      <div className="px-5 py-4">{children}</div>
    </section>
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

function EvidencePills({ item }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {item.evidenceImage ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Photo</span>
      ) : null}
      {item.evidenceDocument ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Document</span>
      ) : null}
      {item.voiceNote ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Voice</span>
      ) : null}
      {!item.evidenceImage && !item.evidenceDocument && !item.voiceNote ? (
        <span className="text-[10px] text-slate-300">None</span>
      ) : null}
    </span>
  );
}

function MiniCaseRow({ item, onView, extra }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-slate-800">
          {item.id} <span className="font-normal text-slate-400">· {item.category}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {formatLabel(item.currentLevel)} · {deadlineText(item)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {extra}
        <RowButton onClick={onView}>
          <Eye className="h-3.5 w-3.5" />
          View
        </RowButton>
      </div>
    </div>
  );
}

function RibOfficerDashboardPage() {
  const { user } = useAuth();
  const isOfficer2 = user?.role === 'rib_officer_2';

  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState(isOfficer2 ? 'escalated' : 'all');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');

  // modal = { type: 'view' | 'respond', data }
  const [modal, setModal] = useState(null);
  const [responseForm, setResponseForm] = useState({ message: '', actionTaken: '' });
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadDashboard = useCallback(() => {
    setIsLoading(true);
    setLoadError('');

    fetchOfficerDashboard()
      .then((payload) => setDashboard(payload))
      .catch((error) => setLoadError(error.message || 'Officer dashboard could not be loaded.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const queue = useMemo(() => dashboard?.queue ?? [], [dashboard]);
  const overdueCases = useMemo(() => queue.filter(isOverdue), [queue]);
  const evidenceCases = useMemo(
    () => queue.filter((item) => item.evidenceImage || item.evidenceDocument || item.voiceNote),
    [queue],
  );
  const respondableCases = useMemo(() => queue.filter((item) => item.canRespond), [queue]);
  const recentResolved = dashboard?.recentResolved ?? [];
  const escalationWatch = dashboard?.escalationWatch ?? [];

  const filteredQueue = useMemo(() => {
    if (statusFilter === 'all') {
      return queue;
    }
    if (statusFilter === 'overdue') {
      return overdueCases;
    }
    return queue.filter((item) => item.status === statusFilter);
  }, [queue, overdueCases, statusFilter]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredQueue.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedQueue = filteredQueue.slice((safePage - 1) * pageSize, safePage * pageSize);

  const closeModal = () => {
    setModal(null);
    setModalError('');
    setIsSaving(false);
  };

  const openRespond = (item) => {
    setResponseForm({ message: '', actionTaken: '' });
    setModal({ type: 'respond', data: item });
    setModalError('');
  };

  const sendResponse = async () => {
    if (responseForm.message.trim().length < 12) {
      setModalError('Write a response of at least 12 characters for the citizen.');
      return;
    }

    setIsSaving(true);
    setModalError('');

    try {
      await submitOfficerComplaintResponse(modal.data.id, {
        message: responseForm.message.trim(),
        actionTaken: responseForm.actionTaken.trim() || undefined,
      });
      setNotice(`Response recorded for ${modal.data.id}. The citizen can now accept or escalate.`);
      closeModal();
      loadDashboard();
    } catch (error) {
      setModalError(error.message || 'Response could not be recorded.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-8 sm:px-6 xl:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">
          Loading RIB case workflow...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-4 py-8 sm:px-6 xl:px-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-sm font-semibold text-rose-700 shadow-sm">
          {loadError}
        </div>
      </div>
    );
  }

  const manager = dashboard?.managerProfile ?? {};
  const kpis = (dashboard?.kpis ?? []).slice(0, 4);
  const queueSectionId = isOfficer2 ? 'escalated-reports' : 'new-reports';
  const evidenceSectionId = isOfficer2 ? 'final-review' : 'review-evidence';
  const deadlineSectionId = isOfficer2 ? 'overdue-cases' : 'response-window';
  const respondSectionId = isOfficer2 ? 'status-update' : 'respond';
  const summarySectionId = isOfficer2 ? 'follow-up' : 'escalate';

  return (
    <div className="px-4 py-6 sm:px-6 xl:px-8">
      {/* Header */}
      <div
        className="rounded-xl p-6 text-white shadow-sm"
        style={{ background: 'linear-gradient(120deg, #075126, #087536)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              {isOfficer2 ? 'RIB Officer 2 - Escalation Review' : 'RIB Officer 1 - Case Intake'}
            </p>
            <h1 className="mt-1.5 max-w-3xl text-2xl font-black leading-tight">
              {manager.title ?? 'RIB case review dashboard'}
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/80">
              {manager.scopeLabel ?? 'Citizen report review'} · Response rule:{' '}
              {manager.responseWindow ?? '3 working days per level'}.
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Open queue</p>
            <p className="mt-1 text-2xl font-black">{queue.length}</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{item.value}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.note}</p>
          </article>
        ))}
      </div>

      {notice ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {notice}
        </div>
      ) : null}

      {/* Case queue */}
      <div className="mt-5">
        <Card
          id={queueSectionId}
          title={isOfficer2 ? 'Escalated reports' : 'New reports and case queue'}
          subtitle="Citizen reports in your review scope, ordered by response deadline."
          icon={Inbox}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <ExportButton dataset="cases" label="Export Cases" onError={setNotice} />
              {['all', 'submitted', 'in_review', 'escalated', 'overdue'].map((status) => (
                <FilterChip
                  key={status}
                  isActive={statusFilter === status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                >
                  {status === 'all'
                    ? `All (${queue.length})`
                    : status === 'overdue'
                      ? `Overdue (${overdueCases.length})`
                      : formatLabel(status)}
                </FilterChip>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]" style={{ minWidth: 920 }}>
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {['Case ID', 'Category', 'Institution', 'Level', 'Evidence', 'Deadline', 'Status', 'Actions'].map(
                    (header) => (
                      <th key={header} className="px-3 pb-3 first:pl-0 last:pr-0">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedQueue.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-3 py-3 first:pl-0">
                      <p className="font-semibold text-slate-800">{item.id}</p>
                      <p className="text-[11px] text-slate-400">{formatLabel(item.reportingMode)}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {item.category}
                      <p className="text-[11px] text-slate-400">{formatLabel(item.issueType)}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{item.institution}</td>
                    <td className="px-3 py-3 text-slate-600">{formatLabel(item.currentLevel)}</td>
                    <td className="px-3 py-3">
                      <EvidencePills item={item} />
                    </td>
                    <td className="px-3 py-3">
                      <span className={isOverdue(item) ? 'font-bold text-rose-600' : 'text-slate-500'}>
                        {deadlineText(item)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-3 py-3 last:pr-0">
                      <div className="flex gap-2">
                        <RowButton onClick={() => setModal({ type: 'view', data: item })}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </RowButton>
                        {item.canRespond ? (
                          <RowButton tone="solid" onClick={() => openRespond(item)}>
                            <Send className="h-3.5 w-3.5" />
                            Respond
                          </RowButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredQueue.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No case matches this filter.</p>
          ) : null}
          <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
        </Card>
      </div>

      {/* Evidence + deadline row */}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card
          id={evidenceSectionId}
          title={isOfficer2 ? 'Final evidence review' : 'Review evidence'}
          subtitle="Cases with photos, documents, or voice notes attached by the citizen."
          icon={FileText}
        >
          <div className="space-y-2">
            {evidenceCases.slice(0, 4).map((item) => (
              <MiniCaseRow
                key={item.id}
                item={item}
                onView={() => setModal({ type: 'view', data: item })}
                extra={<EvidencePills item={item} />}
              />
            ))}
            {evidenceCases.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No open case has attached evidence.</p>
            ) : null}
          </div>
        </Card>

        <Card
          id={deadlineSectionId}
          title={isOfficer2 ? 'Overdue cases' : '3-day response window'}
          subtitle="Every report must receive an official response within 3 working days."
          icon={CalendarClock}
        >
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Within window</p>
              <p className="mt-1 text-2xl font-black text-slate-800">{queue.length - overdueCases.length}</p>
            </div>
            <div className="rounded-lg bg-rose-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-500">Overdue</p>
              <p className="mt-1 text-2xl font-black text-rose-600">{overdueCases.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {(overdueCases.length > 0 ? overdueCases : queue).slice(0, 3).map((item) => (
              <MiniCaseRow key={item.id} item={item} onView={() => setModal({ type: 'view', data: item })} />
            ))}
          </div>
        </Card>
      </div>

      {/* Respond + escalation row */}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card
          id={respondSectionId}
          title={isOfficer2 ? 'Final response and status update' : 'Respond to citizen'}
          subtitle="Record the official action so the citizen can accept the feedback or escalate."
          icon={Send}
        >
          <div className="space-y-2">
            {respondableCases.slice(0, 4).map((item) => (
              <MiniCaseRow
                key={item.id}
                item={item}
                onView={() => setModal({ type: 'view', data: item })}
                extra={
                  <RowButton tone="solid" onClick={() => openRespond(item)}>
                    <Send className="h-3.5 w-3.5" />
                    Respond
                  </RowButton>
                }
              />
            ))}
            {respondableCases.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No case is waiting for your response right now.
              </p>
            ) : null}
          </div>
        </Card>

        <Card
          id={summarySectionId}
          title={isOfficer2 ? 'Follow-up summary' : 'Escalation watch'}
          subtitle={
            isOfficer2
              ? 'Recently resolved cases with confirmed citizen feedback.'
              : 'Cases moved to a higher review level for independent follow-up.'
          }
          icon={isOfficer2 ? ShieldCheck : CornerUpRight}
        >
          <div className="space-y-2">
            {(isOfficer2 ? recentResolved : escalationWatch.length > 0 ? escalationWatch : queue.filter((item) => item.status === 'escalated'))
              .slice(0, 4)
              .map((item) => (
                <MiniCaseRow key={item.id} item={item} onView={() => setModal({ type: 'view', data: item })} />
              ))}
            {(isOfficer2 ? recentResolved : escalationWatch).length === 0 &&
            queue.filter((item) => item.status === 'escalated').length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                {isOfficer2 ? 'No resolved case yet.' : 'No case is currently escalated.'}
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Case details drawer */}
      <DetailsModal
        variant="drawer"
        isOpen={modal?.type === 'view'}
        title={modal?.data ? `Case ${modal.data.id}` : 'Case details'}
        subtitle="Full citizen report with evidence, reporter identity, and history."
        onClose={closeModal}
        footer={
          modal?.data?.canRespond ? (
            <button
              type="button"
              onClick={() => openRespond(modal.data)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: BRAND }}
            >
              <Send className="h-4 w-4" />
              Respond to This Case
            </button>
          ) : null
        }
      >
        {modal?.data ? (
          <div className="space-y-4">
            <div className="grid gap-3">
              <DetailRow label="Status" value={formatLabel(modal.data.status)} />
              <DetailRow label="Category" value={modal.data.category} />
              <DetailRow label="Issue type" value={formatLabel(modal.data.issueType)} />
              <DetailRow label="Current level" value={formatLabel(modal.data.currentLevel)} />
              <DetailRow label="Institution" value={modal.data.institution} />
              <DetailRow label="Reporting mode" value={formatLabel(modal.data.reportingMode)} />
              <DetailRow label="Submitted" value={formatDate(modal.data.submittedAt)} />
              <DetailRow label="Deadline" value={`${formatDate(modal.data.deadlineAt)} (${deadlineText(modal.data)})`} />
              {modal.data.sourceInstitution ? (
                <DetailRow label="Scanned institution" value={modal.data.sourceInstitution.institutionName} />
              ) : null}
            </div>

            {modal.data.reporterProfile ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Reporter (verified)</p>
                <p className="mt-1.5 text-sm leading-6 text-slate">
                  {modal.data.reporterProfile.fullName} · {modal.data.reporterProfile.phone ?? 'No phone'} ·{' '}
                  {modal.data.reporterProfile.email ?? 'No email'}
                </p>
              </div>
            ) : (
              // Without this the hidden reporter reads as missing data and an
              // officer goes looking for the name elsewhere.
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-bold text-amber-900">Anonymous report — reporter protected</p>
                <p className="mt-1.5 text-sm leading-6 text-amber-800">
                  This citizen chose to report anonymously. Their identity and exact location are
                  withheld from every reviewer, including national oversight. Review the case on its
                  evidence and act on the account given here.
                </p>
              </div>
            )}

            <div className="rounded-lg bg-mist px-4 py-3">
              <p className="text-sm font-bold text-ink">Report message</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">{modal.data.message}</p>
            </div>

            {modal.data.accusedLeaders?.length > 0 ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Accused officials</p>
                <div className="mt-2 space-y-1.5">
                  {modal.data.accusedLeaders.map((leader) => (
                    <p key={leader.leaderEmployeeId} className="text-sm text-slate">
                      {leader.leaderName} - {leader.positionTitle ?? 'Official'} ({leader.institutionName})
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg bg-mist px-4 py-3">
              <p className="text-sm font-bold text-ink">Evidence</p>
              <div className="mt-2 space-y-3">
                {modal.data.evidenceImage?.dataUrl ? (
                  <img
                    src={modal.data.evidenceImage.dataUrl}
                    alt={`Evidence for ${modal.data.id}`}
                    className="max-h-44 rounded-lg border border-ink/10 object-contain"
                  />
                ) : null}
                {modal.data.evidenceDocument ? (
                  <p className="text-sm text-slate">Document: {modal.data.evidenceDocument.name}</p>
                ) : null}
                {modal.data.voiceNote?.dataUrl ? (
                  <audio controls src={modal.data.voiceNote.dataUrl} className="w-full" />
                ) : null}
                {!modal.data.evidenceImage && !modal.data.evidenceDocument && !modal.data.voiceNote ? (
                  <p className="text-sm text-slate">No evidence files attached.</p>
                ) : null}
              </div>
            </div>

            {(modal.data.responses ?? []).length > 0 ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Response history</p>
                <div className="mt-2 space-y-2">
                  {modal.data.responses.map((entry) => (
                    <div
                      key={`${entry.respondedAt}-${entry.respondedByEmployeeId}`}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm leading-6 text-teal-900"
                    >
                      <p className="font-bold">
                        {entry.respondedByName} ({formatLabel(entry.level ?? '')}) - {formatDate(entry.respondedAt)}
                      </p>
                      <p className="mt-1">{entry.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(modal.data.escalationHistory ?? []).length > 0 ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Escalation history</p>
                <div className="mt-2 space-y-1.5">
                  {modal.data.escalationHistory.map((entry) => (
                    <p key={`${entry.toLevel}-${entry.escalatedAt}`} className="text-sm leading-6 text-slate">
                      {formatDate(entry.escalatedAt)}: {formatLabel(entry.fromLevel)} → {formatLabel(entry.toLevel)} —{' '}
                      {entry.reason}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <CaseChat
              caseData={modal.data}
              viewerRole="rib"
              onSent={(updated) => setModal((current) => ({ ...current, data: updated }))}
            />
          </div>
        ) : null}
      </DetailsModal>

      {/* Respond modal */}
      <DetailsModal
        isOpen={modal?.type === 'respond'}
        title={modal?.data ? `Respond to ${modal.data.id}` : 'Respond'}
        subtitle="Your response is recorded on the case and shown to the citizen immediately."
        onClose={closeModal}
        widthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={sendResponse}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
            >
              <Send className="h-4 w-4" />
              {isSaving ? 'Recording...' : 'Record Response'}
            </button>
          </>
        }
      >
        {modal?.data ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
              <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
              {modal.data.category} · {formatLabel(modal.data.currentLevel)} level ·{' '}
              {deadlineText(modal.data)}
            </div>
            <label className="block text-xs font-bold text-slate-600">
              Official response to the citizen
              <textarea
                value={responseForm.message}
                onChange={(event) => setResponseForm((c) => ({ ...c, message: event.target.value }))}
                rows="5"
                placeholder="Explain the review outcome, the action taken, and what happens next."
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-300"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Action taken (optional)
              <input
                value={responseForm.actionTaken}
                onChange={(event) => setResponseForm((c) => ({ ...c, actionTaken: event.target.value }))}
                placeholder="e.g. Officer suspended, investigation opened"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-300"
              />
            </label>
            {modalError ? <p className="text-sm font-semibold text-rose-600">{modalError}</p> : null}
          </div>
        ) : null}
      </DetailsModal>
    </div>
  );
}

export default RibOfficerDashboardPage;
