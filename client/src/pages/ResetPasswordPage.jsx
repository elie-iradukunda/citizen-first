import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { submitPasswordReset } from '../lib/authApi';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPasswordReset({ token, password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc] px-5 py-10 font-sans text-slate-900">
      <div className="w-full max-w-[440px]">
        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-panel">
          <div className="mb-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
              <Lock className="h-5 w-5" />
            </span>
            <h1 className="mt-5 text-[22px] font-bold tracking-tight text-slate-900">
              Set a new password
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Choose a password of at least 8 characters. You will be signed out of any other device.
            </p>
          </div>

          {!token ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-600">
              This page needs the reset link from your email. Open the link in the message we sent you,
              or request a new one.
            </div>
          ) : done ? (
            <div className="flex gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs leading-5 text-brand-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Password updated. Taking you to the sign-in page...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="field-label">New password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
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

              <label className="block">
                <span className="field-label">Confirm new password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="app-input"
                />
              </label>
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          {token && !done ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save new password'}
            </button>
          ) : null}

          <Link
            to="/forgot-password"
            className="mt-6 block text-center text-xs font-semibold text-slate-400 transition hover:text-brand-600"
          >
            Request a new reset link
          </Link>
        </form>
      </div>
    </main>
  );
}

export default ResetPasswordPage;
