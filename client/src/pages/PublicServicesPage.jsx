import { useEffect, useState } from 'react';
import DashboardState from '../components/dashboard/DashboardState';
import { fetchPublicServices } from '../lib/publicApi';

function PublicServicesPage() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    fetchPublicServices()
      .then((payload) => {
        if (isActive) {
          setServices(payload.items);
          setHasError(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setHasError(true);
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
            title="Loading services"
            description="Preparing the public service catalog and institution routing guidance."
          />
        </section>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Services unavailable"
            description="Public service data could not be loaded. Please verify the API and try again."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Public Services</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Service guidance for local institutions
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Citizens can check where to go, expected processing time, and what documents to prepare before visiting an office.
        </p>

        <div className="mt-10 grid gap-6">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-tide">{service.category}</p>
                  <h2 className="mt-3 font-display text-3xl font-black text-ink">{service.title}</h2>
                </div>
                <span className="rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink">
                  {service.processingTime}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate">
                <span className="font-semibold text-ink">Primary office: </span>
                {service.primaryOffice}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate">
                <span className="font-semibold text-ink">Fee note: </span>
                {service.feeNote}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {service.requirements.map((item) => (
                  <div key={item} className="rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PublicServicesPage;
