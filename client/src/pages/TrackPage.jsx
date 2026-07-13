import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { timelineStages } from '../data/content';
import { fetchPublicComplaint } from '../lib/publicApi';

const workflowLevelLabels = {
  village: 'QR access',
  cell: 'Evidence triage',
  sector: 'RIB intake',
  district: 'Investigation review',
  province: 'Supervisory review',
  national: 'National oversight',
};

function formatLabel(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLevel(level = '') {
  return workflowLevelLabels[level] ?? formatLabel(level);
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TrackPage() {
  const [searchParams] = useSearchParams();
  const [caseId, setCaseId] = useState(searchParams.get('caseId') ?? 'CF-2026-0412');
  const [caseRecord, setCaseRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const lookupCase = async (event) => {
    event?.preventDefault();
    if (!caseId.trim()) {
      return;
    }

    setIsLoading(true);
    setLookupError('');

    try {
      const response = await fetchPublicComplaint(caseId.trim());
      setCaseRecord(response.item);
    } catch {
      setCaseRecord(null);
      setLookupError('Case not found. Check the case ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    lookupCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Case transparency</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
              Let citizens see RIB case movement, not silence.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate">
              The tracking experience turns every corruption report into a visible process with
              status, responsible RIB workflow stage, deadline awareness, and escalation history.
            </p>

            <div className="mt-10 rounded-[2rem] bg-mist p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-clay">Lookup demo</p>
              <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={lookupCase}>
                <input
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-4 font-semibold text-ink outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-ink px-6 py-4 text-sm font-bold text-white"
                >
                  {isLoading ? 'Searching...' : 'Search case'}
                </button>
              </form>
              {lookupError ? <p className="mt-3 text-sm font-semibold text-red-700">{lookupError}</p> : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-ink/10 bg-mist p-6 shadow-soft lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Case preview</p>
                <h2 className="mt-2 font-display text-3xl font-black text-ink">
                  {caseRecord?.id ?? caseId}
                </h2>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-clay">
                {caseRecord
                  ? `${formatLabel(caseRecord.status)} at ${formatLevel(caseRecord.currentLevel)}`
                  : 'Waiting for lookup'}
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  id: 'status',
                  label: 'Status',
                  value: caseRecord ? formatLabel(caseRecord.status) : 'Loading',
                  note: caseRecord ? `Current stage: ${formatLevel(caseRecord.currentLevel)}` : 'Search a case ID',
                },
                {
                  id: 'source',
                  label: 'RIB source',
                  value: caseRecord?.sourceInstitutionName ?? 'RIB Intake',
                  note: caseRecord?.serviceName ?? 'QR corruption report intake',
                },
                {
                  id: 'deadline',
                  label: 'Deadline',
                  value: caseRecord ? formatDate(caseRecord.deadlineAt) : 'N/A',
                  note: 'Three-day response window',
                },
              ].map((item) => (
                <div key={item.id} className="rounded-[1.5rem] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">{item.label}</p>
                  <p className="mt-3 font-display text-2xl font-black text-ink">{item.value}</p>
                  <p className="mt-2 text-sm text-slate">{item.note}</p>
                </div>
              ))}
            </div>

            {caseRecord ? (
              <div className="mt-6 rounded-[1.5rem] bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-tide">Report summary</p>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {caseRecord.category} | {formatLabel(caseRecord.reportingMode)} | submitted{' '}
                  {formatDate(caseRecord.submittedAt)}
                </p>
                <p className="mt-3 leading-7 text-slate">{caseRecord.message}</p>
              </div>
            ) : null}

            <div className="mt-8 space-y-4">
              {timelineStages.map((item, index) => (
                <div key={item.stage} className="flex gap-4 rounded-[1.5rem] bg-white p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-xl font-bold text-ink">{item.stage}</p>
                      <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-tide">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-3 leading-7 text-slate">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TrackPage;
