import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { reportTypes } from '../data/content';

const initialForm = {
  reportType: reportTypes[0],
  reportingMode: 'anonymous',
  institutionName: '',
  district: '',
  complaint: '',
  voiceEnabled: true,
};

function ReportPage() {
  const [searchParams] = useSearchParams();
  const institutionSlug = searchParams.get('institution');
  const [form, setForm] = useState(() => ({
    ...initialForm,
    institutionName: institutionSlug
      ? institutionSlug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '',
  }));

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="bg-mist">
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Complaint intake</p>
          <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
            Secure reporting designed for speed, dignity, and trust.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate">
            Citizens can report bribery, delays, abuse of authority, or unknown service fees with
            optional identity verification and future voice submission support.
          </p>
          {institutionSlug ? (
            <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-pine shadow-soft">
              QR-linked institution: {form.institutionName}
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {[
              'Anonymous or verified submission',
              'Institution QR deep-link support',
              'Evidence-ready workflow for documents, images, and audio',
              'Automatic escalation after the response deadline',
            ].map((item) => (
              <div key={item} className="rounded-[1.6rem] border border-ink/10 bg-white p-5 text-slate shadow-soft">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] bg-ink p-6 text-white shadow-soft">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">Product note</p>
            <p className="mt-4 leading-7 text-white/78">
              For public trust, the final production version should make it very clear what happens
              to a case after submission, what data is stored, and which complaints are urgent enough
              to require a hotline instead of a normal queue.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-clay">Demo form</p>
              <h2 className="mt-2 font-display text-3xl font-black text-ink">Submit a complaint</h2>
            </div>
            <span className="rounded-full bg-mist px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-tide">
              Frontend prototype
            </span>
          </div>

          <form className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Report type</span>
                <select
                  name="reportType"
                  value={form.reportType}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-ink/10 bg-mist px-4 py-4 outline-none transition focus:border-tide"
                >
                  {reportTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Reporting mode</span>
                <select
                  name="reportingMode"
                  value={form.reportingMode}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-ink/10 bg-mist px-4 py-4 outline-none transition focus:border-tide"
                >
                  <option value="anonymous">Anonymous</option>
                  <option value="verified">Verified with NIDA</option>
                </select>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Institution name</span>
                <input
                  name="institutionName"
                  value={form.institutionName}
                  onChange={updateField}
                  placeholder="Example: Gisozi Sector Office"
                  className="w-full rounded-2xl border border-ink/10 bg-mist px-4 py-4 outline-none transition focus:border-tide"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">District or location</span>
                <input
                  name="district"
                  value={form.district}
                  onChange={updateField}
                  placeholder="Enter district"
                  className="w-full rounded-2xl border border-ink/10 bg-mist px-4 py-4 outline-none transition focus:border-tide"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Complaint details</span>
              <textarea
                name="complaint"
                value={form.complaint}
                onChange={updateField}
                rows="7"
                placeholder="Describe the issue clearly, including date, place, officer, service requested, and any amount asked for."
                className="w-full rounded-[1.6rem] border border-ink/10 bg-mist px-4 py-4 outline-none transition focus:border-tide"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-mist px-4 py-4">
              <input
                type="checkbox"
                name="voiceEnabled"
                checked={form.voiceEnabled}
                onChange={updateField}
                className="h-5 w-5 rounded border-ink/20 text-tide focus:ring-tide"
              />
              <span className="text-sm font-semibold text-ink">
                Include voice-reporting support on this case form
              </span>
            </label>

            <div className="rounded-[1.6rem] border border-dashed border-ink/15 bg-mist px-5 py-6 text-sm leading-7 text-slate">
              Future backend upload zone: photos, payment proof, screenshots, and audio recordings.
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                className="rounded-full bg-ink px-6 py-4 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5"
              >
                Save complaint draft
              </button>
              <Link
                to="/track"
                className="rounded-full border border-ink/15 px-6 py-4 text-sm font-bold text-ink"
              >
                View tracking flow
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default ReportPage;
