import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';

const demoAccounts = [
  {
    role: 'Seed National Admin',
    email: 'national.seed.admin@citizenfirst.gov.rw',
    password: 'National@12345',
  },
  {
    role: 'Seed Province Leader',
    email: 'province.leader@citizenfirst.gov.rw',
    password: 'Province@12345',
  },
  {
    role: 'Seed District Leader',
    email: 'district.leader@citizenfirst.gov.rw',
    password: 'District@12345',
  },
  {
    role: 'Seed Sector Leader',
    email: 'sector.leader@citizenfirst.gov.rw',
    password: 'Sector@12345',
  },
  {
    role: 'Seed Cell Leader',
    email: 'cell.leader@citizenfirst.gov.rw',
    password: 'Cell@12345',
  },
  {
    role: 'Seed Village Leader',
    email: 'village.leader@citizenfirst.gov.rw',
    password: 'Village@12345',
  },
  {
    role: 'Test Admin',
    email: 'test.admin@citizenfirst.gov.rw',
    password: 'Admin@12345',
  },
  {
    role: 'National Admin',
    email: 'national.admin@citizenfirst.gov.rw',
    password: 'Admin@12345',
  },
  {
    role: 'Dashboard Admin',
    email: 'oversight.admin@citizenfirst.gov.rw',
    password: 'Admin@12345',
  },
  {
    role: 'Officer',
    email: 'officer@citizenfirst.gov.rw',
    password: 'Officer@12345',
  },
  {
    role: 'Citizen',
    email: 'citizen.demo@citizenfirst.gov.rw',
    password: 'Citizen@12345',
  },
];

const demoAccessKeys = [
  {
    role: 'Seed National Admin',
    accessKey: 'CF-NATIONAL-SEED-2026',
  },
  {
    role: 'Seed Province Leader',
    accessKey: 'CF-PRO-SEED-2026',
  },
  {
    role: 'Seed District Leader',
    accessKey: 'CF-DIS-SEED-2026',
  },
  {
    role: 'Seed Sector Leader',
    accessKey: 'CF-SEC-SEED-2026',
  },
  {
    role: 'Seed Cell Leader',
    accessKey: 'CF-CEL-SEED-2026',
  },
  {
    role: 'Seed Village Leader',
    accessKey: 'CF-VIL-SEED-2026',
  },
  {
    role: 'Test Admin',
    accessKey: 'CF-TEST-ADMIN-2026',
  },
  {
    role: 'National Admin',
    accessKey: 'CF-ADMIN-2026',
  },
  {
    role: 'Dashboard Admin',
    accessKey: 'CF-DASH-ADMIN-2026',
  },
  {
    role: 'Officer',
    accessKey: 'CF-DASH-OFFICER-2026',
  },
  {
    role: 'Citizen',
    accessKey: 'CF-DASH-CITIZEN-2026',
  },
];

function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const navigate = useNavigate();
  const { login, user, isAuthenticated, isChecking } = useAuth();

  const [loginMode, setLoginMode] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isChecking || !isAuthenticated || !user) {
      return;
    }

    navigate(redirectPath || getRoleDashboardPath(user.role), { replace: true });
  }, [isAuthenticated, isChecking, navigate, redirectPath, user]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload =
        loginMode === 'password'
          ? {
              email: email.trim().toLowerCase(),
              password,
            }
          : {
              accessKey: accessKey.trim(),
            };

      const user = await login(payload);
      navigate(redirectPath || getRoleDashboardPath(user.role), { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist">
      <section className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Secure Login</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Access dashboard with authorized key
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate">
          Dashboard and institution management pages are protected. Sign in using email and password, or use access
          key mode.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={onSubmit} className="rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-mist p-1">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={[
                  'rounded-xl px-3 py-2 text-sm font-bold transition',
                  loginMode === 'password' ? 'bg-white text-ink shadow-sm' : 'text-slate hover:text-ink',
                ].join(' ')}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('accessKey')}
                className={[
                  'rounded-xl px-3 py-2 text-sm font-bold transition',
                  loginMode === 'accessKey' ? 'bg-white text-ink shadow-sm' : 'text-slate hover:text-ink',
                ].join(' ')}
              >
                Access Key
              </button>
            </div>

            {loginMode === 'password' ? (
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
              </div>
            ) : (
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Access Key</span>
                <input
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value)}
                  required
                  placeholder="Enter access key"
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            )}

            {error ? (
              <div className="mt-4 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="mt-5 text-xs leading-6 text-slate">
              After login, access is role-based for dashboard modules and hierarchy tools.
            </p>
          </form>

          <aside className="rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
            <p className="font-display text-2xl font-black text-ink">Demo Credentials</p>
            <p className="mt-3 text-sm leading-7 text-slate">
              These demo accounts are configured in `server/.env`. You can replace them with production credentials.
            </p>

            <div className="mt-5 space-y-3">
              {demoAccounts.map((entry) => (
                <article key={entry.email} className="rounded-xl bg-mist p-4 text-sm text-slate">
                  <p className="font-semibold text-ink">{entry.role}</p>
                  <p className="mt-2 font-mono text-xs">{entry.email}</p>
                  <p className="mt-1 font-mono text-xs">{entry.password}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('password');
                      setEmail(entry.email);
                      setPassword(entry.password);
                    }}
                    className="mt-3 rounded-full border border-ink/20 px-3 py-1 text-xs font-bold text-ink hover:bg-white"
                  >
                    Use This Account
                  </button>
                </article>
              ))}
            </div>

            <p className="mt-6 font-display text-xl font-black text-ink">Access Keys</p>
            <div className="mt-3 space-y-3">
              {demoAccessKeys.map((entry) => (
                <article key={entry.accessKey} className="rounded-xl bg-mist p-4 text-sm text-slate">
                  <p className="font-semibold text-ink">{entry.role}</p>
                  <p className="mt-2 font-mono text-xs">{entry.accessKey}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('accessKey');
                      setAccessKey(entry.accessKey);
                    }}
                    className="mt-3 rounded-full border border-ink/20 px-3 py-1 text-xs font-bold text-ink hover:bg-white"
                  >
                    Use This Key
                  </button>
                </article>
              ))}
            </div>

            <Link
              to="/"
              className="mt-6 inline-flex rounded-full border border-ink/15 px-5 py-3 text-sm font-bold text-ink"
            >
              Back to Public Home
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
