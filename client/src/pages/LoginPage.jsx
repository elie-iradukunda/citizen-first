import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';

// The three system users from the dissertation conceptual framework (Figure 2):
// Citizen, Institution Admin (the institution leader), and RIB (one institution
// with its officers). These seeded accounts are ready for login during
// presentation and testing.
const SEEDED_ACCOUNT_GROUPS = [
  {
    group: 'Citizen',
    note: 'Scans QR, views services, reports corruption, tracks the case.',
    accounts: [
      { label: 'Citizen Demo', email: 'citizen.demo@saccfp.rw', password: 'Citizen@12345' },
    ],
  },
  {
    group: 'Institution Admin',
    note: 'Leader of Kacyiru Sector Office: services, staff, departments, QR.',
    accounts: [
      { label: 'Kacyiru Sector Office Leader', email: 'institution.admin@saccfp.rw', password: 'Institution@12345' },
    ],
  },
  {
    group: 'RIB',
    note: 'Registers institutions, reviews reports, responds in 3 days, escalates.',
    accounts: [
      { label: 'RIB Admin (registers institutions + QR)', email: 'national.admin@citizenfirst.gov.rw', password: 'Admin@12345' },
      { label: 'RIB Officer 1 (new reports + response)', email: 'rib.officer1@saccfp.rw', password: 'RibOfficer1@12345' },
      { label: 'RIB Officer 2 (escalated cases)', email: 'rib.officer2@saccfp.rw', password: 'RibOfficer2@12345' },
    ],
  },
];

function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const switchAccount = searchParams.get('switch') === '1';
  const navigate = useNavigate();
  const { login, user, isAuthenticated, isChecking } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isChecking || !isAuthenticated || !user || switchAccount) {
      return;
    }

    navigate(redirectPath || getRoleDashboardPath(user.role), { replace: true });
  }, [isAuthenticated, isChecking, navigate, redirectPath, switchAccount, user]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({
        email: email.trim().toLowerCase(),
        password,
      });
      navigate(redirectPath || getRoleDashboardPath(loggedInUser.role), { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] font-sans text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <section
          className="relative hidden flex-col justify-between p-12 text-white lg:flex"
          style={{ background: 'linear-gradient(160deg, #075126 0%, #087536 55%, #0b9b4b 100%)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-sm font-black">SA</span>
            <div>
              <p className="text-sm font-black tracking-wide">SACCFP</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">Anti-Corruption Platform</p>
            </div>
          </div>

          <div>
            <h2 className="max-w-md text-3xl font-black leading-tight">
              Report corruption to RIB with evidence.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
              Scan an institution QR code, see official services and fees, and report bribery, unofficial
              payments, or abuse of authority. Every report is tracked with a case ID, a deadline, and
              independent review.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs font-semibold text-white/80">
              <ShieldCheck className="h-5 w-5" />
              Secure, role-based access for citizens, institutions, and RIB officers.
            </div>
          </div>

          <p className="text-[11px] text-white/55">Smart Anti-Corruption &amp; Citizen Feedback Platform</p>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[440px] space-y-5">
          <form
            onSubmit={onSubmit}
            className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-panel"
          >
            <div className="mb-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
                <Lock className="h-5 w-5" />
              </span>
              <h1 className="mt-5 text-[22px] font-bold tracking-tight text-slate-900">Sign in to SACCFP</h1>
              <p className="mt-1.5 text-sm text-slate-500">Use your account to access your dashboard.</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="field-label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="app-input"
                />
              </label>

              <label className="block">
                <span className="field-label">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="app-input"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                {error}
              </div>
            ) : null}

            {switchAccount ? (
              <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs leading-6 text-brand-700">
                Sign in with the citizen account to continue the report.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            <Link
              to="/"
              className="mt-6 block text-center text-xs font-semibold text-slate-400 transition hover:text-brand-600"
            >
              Back to public site
            </Link>
          </form>

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Seeded presentation accounts
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              The three system users of SACCFP. Click an account to fill the form, then sign in.
            </p>

            <div className="mt-4 space-y-4">
              {SEEDED_ACCOUNT_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-bold text-slate-800">{group.group}</p>
                  <p className="text-[11px] leading-4 text-slate-400">{group.note}</p>
                  <div className="mt-2 space-y-2">
                    {group.accounts.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => {
                          setEmail(account.email);
                          setPassword(account.password);
                          setError('');
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="block text-xs font-semibold text-slate-800">{account.label}</span>
                        <span className="mt-0.5 block break-all text-[11px] text-slate-500">
                          {account.email} &middot; {account.password}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
