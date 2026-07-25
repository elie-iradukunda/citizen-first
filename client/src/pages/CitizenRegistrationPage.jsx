import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerCitizen } from '../lib/registrationApi';
import { useRwandaLocation } from '../hooks/useRwandaLocation';

const initialCitizen = {
  fullName: '',
  nationalId: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  gender: 'Female',
  idType: 'NATIONAL_ID',
};

const DEFAULT_LOCATION = {
  country: 'Rwanda',
  province: 'Kigali City',
  district: 'Gasabo',
  sector: 'Kacyiru',
  cell: 'Kamatamu',
  village: 'Ubumwe',
};

function Field({ label, name, value, onChange, type = 'text', placeholder = '', autoComplete = 'off', ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-emerald-50/85">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 h-11 w-full rounded border border-emerald-200/15 bg-[#0c141c]/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        {...props}
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-emerald-50/85">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 h-11 w-full rounded border border-emerald-200/15 bg-[#0c141c]/70 px-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
      >
        {children}
      </select>
    </label>
  );
}

function ReadOnlyLocation({ label, value }) {
  return (
    <div className="rounded border border-emerald-300/10 bg-emerald-400/5 px-3 py-3">
      <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-emerald-300/80">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function CitizenRegistrationPage() {
  const [form, setForm] = useState(initialCitizen);
  const { location, updateLocation, options } = useRwandaLocation(DEFAULT_LOCATION);
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
        fullName: form.fullName.trim(),
        nationalId: form.nationalId.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        idType: form.idType,
        country: location.country || 'Rwanda',
        province: location.province,
        district: location.district,
        sector: location.sector.trim(),
        cell: location.cell.trim(),
        village: location.village.trim(),
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
    <main className="min-h-screen bg-[#07110c] font-sans text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(22,163,74,0.18),transparent_34%),linear-gradient(180deg,#07110c_0%,#08130f_50%,#050b08_100%)]" />

      <section className="relative mx-auto grid min-h-screen max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
        <div>
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black text-[#04110b] shadow-[0_14px_28px_rgba(16,185,129,0.28)]">
            SA
          </div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-300">
            Citizen registration
          </p>
          <h1 className="mt-4 max-w-xl text-[2.55rem] font-extrabold leading-tight text-white md:text-5xl">
            Create a citizen account
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-emerald-50/70">
            Citizens in the Kacyiru case-study area create an account before submitting or tracking
            poor-service and corruption reports.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <ReadOnlyLocation label="Country" value={location.country || 'Rwanda'} />
            <ReadOnlyLocation label="Province" value={location.province || 'Not selected'} />
            <ReadOnlyLocation label="District" value={location.district || 'Not selected'} />
            <ReadOnlyLocation label="Sector" value={location.sector || 'Not entered'} />
          </div>

          <div className="mt-8 rounded-[1rem] border border-emerald-300/10 bg-[#0b1410]/85 p-5">
            <p className="text-sm font-black text-white">Registration flow</p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-emerald-50/70">
              <p>1. Enter identity and contact details.</p>
              <p>2. Choose your Intara and Akarere, then type your Umurenge, Akagari, and Umudugudu.</p>
              <p>3. Login and submit reports only from a citizen account.</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[1rem] border border-emerald-400/10 bg-[#0b1410]/95 px-6 py-7 shadow-[0_26px_80px_rgba(0,0,0,0.42)] lg:px-8 lg:py-8"
        >
          <div className="mb-6">
            <h2 className="text-[1.65rem] font-extrabold leading-tight text-white">Citizen Profile</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-100/65">
              Use official details. The account will be used for report follow-up.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full Name" name="fullName" value={form.fullName} onChange={updateForm} required />
            <Field
              label="National ID"
              name="nationalId"
              value={form.nationalId}
              onChange={updateForm}
              placeholder="16 digits"
              inputMode="numeric"
              pattern="[0-9]{16}"
              required
            />
            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={updateForm}
              type="tel"
              autoComplete="tel"
              placeholder="0788123456"
              required
            />
            <Field
              label="Email"
              name="email"
              value={form.email}
              onChange={updateForm}
              type="email"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              name="password"
              value={form.password}
              onChange={updateForm}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Field
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateForm}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Field
              label="Date of Birth"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={updateForm}
              type="date"
              required
            />
            <SelectField label="Gender" name="gender" value={form.gender} onChange={updateForm}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </SelectField>
          </div>

          <div className="mt-6 rounded-[1rem] border border-emerald-300/10 bg-emerald-400/5 p-4">
            <p className="text-sm font-black text-white">Your local address</p>
            <p className="mt-1 text-xs leading-5 text-emerald-100/60">
              Choose your Intara and Akarere, then type your Umurenge, Akagari, and Umudugudu exactly
              as they are known locally.
            </p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <SelectField
                label="Intara / Province"
                name="province"
                value={location.province}
                onChange={(event) => updateLocation('province', event.target.value)}
              >
                <option value="">Select province</option>
                {options.provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Akarere / District"
                name="district"
                value={location.district}
                onChange={(event) => updateLocation('district', event.target.value)}
              >
                <option value="">Select district</option>
                {options.districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </SelectField>
              <Field
                label="Umurenge / Sector"
                name="sector"
                value={location.sector}
                onChange={(event) => updateLocation('sector', event.target.value)}
                placeholder="Type your sector"
                list="citizen-sector-options"
                required
              />
              <Field
                label="Akagari / Cell"
                name="cell"
                value={location.cell}
                onChange={(event) => updateLocation('cell', event.target.value)}
                placeholder="Type your cell"
                list="citizen-cell-options"
                required
              />
              <Field
                label="Umudugudu / Village"
                name="village"
                value={location.village}
                onChange={(event) => updateLocation('village', event.target.value)}
                placeholder="Type your village"
                list="citizen-village-options"
                required
              />
            </div>

            <datalist id="citizen-sector-options">
              {options.sectors.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <datalist id="citizen-cell-options">
              {options.cells.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <datalist id="citizen-village-options">
              {options.villages.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          {error ? (
            <div className="mt-5 rounded border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="mt-5 rounded border border-emerald-300/25 bg-emerald-400/10 px-3 py-3 text-sm leading-6 text-emerald-50/85">
              Citizen registered successfully. Login email: <span className="font-bold">{result.loginEmail}</span>.
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded bg-emerald-600 px-6 text-sm font-extrabold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Registering...' : 'Create Account'}
            </button>
            <Link
              to="/login?redirect=%2Fdashboard%2Fcitizen%2Fscan-services"
              className="inline-flex h-11 items-center rounded border border-emerald-300/15 px-5 text-sm font-bold text-emerald-50/80 transition hover:border-emerald-300/35 hover:text-white"
            >
              Login instead
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CitizenRegistrationPage;
