import { useEffect, useState } from 'react';
import DashboardState from '../components/dashboard/DashboardState';
import { fetchEmergencyContacts } from '../lib/publicApi';

function EmergencyPage() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    fetchEmergencyContacts()
      .then((payload) => {
        if (isActive) {
          setContacts(payload.items);
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
            title="Loading emergency contacts"
            description="Preparing verified toll-free numbers and emergency support channels."
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
            title="Emergency contacts unavailable"
            description="Emergency contact data is not available right now. Please try again shortly."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Emergency Support</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Emergency toll-free numbers
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Use these hotlines for urgent incidents, corruption reporting, and public safety concerns.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contacts.map((contact) => (
            <article key={contact.id} className="rounded-[1.8rem] bg-ink p-6 text-white shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Hotline</p>
              <p className="mt-3 font-display text-5xl font-black">{contact.number}</p>
              <p className="mt-3 text-xl font-semibold">{contact.title}</p>
              <p className="mt-3 text-sm leading-6 text-white/75">{contact.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
          <p className="font-display text-2xl font-black text-ink">Emergency usage note</p>
          <p className="mt-3 leading-7 text-slate">
            For immediate danger always prioritize emergency hotlines first, then submit a formal complaint case on the platform for investigation tracking.
          </p>
        </div>
      </section>
    </div>
  );
}

export default EmergencyPage;
