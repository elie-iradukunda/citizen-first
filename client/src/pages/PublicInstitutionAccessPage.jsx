import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardState from '../components/dashboard/DashboardState';
import SectionCard from '../components/dashboard/SectionCard';
import { useAuth } from '../context/AuthContext';
import { fetchInstitutionProfile } from '../lib/institutionApi';

function formatLevel(level = '') {
  return level ? level.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : 'Unknown';
}

function formatLocation(location = {}) {
  return [location.village, location.cell, location.sector, location.district, location.province, location.country]
    .filter(Boolean)
    .join(', ');
}

function PublicInstitutionAccessPage() {
  const { slug = '' } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
    const reportPath = `/dashboard/citizen/submit?institution=${slug}&source=qr`;

    if (isAuthenticated && user?.role === 'citizen') {
      return reportPath;
    }

    const params = new URLSearchParams();
    params.set('redirect', reportPath);

    if (isAuthenticated) {
      params.set('switch', '1');
    }

    return `/login?${params.toString()}`;
  }, [isAuthenticated, slug, user?.role]);

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Opening institution access page"
            description="Loading services, leader accountability details, and citizen reporting options."
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
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Institution Public Access</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          {institution.institutionName}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Scan once, then choose whether to review this institution&apos;s public information or continue to citizen
          issue reporting.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">View institution information</p>
            <p className="mt-3 text-sm leading-7 text-slate">
              Open services, office contacts, leader details, responsibilities, and local governance coverage.
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
              Continue to the citizen complaint form for this institution. Login is required before a report is sent.
            </p>
            <Link to={reportTarget} className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink">
              Continue to reporting
            </Link>
          </article>
        </div>

        {isAuthenticated && user?.role !== 'citizen' ? (
          <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/20 px-5 py-4 text-sm text-ink">
            You are currently signed in as {user?.fullName || user?.role}. Use a citizen account if you want to submit
            a citizen complaint from this page.
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

          <SectionCard title="Leader and duties" subtitle="The primary accountable leader for this institution.">
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
                    {institution.leader.duties || institution.leader.description || 'Leader duties were not yet published.'}
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
          <SectionCard title="Services" subtitle="Official services registered for this institution.">
            <div className="space-y-3">
              {institution.services?.length > 0 ? (
                institution.services.map((service) => (
                  <article key={service.name} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                    <p className="font-semibold text-ink">{service.name}</p>
                    <p className="mt-1">{service.description || 'Service description not yet provided.'}</p>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                  No services were published for this institution yet.
                </article>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Departments and lower levels" subtitle="Supporting units registered under this institution.">
            <div className="space-y-3">
              {institution.departments?.length > 0 ? (
                institution.departments.map((department) => (
                  <article key={department.departmentId} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                    <p className="font-semibold text-ink">{department.name}</p>
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
      </section>
    </div>
  );
}

export default PublicInstitutionAccessPage;
