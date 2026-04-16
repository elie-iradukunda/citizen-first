import { useEffect, useState } from 'react';
import { fetchInstitutionQr } from '../../lib/institutionApi';

function InstitutionAccessQrPanel({ institutionSlug, institutionName }) {
  const [payload, setPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(institutionSlug));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!institutionSlug) {
      setPayload(null);
      setIsLoading(false);
      setError('');
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError('');

    fetchInstitutionQr(institutionSlug)
      .then((result) => {
        if (isActive) {
          setPayload(result);
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setPayload(null);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [institutionSlug]);

  if (!institutionSlug) {
    return (
      <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
        QR access will appear after the institution is fully registered and linked to this dashboard.
      </article>
    );
  }

  if (isLoading) {
    return (
      <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
        Preparing citizen access QR for {institutionName}.
      </article>
    );
  }

  if (error || !payload) {
    return (
      <article className="rounded-2xl border border-clay/20 bg-clay/10 px-4 py-4 text-sm text-clay">
        {error || 'Citizen access QR could not be prepared right now.'}
      </article>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[12rem_1fr]">
      <div className="rounded-[1.6rem] border border-ink/10 bg-mist p-3">
        <img
          src={payload.accessQrCodeDataUrl}
          alt={`${institutionName} citizen access QR code`}
          className="w-full rounded-[1.1rem] bg-white p-2"
        />
      </div>
      <div className="space-y-3 text-sm text-slate">
        <article className="rounded-2xl bg-mist px-4 py-4">
          Scan once and the citizen chooses whether to view institution information or continue to issue reporting.
        </article>
        <article className="rounded-2xl bg-mist px-4 py-4">
          Public access page: <span className="font-semibold text-ink">{payload.accessUrl}</span>
        </article>
        <div className="flex flex-wrap gap-3">
          <a
            href={payload.accessUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white"
          >
            Open citizen access
          </a>
          <a
            href={payload.infoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink"
          >
            Open info section
          </a>
        </div>
      </div>
    </div>
  );
}

export default InstitutionAccessQrPanel;
