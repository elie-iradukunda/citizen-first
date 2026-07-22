import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatInstitutionName(slug = '') {
  return slug
    ? slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'the scanned institution';
}

function ReportPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isChecking, user } = useAuth();
  const institutionSlug = searchParams.get('institution') ?? '';
  const source = searchParams.get('source') ?? 'public';
  const dashboardParams = new URLSearchParams();

  if (institutionSlug) {
    dashboardParams.set('institution', institutionSlug);
  }
  dashboardParams.set('source', source);

  const citizenReportPath = `/dashboard/citizen/submit?${dashboardParams.toString()}`;
  const loginTarget = `/login?redirect=${encodeURIComponent(citizenReportPath)}`;
  const switchAccountTarget = `${loginTarget}&switch=1`;
  const institutionInfoPath = institutionSlug ? `/institutions/${institutionSlug}#info` : '/';

  if (isChecking) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
          <div className="rounded-[1.5rem] border border-ink/10 bg-white p-8 text-sm font-semibold text-ink shadow-soft">
            Checking your session before opening the report form...
          </div>
        </section>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'citizen') {
    return <Navigate to={citizenReportPath} replace />;
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto grid min-h-[70vh] max-w-5xl gap-6 px-6 py-14 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Login required</p>
          <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
            Sign in before submitting a report.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate">
            You can view public institution information after scanning the QR code without logging in.
            To report poor service or corruption, SACCFP requires a citizen account so RIB can identify
            the reporter, review evidence, and send case feedback.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={isAuthenticated ? switchAccountTarget : loginTarget}
              className="rounded-full bg-ink px-6 py-4 text-sm font-bold text-white shadow-soft"
            >
              {isAuthenticated ? 'Use Citizen Account' : 'Login to Report'}
            </Link>
            {!isAuthenticated ? (
              <Link
                to="/register/citizen"
                className="rounded-full border border-ink/15 bg-white px-6 py-4 text-sm font-bold text-ink"
              >
                Create Citizen Account
              </Link>
            ) : null}
            <Link
              to={institutionInfoPath}
              className="rounded-full border border-ink/15 bg-white px-6 py-4 text-sm font-bold text-ink"
            >
              View Institution Info
            </Link>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-ink/10 bg-white p-6 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-tide">Scanned institution</p>
          <h2 className="mt-3 font-display text-3xl font-black text-ink">
            {formatInstitutionName(institutionSlug)}
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate">
            <p className="rounded-2xl bg-mist px-4 py-3">Public services remain visible without login.</p>
            <p className="rounded-2xl bg-mist px-4 py-3">Leader and support departments remain visible without login.</p>
            <p className="rounded-2xl bg-mist px-4 py-3">Complaint submission opens only after citizen login.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default ReportPage;
