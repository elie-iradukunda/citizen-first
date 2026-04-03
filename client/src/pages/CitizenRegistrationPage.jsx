import { useState } from 'react';
import DashboardState from '../components/dashboard/DashboardState';
import LocationFieldGroup from '../components/forms/LocationFieldGroup';
import { useRwandaLocation } from '../hooks/useRwandaLocation';
import { registerCitizen } from '../lib/registrationApi';

const initialCitizen = {
  fullName: '',
  nationalId: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  gender: 'Male',
  idType: 'NATIONAL_ID',
};

function CitizenRegistrationPage() {
  const { location, updateLocation, options, catalogAvailable } = useRwandaLocation(
    {},
    'registered',
  );
  const [form, setForm] = useState(initialCitizen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setIsSubmitting(true);

    try {
      if (form.password !== form.confirmPassword) {
        throw new Error('Password confirmation does not match.');
      }

      const response = await registerCitizen({
        fullName: form.fullName,
        nationalId: form.nationalId,
        phone: form.phone,
        email: form.email,
        password: form.password,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        idType: form.idType,
        ...location,
      });
      setResult(response.item);
      setForm(initialCitizen);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Citizen Registration</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Register citizen profile with full location
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Citizens register using official identity and location from province down to village for accurate service routing.
        </p>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={onSubmit} className="space-y-5 rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft lg:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Full Name</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={updateForm}
                  required
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">National ID</span>
                <input
                  name="nationalId"
                  value={form.nationalId}
                  onChange={updateForm}
                  required
                  placeholder="16 digits"
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={updateForm}
                  required
                  placeholder="+250788123456"
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Email</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={updateForm}
                  type="email"
                  required
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Password</span>
                <input
                  name="password"
                  value={form.password}
                  onChange={updateForm}
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Confirm Password</span>
                <input
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={updateForm}
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Date of Birth</span>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={updateForm}
                  required
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Gender</span>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={updateForm}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">ID Type</span>
                <select
                  name="idType"
                  value={form.idType}
                  onChange={updateForm}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                >
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </label>
            </div>

            <LocationFieldGroup
              title="Citizen Location"
              location={location}
              updateLocation={updateLocation}
              options={options}
              catalogAvailable={catalogAvailable}
              requiredLevel="village"
            />
            {options.provinces.length === 0 ? (
              <div className="rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay">
                No registered institution hierarchy found yet. Complete national-to-village institution onboarding first.
              </div>
            ) : null}

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
              {isSubmitting ? 'Registering...' : 'Register Citizen'}
            </button>
          </form>

          <div className="space-y-5">
            {result ? (
              <DashboardState
                title="Citizen Registered"
                description={`Citizen ID: ${result.citizenId}. Login email: ${result.loginEmail}. Registration completed with location ${result.location.village}, ${result.location.cell}, ${result.location.sector}.`}
              />
            ) : null}

            <div className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
              <p className="font-display text-2xl font-black text-ink">Why location is required</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate">
                <li>Accurate complaint routing to local institution level.</li>
                <li>Faster service follow-up in the right office.</li>
                <li>Clear escalation from village to national levels.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CitizenRegistrationPage;
