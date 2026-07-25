import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import { requestPasswordReset } from '../lib/authApi';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      const payload = await requestPasswordReset(email.trim().toLowerCase());
      setNotice(payload.message);
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
              <KeyRound className="h-5 w-5" />
            </span>
            <h1 className="mt-5 text-[22px] font-bold tracking-tight text-slate-900">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter the email address of your SACCFP account and we will send you a link to set a new
              password.
            </p>
          </div>

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

          {notice ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs leading-5 text-brand-700">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>

          <Link
            to="/login"
            className="mt-6 block text-center text-xs font-semibold text-slate-400 transition hover:text-brand-600"
          >
            Back to sign in
          </Link>
        </form>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;
