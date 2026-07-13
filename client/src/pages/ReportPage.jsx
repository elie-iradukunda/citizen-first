import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { reportTypes } from '../data/content';
import { createPublicComplaint } from '../lib/publicApi';

const initialForm = {
  reportType: reportTypes[0],
  reportingMode: 'anonymous',
  institutionName: 'RIB Anti-Corruption Intake Desk',
  district: 'Kigali, Gasabo',
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
      : initialForm.institutionName,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedCase, setSubmittedCase] = useState(null);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmittedCase(null);

    try {
      const response = await createPublicComplaint({
        category: form.reportType,
        institutionId: 3,
        sourceInstitutionSlug: institutionSlug || 'rib-anti-corruption-intake-desk',
        serviceName: 'QR corruption report intake',
        message: form.complaint,
        reportingMode: form.reportingMode,
        submittedVia: institutionSlug ? 'qr' : 'public',
      });

      setSubmittedCase(response.item);
      setForm((current) => ({
        ...current,
        complaint: '',
      }));
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? 'Submission failed. Check that the complaint details are at least 20 characters and try again.'
          : 'Submission failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-mist">
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Complaint intake</p>
          <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
            RIB QR reporting designed for evidence, confidentiality, and accountability.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate">
            Citizens can report bribery, abuse of authority, intimidation, or unofficial service
            fees through a structured RIB intake workflow with optional identity verification.
          </p>
          {institutionSlug ? (
            <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-pine shadow-soft">
              QR-linked institution: {form.institutionName}
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {[
              'Anonymous or verified corruption reporting',
              'QR deep-link to the RIB Anti-Corruption Intake Desk',
              'Evidence-ready workflow for receipts, screenshots, documents, and voice notes',
              'Escalation to investigation and supervisory review when a case is sensitive or overdue',
            ].map((item) => (
              <div key={item} className="rounded-[1.6rem] border border-ink/10 bg-white p-5 text-slate shadow-soft">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] bg-ink p-6 text-white shadow-soft">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">Case-study note</p>
            <p className="mt-4 leading-7 text-white/78">
              The proposal uses Rwanda Investigation Bureau as the case study institution because
              the workflow focuses on corruption reporting, evidence preservation, citizen feedback,
              and accountable follow-up.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-clay">RIB case intake</p>
              <h2 className="mt-2 font-display text-3xl font-black text-ink">Submit a RIB report</h2>
            </div>
            <span className="rounded-full bg-mist px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-tide">
              Live demo
            </span>
          </div>

          <form className="mt-8 space-y-5" onSubmit={submitComplaint}>
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
                  <option value="verified">Verified citizen</option>
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
                  placeholder="Example: RIB Anti-Corruption Intake Desk"
                  className="w-full rounded-2xl border border-ink/10 bg-mist px-4 py-4 outline-none transition focus:border-tide"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">District or location</span>
                <input
                  name="district"
                  value={form.district}
                  onChange={updateField}
                  placeholder="Example: Kigali, Gasabo"
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
                placeholder="Describe the corruption concern clearly, including date, place, office, service requested, amount asked for, and available evidence."
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
                Include voice-note support on this RIB case form
              </span>
            </label>

            <div className="rounded-[1.6rem] border border-dashed border-ink/15 bg-mist px-5 py-6 text-sm leading-7 text-slate">
              Evidence-ready zone for the presentation: screenshots, receipts, documents, payment
              proof, and audio notes are represented in the workflow.
            </div>

            {submitError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {submitError}
              </div>
            ) : null}

            {submittedCase ? (
              <div className="rounded-2xl border border-tide/20 bg-tide/10 px-5 py-4 text-sm leading-7 text-ink">
                <span className="font-bold">Case received:</span> {submittedCase.id}. It is now
                routed to {submittedCase.sourceInstitutionName} for RIB intake review.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-ink px-6 py-4 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit RIB report'}
              </button>
              <Link
                to={submittedCase ? `/track?caseId=${submittedCase.id}` : '/track'}
                className="rounded-full border border-ink/15 px-6 py-4 text-sm font-bold text-ink"
              >
                Track case
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default ReportPage;
