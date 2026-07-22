import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canManageInstitutionSettings, getRoleDashboardPath } from '../lib/authRouting';
import { activateInstitution, fetchInviteDetail, inviteQrUrl } from '../lib/registrationApi';

function formatLocation(location = {}) {
  return [location.village, location.cell, location.sector, location.district, location.province, location.country]
    .filter(Boolean)
    .join(', ');
}

function InstitutionActivationPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') || '';
  const navigate = useNavigate();
  const { applySession } = useAuth();

  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(inviteToken));

  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!inviteToken) {
      setIsLoading(false);
      setLoadError('No invite token was provided. Please use the activation link from your email.');
      return;
    }

    let active = true;
    setIsLoading(true);
    fetchInviteDetail(inviteToken)
      .then((payload) => {
        if (!active) return;
        setInvite(payload.item);
        if (payload.item?.contactEmail) {
          setEmail(payload.item.contactEmail);
        }
      })
      .catch((fetchError) => {
        if (!active) return;
        setLoadError(fetchError.message || 'This invite link is not valid.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [inviteToken]);

  const inviteBlocked = useMemo(() => {
    if (!invite) return null;
    if (invite.expired) return 'This invite link has expired. Ask the inviting office to send a new one.';
    if (invite.status && invite.status !== 'pending') {
      return 'This invite link has already been used. If you already activated, please sign in instead.';
    }
    return null;
  }, [invite]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/^\d{16}$/.test(nationalId.trim())) {
      setError('National ID must be exactly 16 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await activateInstitution({
        inviteToken,
        leader: {
          fullName: fullName.trim(),
          nationalId: nationalId.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      });

      const user = applySession({ token: payload.token, user: payload.user });
      // Land the freshly-activated leader in Settings to finish configuring the
      // institution (services, departments, staff, links).
      const destination = canManageInstitutionSettings(user.role)
        ? '/dashboard/institution'
        : getRoleDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const levelLabel = invite?.targetLevel ? invite.targetLevel.toUpperCase() : '';

  return (
    <main className="min-h-screen bg-[#f5f8fc] font-sans text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand / invite summary panel */}
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
            <h2 className="max-w-md text-3xl font-black leading-tight">Activate your institution account</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
              Set your password to activate the institution below. You will be signed in immediately and can
              then complete your services, departments, staff, and leadership links in Settings.
            </p>

            {invite ? (
              <div className="mt-8 space-y-3 rounded-2xl border border-white/15 bg-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">You are activating</p>
                <p className="text-lg font-black">{invite.institutionNameHint}</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white/15 px-3 py-1">{levelLabel} level</span>
                  <span className="rounded-full bg-white/15 px-3 py-1">{formatLocation(invite.location)}</span>
                </div>
                <img
                  src={inviteQrUrl(inviteToken)}
                  alt="Activation QR code"
                  className="mt-2 h-36 w-36 rounded-xl border border-white/20 bg-white p-2"
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-white/80">
            <ShieldCheck className="h-5 w-5" />
            Secure activation — this link is meant only for the authorized institution leader.
          </div>
        </section>

        {/* Activation form */}
        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[460px] space-y-5">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-panel">
                Loading your invite…
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-panel">
                <h1 className="text-lg font-bold text-rose-600">Invite link problem</h1>
                <p className="mt-2 text-sm text-slate-600">{loadError}</p>
                <Link to="/" className="mt-6 inline-block text-xs font-semibold text-brand-600 hover:underline">
                  Back to public site
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-panel">
                <div className="mb-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
                    <Lock className="h-5 w-5" />
                  </span>
                  <h1 className="mt-5 text-[22px] font-bold tracking-tight text-slate-900">Set your password</h1>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Activating <span className="font-semibold text-slate-700">{invite?.institutionNameHint}</span>.
                  </p>
                </div>

                {invite ? (
                  <div className="mb-5 flex flex-wrap gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2.5 text-[11px] font-semibold text-brand-700 lg:hidden">
                    <span>{levelLabel} level</span>
                    <span className="text-brand-400">·</span>
                    <span>{formatLocation(invite.location)}</span>
                  </div>
                ) : null}

                {inviteBlocked ? (
                  <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    {inviteBlocked}{' '}
                    <Link to="/login" className="font-bold underline">Sign in</Link>
                  </div>
                ) : null}

                <div className="space-y-4">
                  <label className="block">
                    <span className="field-label">Your full name</span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      placeholder="e.g. Jean Uwimana"
                      className="app-input"
                    />
                  </label>

                  <label className="block">
                    <span className="field-label">National ID (16 digits)</span>
                    <input
                      value={nationalId}
                      onChange={(event) => setNationalId(event.target.value.replace(/\D/g, '').slice(0, 16))}
                      required
                      inputMode="numeric"
                      placeholder="1XXXXXXXXXXXXXXX"
                      className="app-input"
                    />
                  </label>

                  <label className="block">
                    <span className="field-label">Phone</span>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                      placeholder="+250788123456"
                      className="app-input"
                    />
                  </label>

                  <label className="block">
                    <span className="field-label">Email (your login)</span>
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="field-label">Password</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="app-input"
                      />
                    </label>
                    <label className="block">
                      <span className="field-label">Confirm password</span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        className="app-input"
                      />
                    </label>
                  </div>
                </div>

                {error ? (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(inviteBlocked)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <BadgeCheck className="h-4 w-4" />
                  {isSubmitting ? 'Activating…' : 'Activate & enter dashboard'}
                </button>

                <p className="mt-5 text-center text-xs text-slate-400">
                  Already activated?{' '}
                  <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default InstitutionActivationPage;
