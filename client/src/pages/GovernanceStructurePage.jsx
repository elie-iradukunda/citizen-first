const ribWorkflowStages = [
  {
    stage: 'Public QR Access',
    role: 'RIB Public QR Reporting Access Point',
    description: 'Citizen scans a QR code and opens the correct reporting channel without asking staff where to go.',
  },
  {
    stage: 'Evidence Triage',
    role: 'RIB Evidence Preservation and Triage Desk',
    description: 'Screenshots, receipts, documents, and voice notes are checked before case intake.',
  },
  {
    stage: 'Anti-Corruption Intake',
    role: 'RIB Anti-Corruption Intake Desk',
    description: 'The report is classified, assigned, and protected according to confidentiality needs.',
  },
  {
    stage: 'Investigation Review',
    role: 'RIB Economic and Financial Crimes Directorate',
    description: 'Sensitive or evidence-backed reports are reviewed for investigation action.',
  },
  {
    stage: 'Supervisory Review',
    role: 'RIB Supervisory Review and Escalation Unit',
    description: 'Overdue, unresolved, or high-risk cases are reviewed for accountability action.',
  },
  {
    stage: 'National Oversight',
    role: 'RIB National Oversight Command',
    description: 'Oversight users monitor trends, SLA performance, escalations, and sensitive reports.',
  },
];

function GovernanceStructurePage() {
  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">RIB Workflow</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          QR-enabled anti-corruption reporting workflow
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          The corrected case study follows Rwanda Investigation Bureau workflow logic: citizen access,
          evidence support, intake, investigation review, supervisory escalation, and national oversight.
        </p>

        <div className="mt-10 rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
          <p className="font-display text-2xl font-black text-ink">Case Study Context</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['Institution', 'Rwanda Investigation Bureau (RIB)'],
              ['Location', 'Kigali, Gasabo, Kacyiru'],
              ['Technology', 'QR code reporting with dashboards and escalation'],
            ].map(([label, value]) => (
              <article key={label} className="rounded-xl bg-mist p-4 text-sm text-slate">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">{label}</p>
                <p className="mt-2 font-semibold text-ink">{value}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
          <p className="font-display text-2xl font-black text-ink">Workflow Stages</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ribWorkflowStages.map((item, index) => (
              <article key={item.stage} className="rounded-xl bg-mist p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-tide">
                  Stage {index + 1}
                </p>
                <h2 className="mt-2 font-display text-2xl font-black text-ink">{item.stage}</h2>
                <p className="mt-2 text-sm font-semibold text-ink">{item.role}</p>
                <p className="mt-3 text-sm leading-7 text-slate">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
          <p className="font-display text-2xl font-black text-ink">Escalation Rule</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate">
            Each submitted report receives a case ID, assigned workflow stage, response deadline,
            and visible status. If a response is overdue or unsatisfactory, the case can move to the
            next independent review stage for stronger accountability.
          </p>
        </div>
      </section>
    </div>
  );
}

export default GovernanceStructurePage;
