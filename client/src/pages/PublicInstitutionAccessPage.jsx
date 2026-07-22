import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardState from '../components/dashboard/DashboardState';
import DetailsModal, { DetailRow } from '../components/dashboard/DetailsModal';
import SectionCard from '../components/dashboard/SectionCard';
import { useAuth } from '../context/AuthContext';
import { fetchInstitutionProfile } from '../lib/institutionApi';

function formatLevel(level = '') {
  const workflowLabels = {
    village: 'QR Access',
    cell: 'Evidence Triage',
    sector: 'RIB Intake',
    district: 'Investigation Review',
    province: 'Supervisory Review',
    national: 'National Oversight',
  };

  return workflowLabels[level] ?? (level ? level.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : 'Unknown');
}

function formatLocation(location = {}) {
  return [location.village, location.cell, location.sector, location.district, location.province, location.country]
    .filter(Boolean)
    .join(', ');
}

function formatServiceFee(service = {}) {
  if (service.feeType === 'paid') {
    return `${Number(service.officialFeeRwf ?? 0).toLocaleString()} RWF (official receipt required)`;
  }

  if (service.feeType === 'free') {
    return 'Free service - no payment allowed';
  }

  return 'Follow official fee and receipt rules';
}

function PublicInstitutionAccessPage() {
  const { slug = '' } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // modal = { type: 'service' | 'staff' | 'department', data }
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError('');

    fetchInstitutionProfile(slug)
      .then((payload) => {
        if (isActive) {
          setInstitution(payload.item);
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setInstitution(null);
          setError(requestError.message);
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
  }, [slug]);

  const reportTarget = useMemo(() => {
    const params = new URLSearchParams();
    params.set('institution', slug);
    params.set('source', 'qr');
    return `/dashboard/citizen/submit?${params.toString()}`;
  }, [slug]);

  const loginReportTarget = useMemo(
    () => `/login?redirect=${encodeURIComponent(reportTarget)}`,
    [reportTarget],
  );

  const switchToCitizenTarget = useMemo(
    () => `/login?redirect=${encodeURIComponent(reportTarget)}&switch=1`,
    [reportTarget],
  );

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Opening institution access page"
            description="Loading RIB workflow details, accountability contacts, and citizen reporting options."
          />
        </section>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState title="Institution access unavailable" description={error || 'Institution not found.'} />
        </section>
      </div>
    );
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">QR Public Access</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          {institution.institutionName}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Scan once to review public institution information first: services, responsible leader,
          support departments, contacts, schedules, and official reporting options.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">View public information</p>
            <p className="mt-3 text-sm leading-7 text-slate">
              Open services, office contacts, leader details, responsibilities, and support departments.
            </p>
            <a
              href="#info"
              className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
            >
              View full information
            </a>
          </article>

          <article className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">Report an issue</p>
            <p className="mt-3 text-sm leading-7 text-slate">
              Reporting requires a citizen account. After login, you can describe poor service or corruption and attach evidence.
            </p>
            {isAuthenticated && user?.role === 'citizen' ? (
              <Link to={reportTarget} className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink">
                Continue to report
              </Link>
            ) : (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={isAuthenticated ? switchToCitizenTarget : loginReportTarget}
                  className="inline-flex rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink"
                >
                  Login to report
                </Link>
                {!isAuthenticated ? (
                  <Link
                    to="/register/citizen"
                    className="inline-flex rounded-full border border-ink/15 px-5 py-3 text-sm font-bold text-ink"
                  >
                    Create account
                  </Link>
                ) : null}
              </div>
            )}
          </article>
        </div>

        {isAuthenticated && user?.role !== 'citizen' ? (
          <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/20 px-5 py-4 text-sm text-ink">
            You are currently signed in as {user?.fullName || user?.role}. Use a citizen account before submitting
            a report from this page.
          </div>
        ) : null}

        <div id="info" className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="Institution profile" subtitle="Official contact and accountability information.">
            <div className="space-y-3 text-sm text-slate">
              <article className="rounded-2xl bg-mist px-4 py-4">
                <p className="font-semibold text-ink">{institution.institutionName}</p>
                <p className="mt-1">
                  {formatLevel(institution.level)} | {institution.institutionType || 'Government institution'}
                </p>
              </article>
              <article className="rounded-2xl bg-mist px-4 py-4">
                <p>Location: {formatLocation(institution.location) || 'Not available'}</p>
                <p className="mt-1">Office address: {institution.officeAddress || 'Not available'}</p>
                <p className="mt-1">
                  Contact: {institution.officialPhone || 'No phone listed'} | {institution.officialEmail || 'No email listed'}
                </p>
              </article>
              <article className="rounded-2xl bg-mist px-4 py-4">
                <p>Registered staff: {institution.employeeCount ?? 0}</p>
                <p className="mt-1">Services published: {institution.services?.length ?? 0}</p>
                {institution.childUnitLabel ? (
                  <p className="mt-1">
                    Registered {institution.childUnitLabel}: {institution.registeredChildUnits ?? 0}
                    {institution.expectedChildUnits !== null ? ` / ${institution.expectedChildUnits}` : ''}
                  </p>
                ) : null}
              </article>
            </div>
          </SectionCard>

          <SectionCard title="Leader and duties" subtitle="The primary accountable lead for this institution.">
            {institution.leader ? (
              <div className="space-y-3 text-sm text-slate">
                <article className="rounded-2xl bg-mist px-4 py-4">
                  <p className="font-semibold text-ink">
                    {institution.leader.fullName} ({institution.leader.positionTitle})
                  </p>
                  {institution.leader.positionKinyarwanda ? (
                    <p className="mt-1">{institution.leader.positionKinyarwanda}</p>
                  ) : null}
                  <p className="mt-1">
                    {institution.leader.phone || 'No phone listed'} | {institution.leader.email || 'No email listed'}
                  </p>
                  {institution.leader.reportsTo ? <p className="mt-1">Reports to: {institution.leader.reportsTo}</p> : null}
                </article>
                <article className="rounded-2xl bg-mist px-4 py-4">
                  <p className="font-semibold text-ink">Responsibilities and duties</p>
                  <p className="mt-2 leading-7">
                    {institution.leader.duties || institution.leader.description || 'RIB lead duties were not yet published.'}
                  </p>
                </article>
              </div>
            ) : (
              <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                Leader details have not been published for this institution yet.
              </article>
            )}
          </SectionCard>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            title="Institution services"
            subtitle="Official services with fees, schedules, and required documents. Unofficial payments are never allowed."
          >
            <div className="space-y-3">
              {institution.services?.length > 0 ? (
                institution.services.map((service) => (
                  <article key={service.name} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{service.name}</p>
                      <button
                        type="button"
                        onClick={() => setModal({ type: 'service', data: service })}
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
                      >
                        View Details
                      </button>
                    </div>
                    <p className="mt-1">{service.description || 'Service description not yet provided.'}</p>
                    <p className="mt-2 font-semibold text-ink">Fee: {formatServiceFee(service)}</p>
                    {service.responsibleStaff?.length > 0 ? (
                      <p className="mt-1">
                        Responsible staff:{' '}
                        {service.responsibleStaff.map((member) => member.fullName).join(', ')}
                      </p>
                    ) : null}
                  </article>
                ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                  No services were published for this institution yet.
                </article>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Departments and support services" subtitle="Supporting units registered under this institution.">
            <div className="space-y-3">
              {institution.departments?.length > 0 ? (
                institution.departments.map((department) => (
                  <article key={department.departmentId} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{department.name}</p>
                      <button
                        type="button"
                        onClick={() => setModal({ type: 'department', data: department })}
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
                      >
                        View Details
                      </button>
                    </div>
                    <p className="mt-1">{department.description || 'Department description not yet provided.'}</p>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                  No departments were published for this institution yet.
                </article>
              )}
              {institution.children?.slice(0, 4).map((child) => (
                <article key={child.institutionId} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                  <p className="font-semibold text-ink">
                    {child.institutionName} ({formatLevel(child.level)})
                  </p>
                  <p className="mt-1">{formatLocation(child.location)}</p>
                  <p className="mt-1">
                    Staff: {child.employeeCount} | Services: {child.servicesCount}
                  </p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="mt-6">
          <SectionCard
            title="Staff who support these services"
            subtitle="Leaders and staff with their contacts, so the citizen knows who is accountable before reporting."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {institution.staff?.length > 0 ? (
                institution.staff.map((member) => (
                  <article key={member.employeeId} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink">{member.fullName}</p>
                      {member.isLeader ? (
                        <span className="rounded-full bg-gold/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-ink">
                          Leader
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1">{member.positionTitle}</p>
                    <p className="mt-1">{member.phone || 'No phone listed'}</p>
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'staff', data: member })}
                      className="mt-3 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
                    >
                      View Details
                    </button>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                  Staff details have not been published for this institution yet.
                </article>
              )}
            </div>
          </SectionCard>
        </div>
      </section>

      <DetailsModal
        isOpen={modal?.type === 'service'}
        title={modal?.data?.name ?? 'Service details'}
        subtitle="Everything the citizen needs to receive this service correctly."
        onClose={() => setModal(null)}
      >
        {modal?.data ? (
          <div className="grid gap-3">
            <DetailRow label="Description" value={modal.data.description || 'Not provided'} />
            <DetailRow label="Official fee" value={formatServiceFee(modal.data)} />
            <DetailRow label="Payment note" value={modal.data.accessNote || 'Use only official payment channels.'} />
            <DetailRow label="Schedule" value={modal.data.schedule || 'Working days'} />
            <DetailRow label="Required documents" value={modal.data.documents || 'Bring your national ID.'} />
            {modal.data.responsibleStaff?.length > 0 ? (
              <DetailRow
                label="Responsible staff"
                value={modal.data.responsibleStaff
                  .map((member) => `${member.fullName} (${member.positionTitle}) - ${member.phone}`)
                  .join('; ')}
              />
            ) : null}
            <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm leading-6 text-ink">
              If anyone requests a payment different from the official fee above, report it from this page. Reporting is
              free and can be anonymous.
            </p>
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'staff'}
        title={modal?.data?.fullName ?? 'Staff details'}
        subtitle="Contact and accountability details for this staff member."
        onClose={() => setModal(null)}
      >
        {modal?.data ? (
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Position" value={modal.data.positionTitle} />
            <DetailRow label="Position (Kinyarwanda)" value={modal.data.positionKinyarwanda || 'Not provided'} />
            <DetailRow label="Phone" value={modal.data.phone || 'No phone listed'} />
            <DetailRow label="Email" value={modal.data.email || 'No email listed'} />
            <DetailRow label="Reports to" value={modal.data.reportsTo || 'Not provided'} />
            <DetailRow label="Status" value={modal.data.status} />
            <div className="md:col-span-2">
              <DetailRow label="Duties" value={modal.data.description || 'Duties not yet published.'} />
            </div>
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'department'}
        title={modal?.data?.name ?? 'Department details'}
        subtitle="Department registered under this institution."
        onClose={() => setModal(null)}
      >
        {modal?.data ? (
          <div className="grid gap-3">
            <DetailRow label="Department" value={modal.data.name} />
            <DetailRow label="Description" value={modal.data.description || 'Not provided'} />
          </div>
        ) : null}
      </DetailsModal>
    </div>
  );
}

export default PublicInstitutionAccessPage;
