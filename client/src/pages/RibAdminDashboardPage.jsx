import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  Eye,
  Plus,
  QrCode,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import DetailsModal, { DetailRow } from '../components/dashboard/DetailsModal';
import {
  fetchAdminDashboard,
  startComplaintReview,
  submitOfficerComplaintResponse,
} from '../lib/dashboardApi';
import {
  deleteInstitution,
  fetchRegisteredCitizens,
  fetchRegisteredInstitutions,
} from '../lib/registrationApi';

const BRAND = '#087536';

const STATUS_STYLES = {
  submitted: 'bg-sky-50 text-sky-700 border-sky-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  responded: 'bg-teal-50 text-teal-700 border-teal-200',
  escalated: 'bg-rose-50 text-rose-700 border-rose-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-slate-100 text-slate-600 border-slate-200',
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

function formatLocation(location = {}) {
  return (
    [location.village, location.cell, location.sector, location.district, location.province]
      .filter(Boolean)
      .join(', ') || '—'
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
    danger: 'border-rose-200 text-rose-600 hover:bg-rose-50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function RibAdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState({ error: '', success: '' });

  // modal = { type: 'view-institution' | 'delete-institution' | 'view-case' | 'view-citizen', data }
  const [modal, setModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [caseNote, setCaseNote] = useState('');
  const [caseAction, setCaseAction] = useState('');
  const [caseSuccess, setCaseSuccess] = useState('');

  const loadAll = useCallback(() => {
    setIsLoading(true);
    setLoadError('');

    Promise.all([fetchAdminDashboard(), fetchRegisteredInstitutions(), fetchRegisteredCitizens()])
      .then(([dashboardPayload, institutionsPayload, citizensPayload]) => {
        setDashboard(dashboardPayload);
        setInstitutions(institutionsPayload.items ?? []);
        setCitizens(citizensPayload.items ?? []);
      })
      .catch((error) => {
        setLoadError(error.message || 'RIB oversight data could not be loaded.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const closeModal = () => {
    setModal(null);
    setModalError('');
    setIsDeleting(false);
    setCaseNote('');
    setCaseSuccess('');
    setCaseAction('');
  };

  // Marks the case as under investigation, then records the official answer.
  // Both steps notify the citizen so the case never looks abandoned to them.
  const runCaseAction = async (kind) => {
    setModalError('');
    setCaseSuccess('');
    setCaseAction(kind);

    try {
      if (kind === 'review') {
        const payload = await startComplaintReview(modal.data.id, {
          note: caseNote.trim() || undefined,
        });
        setModal((current) => ({ ...current, data: { ...current.data, ...payload.item } }));
        setCaseSuccess('Case marked as under investigation. The citizen has been notified.');
      } else {
        if (caseNote.trim().length < 12) {
          setModalError('Write at least 12 characters so the citizen understands the outcome.');
          setCaseAction('');
          return;
        }

        const payload = await submitOfficerComplaintResponse(modal.data.id, {
          message: caseNote.trim(),
        });
        setModal((current) => ({ ...current, data: { ...current.data, ...payload.item } }));
        setCaseSuccess('Response sent to the citizen.');
      }

      setCaseNote('');
      loadAll();
    } catch (error) {
      setModalError(error.message || 'The case could not be updated.');
    } finally {
      setCaseAction('');
    }
  };

  const confirmDeleteInstitution = async () => {
    setIsDeleting(true);
    setModalError('');

    try {
      const payload = await deleteInstitution(modal.data.institutionId);
      setNotice({
        error: '',
        success: `${payload.removedInstitution.institutionName} was deleted from the platform.`,
      });
      closeModal();
      loadAll();
    } catch (error) {
      setModalError(error.message || 'Institution could not be deleted.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-8 sm:px-6 xl:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">
          Loading RIB national oversight data...
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

  const kpis = (dashboard?.kpis ?? []).slice(0, 4);
  const alerts = dashboard?.alerts ?? [];
  const recentReports = dashboard?.recentReports ?? [];
  const issuePortfolio = dashboard?.issuePortfolio ?? [];

  return (
    <div className="px-4 py-6 sm:px-6 xl:px-8">
      {/* Page header */}
      <div
        className="rounded-xl p-6 text-white shadow-sm"
        style={{ background: 'linear-gradient(120deg, #075126, #087536)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              RIB National Oversight
            </p>
            <h1 className="mt-1.5 text-2xl font-black leading-tight">
              Institutions, corruption cases, and citizen accountability
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/80">
              RIB registers each institution, owns its QR code, and supervises every report from
              submission to response, escalation, and resolution.
            </p>
          </div>
          <Link
            to="/register/invite"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-emerald-50"
            style={{ color: BRAND }}
          >
            <Plus className="h-4 w-4" />
            Register Institution
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-800">{item.value}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.note}</p>
          </article>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.title}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] leading-6 ${
                alert.severity === 'critical'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : alert.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-bold">{alert.title}:</span> {alert.detail}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {notice.success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {notice.success}
        </div>
      ) : null}
      {notice.error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {notice.error}
        </div>
      ) : null}

      {/* Institutions */}
      <div className="mt-5">
        <Card
          id="institutions"
          title="Registered institutions"
          subtitle="Every institution registered by RIB with its QR access, services, and staff."
          icon={Building2}
          action={
            <Link
              to="/register/invite"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              <Plus className="h-3.5 w-3.5" />
              New Institution
            </Link>
          }
        >
          <DataTable headers={['Institution', 'Level', 'Location', 'Services', 'Staff', 'QR', 'Actions']} minWidth={860}>
            {institutions.map((institution) => (
              <tr key={institution.institutionId} className="transition hover:bg-slate-50">
                <td className="px-3 py-3 first:pl-0">
                  <p className="font-semibold text-slate-800">{institution.institutionName}</p>
                  <p className="text-[11px] text-slate-400">{institution.institutionId}</p>
                </td>
                <td className="px-3 py-3 text-slate-600">{formatLabel(institution.level)}</td>
                <td className="px-3 py-3 text-slate-600">{formatLocation(institution.location)}</td>
                <td className="px-3 py-3 text-slate-600">{institution.services?.length ?? 0}</td>
                <td className="px-3 py-3 text-slate-600">{institution.employeeCount ?? 0}</td>
                <td className="px-3 py-3">
                  {institution.qrCodeDataUrl ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={institution.qrCodeDataUrl}
                        alt={`QR code for ${institution.institutionName}`}
                        className="h-14 w-14 rounded-md border border-slate-200 bg-white p-1"
                      />
                      <span className="text-[11px] font-bold text-emerald-700">Scan</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <QrCode className="h-3.5 w-3.5" />
                      On demand
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 last:pr-0">
                  <div className="flex gap-2">
                    <RowButton onClick={() => setModal({ type: 'view-institution', data: institution })}>
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </RowButton>
                    <RowButton tone="danger" onClick={() => setModal({ type: 'delete-institution', data: institution })}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </RowButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          {institutions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No institutions registered yet.</p>
          ) : null}
        </Card>
      </div>

      {/* Cases */}
      <div className="mt-5">
        <Card
          id="cases"
          title="Citizen reports and corruption cases"
          subtitle="Latest reports across the RIB workflow with status, level, and deadline compliance."
          icon={ClipboardList}
        >
          <DataTable headers={['Case ID', 'Category', 'Institution', 'Level', 'Mode', 'Status', 'Submitted', '']} minWidth={940}>
            {recentReports.map((report) => (
              <tr key={report.id} className="transition hover:bg-slate-50">
                <td className="px-3 py-3 font-semibold text-slate-800 first:pl-0">{report.id}</td>
                <td className="px-3 py-3 text-slate-600">{report.category}</td>
                <td className="px-3 py-3 text-slate-600">{report.institution}</td>
                <td className="px-3 py-3 text-slate-600">{formatLabel(report.currentLevel)}</td>
                <td className="px-3 py-3 text-slate-600">{formatLabel(report.reportingMode)}</td>
                <td className="px-3 py-3">
                  <StatusPill status={report.status} />
                </td>
                <td className="px-3 py-3 text-slate-500">{formatDate(report.submittedAt)}</td>
                <td className="px-3 py-3 last:pr-0">
                  <RowButton onClick={() => setModal({ type: 'view-case', data: report })}>
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </RowButton>
                </td>
              </tr>
            ))}
          </DataTable>
          {recentReports.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No citizen reports yet.</p>
          ) : null}
        </Card>
      </div>

      {/* Issue portfolio */}
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {issuePortfolio.map((issue) => (
          <article key={issue.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {issue.label}
              </p>
              <ShieldCheck className="h-4 w-4" style={{ color: BRAND }} />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-800">
              {issue.count}
              <span className="ml-2 text-sm font-semibold text-slate-400">{issue.percentage}%</span>
            </p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{issue.note}</p>
          </article>
        ))}
      </div>

      {/* Citizens */}
      <div className="mt-5">
        <Card
          id="citizens"
          title="Registered citizens"
          subtitle="Citizens with verified accounts who can report and track corruption cases."
          icon={Users}
        >
          <DataTable headers={['Citizen', 'National ID', 'Phone', 'Location', 'Status', '']} minWidth={780}>
            {citizens.map((citizen) => (
              <tr key={citizen.citizenId} className="transition hover:bg-slate-50">
                <td className="px-3 py-3 first:pl-0">
                  <p className="font-semibold text-slate-800">{citizen.fullName}</p>
                  <p className="text-[11px] text-slate-400">{citizen.citizenId}</p>
                </td>
                <td className="px-3 py-3 text-slate-600">{citizen.nationalId}</td>
                <td className="px-3 py-3 text-slate-600">{citizen.phone}</td>
                <td className="px-3 py-3 text-slate-600">{formatLocation(citizen.location)}</td>
                <td className="px-3 py-3">
                  <StatusPill status={citizen.status === 'active' ? 'resolved' : 'rejected'} />
                </td>
                <td className="px-3 py-3 last:pr-0">
                  <RowButton onClick={() => setModal({ type: 'view-citizen', data: citizen })}>
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </RowButton>
                </td>
              </tr>
            ))}
          </DataTable>
          {citizens.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No citizens registered yet.</p>
          ) : null}
        </Card>
      </div>

      {/* ---- Modals ---- */}

      <DetailsModal
        isOpen={modal?.type === 'view-institution'}
        title={modal?.data?.institutionName ?? 'Institution details'}
        subtitle="Full institution record registered on the platform."
        onClose={closeModal}
      >
        {modal?.data ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <DetailRow label="Institution ID" value={modal.data.institutionId} />
              <DetailRow label="Level" value={formatLabel(modal.data.level)} />
              <DetailRow label="Type" value={modal.data.institutionType} />
              <DetailRow label="Location" value={formatLocation(modal.data.location)} />
              <DetailRow label="Phone" value={modal.data.officialPhone} />
              <DetailRow label="Email" value={modal.data.officialEmail} />
              <DetailRow label="Office address" value={modal.data.officeAddress} />
              <DetailRow label="Public page" value={`/institutions/${modal.data.slug}`} />
            </div>
            {modal.data.services?.length > 0 ? (
              <div className="rounded-lg bg-mist px-4 py-3">
                <p className="text-sm font-bold text-ink">Services ({modal.data.services.length})</p>
                <p className="mt-1 text-sm leading-6 text-slate">
                  {modal.data.services.map((service) => service.name).join(' · ')}
                </p>
              </div>
            ) : null}
            {modal.data.qrCodeDataUrl ? (
              <div className="rounded-lg bg-mist px-4 py-3 text-center">
                <p className="text-sm font-bold text-ink">Institution QR (owned by RIB)</p>
                <img
                  src={modal.data.qrCodeDataUrl}
                  alt={`QR code for ${modal.data.institutionName}`}
                  className="mx-auto mt-2 h-36 w-36 rounded-lg border border-ink/10 bg-white p-2"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'delete-institution'}
        title={`Delete institution: ${modal?.data?.institutionName ?? ''}`}
        subtitle="This removes the institution, its staff records, and deactivates its accounts."
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
              onClick={confirmDeleteInstitution}
              disabled={isDeleting}
              className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete Institution'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-7 text-slate">
          Citizens will no longer reach this institution through its QR code. Every institution is
          registered independently, so any units below it stay registered and keep working on their
          own after this deletion.
        </p>
        {modalError ? <p className="mt-3 text-sm font-semibold text-rose-600">{modalError}</p> : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'view-case'}
        title={modal?.data ? `Case ${modal.data.id}` : 'Case details'}
        subtitle="Citizen report as tracked by RIB national oversight."
        onClose={closeModal}
      >
        {modal?.data ? (
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Status" value={formatLabel(modal.data.status)} />
            <DetailRow label="Category" value={modal.data.category} />
            <DetailRow label="Classification" value={modal.data.classification} />
            <DetailRow label="Current level" value={formatLabel(modal.data.currentLevel)} />
            <DetailRow label="Institution" value={modal.data.institution} />
            <DetailRow label="Reporting mode" value={formatLabel(modal.data.reportingMode)} />
            <DetailRow label="Province" value={modal.data.province} />
            <DetailRow label="District" value={modal.data.district} />
            <DetailRow label="Submitted" value={formatDate(modal.data.submittedAt)} />
            <DetailRow label="Last update" value={formatDate(modal.data.updatedAt)} />

            {/* Reports about someone who holds no public post carry no employee
                record, so these tracing details are all RIB has to identify them. */}
            {modal.data.reportedPersonName ? (
              <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                  Person reported (not registered staff)
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <DetailRow label="Name / known as" value={modal.data.reportedPersonName} />
                  <DetailRow label="Phone number" value={modal.data.reportedPersonPhone || 'Not provided'} />
                  <DetailRow label="Role / where they work" value={modal.data.reportedPersonRole || 'Not provided'} />
                  <DetailRow label="How to recognise them" value={modal.data.reportedPersonDescription || 'Not provided'} />
                  <DetailRow label="Where it happened" value={modal.data.incidentLocation || 'Not provided'} />
                  <DetailRow label="When it happened" value={modal.data.incidentDate || 'Not provided'} />
                  <DetailRow
                    label="Amount asked for"
                    value={
                      modal.data.amountRequestedRwf
                        ? `${Number(modal.data.amountRequestedRwf).toLocaleString()} RWF`
                        : 'Not provided'
                    }
                  />
                  <DetailRow label="Money handed over" value={formatLabel(modal.data.moneyPaid) || 'Not provided'} />
                  <DetailRow label="Payment channel" value={modal.data.paymentChannel || 'Not provided'} />
                  <DetailRow label="Witness" value={modal.data.witnessDetails || 'Not provided'} />
                </div>
              </div>
            ) : null}

            {modal.data.message ? (
              <div className="md:col-span-2">
                <DetailRow label="Citizen report" value={modal.data.message} />
              </div>
            ) : null}

            {/* Evidence attached by the citizen: this is what turns a claim into
                something RIB can act on, so it opens directly from the case. */}
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Evidence</p>
              {modal.data.evidenceImage || modal.data.evidenceDocument || modal.data.voiceNote ? (
                <div className="mt-3 space-y-3">
                  {modal.data.evidenceImage ? (
                    <div>
                      <p className="text-xs font-bold text-slate-600">Photo evidence</p>
                      <img
                        src={modal.data.evidenceImage.dataUrl ?? modal.data.evidenceImage.url}
                        alt="Citizen photo evidence"
                        className="mt-2 max-h-72 w-auto rounded-lg border border-slate-200"
                      />
                    </div>
                  ) : null}
                  {modal.data.evidenceDocument ? (
                    <a
                      href={modal.data.evidenceDocument.dataUrl ?? modal.data.evidenceDocument.url}
                      download={modal.data.evidenceDocument.fileName ?? 'evidence'}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      {modal.data.evidenceDocument.fileName ?? 'Download document evidence'}
                    </a>
                  ) : null}
                  {modal.data.voiceNote ? (
                    <div>
                      <p className="text-xs font-bold text-slate-600">Voice evidence</p>
                      <audio
                        controls
                        src={modal.data.voiceNote.dataUrl ?? modal.data.voiceNote.url}
                        className="mt-2 w-full"
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  The citizen did not attach any photo, document, or voice evidence.
                </p>
              )}
            </div>

            {/* Follow-up: what the citizen sees on their Track Case page. */}
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Follow-up shown to the citizen
              </p>

              {(modal.data.progressNotes ?? []).length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {modal.data.progressNotes.map((entry) => (
                    <li key={entry.addedAt} className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      <span className="font-bold">{formatDate(entry.addedAt)} — {entry.addedByName}:</span>{' '}
                      {entry.note}
                    </li>
                  ))}
                </ul>
              ) : null}

              {modal.data.response ? (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
                  <span className="font-bold">Official response:</span> {modal.data.response.message}
                </p>
              ) : null}

              {modal.data.status !== 'resolved' ? (
                <>
                  <textarea
                    value={caseNote}
                    onChange={(event) => setCaseNote(event.target.value)}
                    rows={3}
                    placeholder="What is being done on this case? This text is sent to the citizen."
                    className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-300"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runCaseAction('review')}
                      disabled={Boolean(caseAction)}
                      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 disabled:opacity-60"
                    >
                      {caseAction === 'review' ? 'Updating...' : 'Mark as under investigation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => runCaseAction('respond')}
                      disabled={Boolean(caseAction)}
                      className="rounded-lg px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                      style={{ backgroundColor: BRAND }}
                    >
                      {caseAction === 'respond' ? 'Sending...' : 'Send official response'}
                    </button>
                  </div>
                </>
              ) : null}

              {caseSuccess ? (
                <p className="mt-3 text-xs font-bold text-emerald-700">{caseSuccess}</p>
              ) : null}
              {modalError ? <p className="mt-3 text-xs font-bold text-rose-600">{modalError}</p> : null}
            </div>
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'view-citizen'}
        title={modal?.data?.fullName ?? 'Citizen details'}
        subtitle="Verified citizen account used for reporting and follow-up."
        onClose={closeModal}
      >
        {modal?.data ? (
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Citizen ID" value={modal.data.citizenId} />
            <DetailRow label="National ID" value={modal.data.nationalId} />
            <DetailRow label="Phone" value={modal.data.phone} />
            <DetailRow label="Email" value={modal.data.email} />
            <DetailRow label="Gender" value={modal.data.gender} />
            <DetailRow label="Date of birth" value={modal.data.dateOfBirth} />
            <DetailRow label="Status" value={formatLabel(modal.data.status)} />
            <div className="md:col-span-2">
              <DetailRow label="Address" value={formatLocation(modal.data.location)} />
            </div>
          </div>
        ) : null}
      </DetailsModal>
    </div>
  );
}

export default RibAdminDashboardPage;
