import { sampleStatuses, timelineStages } from '../data/content';

function TrackPage() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Case transparency</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
              Let citizens see movement, not silence.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate">
              The tracking experience turns every complaint into a visible process with status,
              responsible level, deadline awareness, and escalation history.
            </p>

            <div className="mt-10 rounded-[2rem] bg-mist p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-clay">Lookup demo</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value="CF-2026-0412"
                  readOnly
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-4 font-semibold text-ink outline-none"
                />
                <button
                  type="button"
                  className="rounded-full bg-ink px-6 py-4 text-sm font-bold text-white"
                >
                  Search case
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-ink/10 bg-mist p-6 shadow-soft lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Case preview</p>
                <h2 className="mt-2 font-display text-3xl font-black text-ink">CF-2026-0412</h2>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-clay">
                In review at sector level
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {sampleStatuses.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">{item.id}</p>
                  <p className="mt-3 font-display text-2xl font-black text-ink">{item.status}</p>
                  <p className="mt-2 text-sm text-slate">Level: {item.level}</p>
                  <p className="mt-1 text-sm text-slate">{item.eta}</p>
                </div>
              ))}
            </div>

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
