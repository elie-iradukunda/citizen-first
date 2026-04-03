import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { publicFeatureBlocks, quickStats } from '../data/publicContent';
import { fetchEmergencyContacts, fetchPublicServices } from '../lib/publicApi';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay },
  }),
};

function HomePage() {
  const [services, setServices] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  useEffect(() => {
    let isActive = true;

    Promise.allSettled([fetchPublicServices(), fetchEmergencyContacts()]).then((results) => {
      if (!isActive) {
        return;
      }

      const [servicesResult, emergencyResult] = results;

      if (servicesResult.status === 'fulfilled') {
        setServices(servicesResult.value.items.slice(0, 6));
      }

      if (emergencyResult.status === 'fulfilled') {
        setEmergencyContacts(emergencyResult.value.items);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="bg-mist text-ink">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#173973_0%,#1f4789_52%,#102f60_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,221,0,0.24),transparent_32%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <motion.div initial="hidden" animate="visible" className="relative z-10">
            <motion.span
              custom={0.1}
              variants={fadeUp}
              className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-gold"
            >
              Public Service & Integrity Platform
            </motion.span>
            <motion.h1
              custom={0.2}
              variants={fadeUp}
              className="mt-6 max-w-3xl font-display text-5xl font-black leading-tight md:text-6xl"
            >
              Get trusted guidance, report issues, and protect your rights in local institutions.
            </motion.h1>
            <motion.p
              custom={0.3}
              variants={fadeUp}
              className="mt-6 max-w-2xl text-lg leading-8 text-white/84"
            >
              Citizen First combines AI guidance, emergency support, and anti-corruption reporting so
              every citizen can quickly find the right office and the right next step.
            </motion.p>

            <motion.div custom={0.4} variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/assistant"
                className="rounded-full bg-gold px-6 py-4 text-sm font-bold text-ink transition hover:brightness-95"
              >
                Ask AI Assistant
              </Link>
              <Link
                to="/services"
                className="rounded-full border border-white/30 bg-white/10 px-6 py-4 text-sm font-bold text-white"
              >
                Browse Services
              </Link>
              <Link
                to="/report"
                className="rounded-full border border-white/30 bg-white/10 px-6 py-4 text-sm font-bold text-white"
              >
                Submit Complaint
              </Link>
              <Link
                to="/register/citizen"
                className="rounded-full border border-white/30 bg-white/10 px-6 py-4 text-sm font-bold text-white"
              >
                Register Citizen
              </Link>
            </motion.div>

            <motion.div custom={0.5} variants={fadeUp} className="mt-10 grid gap-4 md:grid-cols-3">
              {quickStats.map((item) => (
                <article key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="font-display text-3xl font-black text-gold">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/80">{item.label}</p>
                </article>
              ))}
            </motion.div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 rounded-[1.8rem] border border-white/15 bg-white/10 p-6 backdrop-blur"
          >
            <h2 className="font-display text-3xl font-black">Quick Public Actions</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Emergency</p>
                <p className="mt-2 text-lg font-semibold">Call 112 for urgent danger and safety events</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Anti-Corruption</p>
                <p className="mt-2 text-lg font-semibold">Call 997 to report bribery and extortion</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Case Tracking</p>
                <p className="mt-2 text-lg font-semibold">Monitor complaint movement by case ID</p>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">What citizens can do</p>
            <h2 className="mt-4 font-display text-4xl font-black">Core public platform features</h2>
          </div>
          <p className="max-w-2xl leading-7 text-slate">
            The platform is designed for both first-time users and experienced citizens with clear guidance,
            transparent escalation, and direct emergency access.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {publicFeatureBlocks.map((item, index) => {
            const icons = [
              <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-tide" key="chat" />,
              <ExclamationTriangleIcon className="h-10 w-10 text-tide" key="warning" />,
              <ShieldCheckIcon className="h-10 w-10 text-tide" key="shield" />,
            ];

            return (
              <article key={item.title} className="rounded-[1.6rem] border border-ink/10 bg-white p-6 shadow-soft">
                {icons[index]}
                <h3 className="mt-4 font-display text-2xl font-black text-ink">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Secure onboarding flow</p>
          <h2 className="mt-4 font-display text-4xl font-black text-ink">
            Hierarchical registration from national to village
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              '1. National admin creates Province invite link and QR.',
              '2. Province leader registers and receives secure access key.',
              '3. Province invites District, District invites Sector.',
              '4. Sector invites Cell, Cell invites Village.',
              '5. Each leader registers departments and employees.',
              '6. Institution QR code is generated for citizen access.',
            ].map((step) => (
              <article key={step} className="rounded-2xl border border-ink/10 bg-mist p-5">
                <p className="text-sm leading-7 text-slate">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Popular services</p>
              <h2 className="mt-4 font-display text-4xl font-black text-ink">
                Public service guidance by institution level
              </h2>
            </div>
            <Link
              to="/services"
              className="rounded-full border border-ink/20 px-5 py-3 text-sm font-bold text-ink"
            >
              View all services
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.length > 0
              ? services.map((service) => (
                  <article key={service.id} className="rounded-[1.6rem] border border-ink/10 bg-mist p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-tide">{service.category}</p>
                    <h3 className="mt-3 font-display text-2xl font-black text-ink">{service.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate">{service.primaryOffice}</p>
                    <p className="mt-3 text-sm font-semibold text-ink">{service.processingTime}</p>
                  </article>
                ))
              : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-8 shadow-soft lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Emergency support</p>
              <h2 className="mt-4 font-display text-4xl font-black text-ink">Emergency toll-free numbers</h2>
            </div>
            <Link
              to="/emergency"
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
            >
              Open emergency page
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {emergencyContacts.slice(0, 4).map((contact) => (
              <article key={contact.id} className="rounded-[1.5rem] bg-ink p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Hotline</p>
                <p className="mt-3 font-display text-3xl font-black">{contact.number}</p>
                <p className="mt-2 text-base font-semibold">{contact.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/75">{contact.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">Digital public support</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-black leading-tight">
              Ask the AI assistant where to go, what to prepare, and how to escalate when service fails.
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/75">
              The assistant combines service routing guidance with emergency and anti-corruption support so
              citizens receive practical next steps quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/assistant" className="rounded-full bg-gold px-6 py-4 text-sm font-bold text-ink">
              Open AI Assistant
            </Link>
            <Link to="/register/invite" className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white">
              Institution Invite
            </Link>
            <Link to="/governance-structure" className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white">
              View Hierarchy
            </Link>
            <Link to="/report" className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white">
              Submit Report
            </Link>
            <Link to="/track" className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white">
              Track Case
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
