import { useEffect, useState } from 'react';
import DashboardState from '../components/dashboard/DashboardState';
import { fetchHierarchy, fetchLocationTree } from '../lib/registrationApi';

function GovernanceStructurePage() {
  const [hierarchy, setHierarchy] = useState(null);
  const [tree, setTree] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    Promise.all([fetchHierarchy(), fetchLocationTree()])
      .then(([hierarchyPayload, treePayload]) => {
        if (isActive) {
          setHierarchy(hierarchyPayload);
          setTree(treePayload.items);
          setError('');
        }
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError.message);
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
  }, []);

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Loading governance structure"
            description="Preparing Rwanda local-government hierarchy and registration workflow rules."
          />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState title="Unable to load structure" description={error} />
        </section>
      </div>
    );
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Governance Structure</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Rwanda local-government hierarchy for secure registration
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Registration follows official administrative flow: National Admin → Province → District → Sector → Cell → Village.
        </p>

        <div className="mt-10 rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
          <p className="font-display text-2xl font-black text-ink">Registration Workflow</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              'National Admin',
              'Province Governor',
              'District Mayor',
              'Sector Executive Secretary',
              'Cell Executive Secretary',
              'Village Leader',
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate">
            Each level receives secure invite links, registers institution details, then creates the next-level invite.
          </p>
        </div>

        {hierarchy ? (
          <div className="mt-8 rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
            <p className="font-display text-2xl font-black text-ink">System Rules</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(hierarchy.nextLevelByRole).map(([role, next]) => (
                <article key={role} className="rounded-xl bg-mist p-4 text-sm text-slate">
                  <p className="font-semibold uppercase tracking-[0.08em] text-ink">{role}</p>
                  <p className="mt-2">Can invite: {next ?? 'No next level'}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft">
          <p className="font-display text-2xl font-black text-ink">Province and District Coverage</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tree.map((provinceEntry) => (
              <article key={provinceEntry.province} className="rounded-xl bg-mist p-5">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-tide">
                  {provinceEntry.province}
                </p>
                <p className="mt-2 text-sm text-slate">
                  Districts: {provinceEntry.districts.length}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate">
                  {provinceEntry.districts.map((districtEntry) => (
                    <li key={districtEntry.district}>{districtEntry.district}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default GovernanceStructurePage;
