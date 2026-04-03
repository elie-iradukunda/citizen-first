import { useEffect, useMemo, useState } from 'react';
import DashboardState from '../components/dashboard/DashboardState';
import LocationFieldGroup from '../components/forms/LocationFieldGroup';
import { useAuth } from '../context/AuthContext';
import { useRwandaLocation } from '../hooks/useRwandaLocation';
import { createInstitutionInvite, fetchHierarchy } from '../lib/registrationApi';

const levelOptions = ['province', 'district', 'sector', 'cell', 'village'];
const nextLevelByRole = {
  national_admin: 'province',
  province_leader: 'district',
  district_leader: 'sector',
  sector_leader: 'cell',
  cell_leader: 'village',
};

function getAllowedLevelsByRole(role) {
  const level = nextLevelByRole[role];
  return level ? [level] : levelOptions;
}

function InstitutionInvitePage() {
  const { user } = useAuth();
  const { location, updateLocation, options, catalogAvailable } = useRwandaLocation();
  const allowedLevels = useMemo(() => getAllowedLevelsByRole(user?.role), [user?.role]);
  const [accessKey, setAccessKey] = useState('');
  const [targetLevel, setTargetLevel] = useState(allowedLevels[0]);
  const [institutionNameHint, setInstitutionNameHint] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdInvite, setCreatedInvite] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);

  useEffect(() => {
    fetchHierarchy()
      .then((payload) => setHierarchy(payload))
      .catch(() => setHierarchy(null));
  }, []);

  useEffect(() => {
    setTargetLevel(allowedLevels[0]);
  }, [allowedLevels]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCreatedInvite(null);
    setIsSubmitting(true);

    try {
      if (!user && !accessKey.trim()) {
        throw new Error('Access key is required when no user session is active.');
      }

      const response = await createInstitutionInvite(accessKey, {
        targetLevel,
        institutionNameHint,
        location,
        contactEmail,
        contactPhone,
        expiresInDays: Number(expiresInDays),
      });

      setCreatedInvite(response.item);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Institution Access Setup</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Generate secure registration invite links
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          National admin and registered leaders generate level-based invite links. The invited institution leader completes registration through the link or QR code.
        </p>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <form onSubmit={onSubmit} className="space-y-5 rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft lg:p-8">
            {user ? (
              <div className="rounded-xl border border-pine/20 bg-pine/10 px-4 py-3 text-sm text-ink">
                Authenticated as <span className="font-bold">{user.fullName}</span> ({user.role}).
                Invite generation will use your active session.
              </div>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Access Key (Optional if Logged In)</span>
              <input
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                placeholder="Example: CF-ADMIN-2026"
                className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Target Level</span>
                <select
                  value={targetLevel}
                  onChange={(event) => setTargetLevel(event.target.value)}
                  disabled={Boolean(nextLevelByRole[user?.role])}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                >
                  {allowedLevels.map((level) => (
                    <option key={level} value={level}>
                      {level.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Expires in Days</span>
                <input
                  type="number"
                  value={expiresInDays}
                  min="1"
                  max="30"
                  onChange={(event) => setExpiresInDays(event.target.value)}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Institution Name Hint</span>
              <input
                value={institutionNameHint}
                onChange={(event) => setInstitutionNameHint(event.target.value)}
                required
                placeholder="Example: Kicukiro District Office"
                className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Invite Email (Optional)</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Invite Phone (Optional)</span>
                <input
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="+250788123456"
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            </div>

            <LocationFieldGroup
              title="Invite Location Scope"
              location={location}
              updateLocation={updateLocation}
              options={options}
              catalogAvailable={catalogAvailable}
              requiredLevel={targetLevel}
            />

            {error ? (
              <div className="rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {isSubmitting ? 'Generating...' : 'Generate Invite Link'}
            </button>
          </form>

          <div className="space-y-5">
            {createdInvite ? (
              <div className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
                <p className="font-display text-2xl font-black text-ink">Invite Created</p>
                <p className="mt-3 text-sm leading-7 text-slate">
                  Share this link only with the authorized institution leader.
                </p>
                <div className="mt-4 rounded-xl bg-mist p-3 text-xs text-ink">
                  {createdInvite.registrationLink}
                </div>
                {createdInvite.qrCodeDataUrl ? (
                  <img
                    src={createdInvite.qrCodeDataUrl}
                    alt="Institution registration QR code"
                    className="mt-4 w-56 rounded-xl border border-ink/10 bg-white p-2"
                  />
                ) : null}
              </div>
            ) : (
              <DashboardState
                title="No Invite Generated Yet"
                description="Create a level-specific invite and share it with the appropriate government leader."
              />
            )}

            <div className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
              <p className="font-display text-2xl font-black text-ink">Hierarchy Rule</p>
              <p className="mt-3 text-sm leading-7 text-slate">
                Each role can only invite the next level. National admin invites Province, Province invites District, District invites Sector, Sector invites Cell, and Cell invites Village.
              </p>
              {nextLevelByRole[user?.role] ? (
                <p className="mt-3 text-sm font-semibold text-ink">
                  Your allowed next level: {nextLevelByRole[user.role].toUpperCase()}
                </p>
              ) : null}
            </div>

            {hierarchy ? (
              <div className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
                <p className="font-display text-2xl font-black text-ink">Structure Snapshot</p>
                <p className="mt-3 text-sm text-slate">
                  Provinces: {hierarchy.structureSummary.provinces} | Districts: {hierarchy.structureSummary.districts}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default InstitutionInvitePage;
