import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const switchAccount = searchParams.get('switch') === '1';
  const navigate = useNavigate();
  const { login, user, isAuthenticated, isChecking } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="app-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-brand-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 transition hover:text-brand-500"
                >
                  Forgot password?
                </Link>
              </div>
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

          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
