import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { publicFeatureBlocks, quickStats } from '../data/publicContent';
import { fetchEmergencyContacts, fetchPublicServices } from '../lib/publicApi';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay },
  }),
};

const processSteps = [
  {
    title: 'Join and verify profile',
    description:
      'Citizen or institution users register once with complete location and identity information.',
  },
  {
    title: 'Submit issue to local level',
    description:
      'Complaints start from village or cell leadership and include clear evidence and target leaders.',
  },
  {
    title: 'Escalation after SLA window',
    description:
      'Unresolved cases automatically move up the chain after 3 working days with full history.',
  },
  {
    title: 'Track outcomes transparently',
    description:
      'Every update remains visible in dashboard timeline with current level, deadline, and resolution notes.',
  },
];

const governancePillars = [
  {
    title: 'Citizen-first service routing',
    description: 'AI and hierarchy guidance direct people to the exact office that can solve their issue.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    title: 'Integrity and anti-corruption focus',
    description: 'Hotlines, structured reporting, and escalation controls reduce room for hidden misconduct.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Fast emergency and incident support',
    description: 'Emergency channels are always visible for immediate response and protection.',
    icon: ExclamationTriangleIcon,
  },
];

const heroVisuals = {
  main: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Kigali%27s_Convention_Center.jpg/1920px-Kigali%27s_Convention_Center.jpg",
};

const heroGalleryImages = [
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Kigali%27s_Convention_Center.jpg/1280px-Kigali%27s_Convention_Center.jpg",
    alt: 'Kigali Convention Centre at dusk',
    tag: 'Kigali Convention Centre',
  },
  {
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    alt: 'Citizen service support staff reviewing service documents',
    tag: 'Citizen Service Desk',
  },
  {
    src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
    alt: 'Citizen support and paperwork handling',
    tag: 'Citizen Support',
  },
  {
    src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Team coordination for governance and accountability',
    tag: 'Leadership Coordination',
  },
  {
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Digital dashboard and analytics monitoring',
    tag: 'Digital Dashboard Oversight',
  },
  {
    src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    alt: 'Public institution collaboration session',
    tag: 'Public Institution Collaboration',
  },
];

const communityVisualCards = [
  {
    title: 'Local leadership coordination',
    description: 'Sector and cell teams align on service delivery and issue follow-up plans.',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Digital citizen support',
    description: 'Citizens can get guidance online and track official complaint progress securely.',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Transparent service offices',
    description: 'Institution teams publish service requirements and accountability contact points.',
    image:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
  },
];

function HomePage() {
  const [services, setServices] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [heroGalleryIndex, setHeroGalleryIndex] = useState(0);
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = useMemo(
    () => (isAuthenticated ? getRoleDashboardPath(user?.role) : '/login?redirect=%2Fdashboards'),
    [isAuthenticated, user?.role],
  );

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
        setEmergencyContacts(emergencyResult.value.items.slice(0, 6));
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroGalleryIndex((current) => (current + 1) % heroGalleryImages.length);
    }, 2800);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const activeGalleryImage = heroGalleryImages[heroGalleryIndex];

  return (
    <div className="bg-mist text-ink">
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(120deg, #0f2b5c 0%, #204d93 55%, #234f8f 100%)',
        }}
      >
        <div className="absolute inset-0">
          <img
            src={heroVisuals.main}
            alt="Kigali Convention Centre representing Rwanda public service infrastructure"
            className="h-full w-full object-cover opacity-[0.22] brightness-[0.55] saturate-75"
          />
          <div className="absolute inset-0 bg-ink/80" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,18,43,0.90)_0%,rgba(8,29,63,0.74)_46%,rgba(7,26,55,0.50)_100%)]" />
        <motion.div
          aria-hidden="true"
          animate={{ y: [-8, 12, -8] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-14 top-24 h-40 w-40 rounded-full bg-gold/30 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          animate={{ y: [10, -14, 10] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-10 top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(255,221,0,0.25),transparent_34%)]" />

        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-20 lg:pt-20">
          <motion.div initial="hidden" animate="visible" className="relative z-10 text-white">
            <div className="rounded-[2rem] border border-white/30 bg-ink/55 p-5 shadow-[0_30px_80px_rgba(2,10,28,0.50)] backdrop-blur-[2px] lg:p-7">
              <motion.span
                custom={0.1}
                variants={fadeUp}
                className="inline-flex rounded-full border border-white/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-gold"
              >
                Smart Anti-Corruption and Citizen Feedback Platform
              </motion.span>
              <motion.h1
                custom={0.2}
                variants={fadeUp}
                className="mt-6 max-w-3xl font-display text-5xl font-black leading-tight text-white md:text-6xl"
              >
                Trusted public services, clear accountability, and real dashboard follow-up.
              </motion.h1>
              <motion.p
                custom={0.3}
                variants={fadeUp}
                className="mt-6 max-w-2xl text-lg leading-8 text-mist drop-shadow-[0_1px_2px_rgba(3,12,29,0.7)]"
              >
                From village to national level, Citizen First helps residents register, ask for service guidance,
                submit issues, and track official response history in one secure digital experience.
              </motion.p>

              <motion.div custom={0.4} variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={isAuthenticated ? dashboardPath : '/register/citizen'}
                  className="rounded-full bg-gold px-6 py-4 text-sm font-bold text-ink transition hover:brightness-95"
                >
                  {isAuthenticated ? 'Go to my dashboard' : 'Join as citizen'}
                </Link>
                <Link
                  to={isAuthenticated ? dashboardPath : '/login?redirect=%2Fdashboards'}
                  className="rounded-full border border-white/40 bg-white/10 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  {isAuthenticated ? 'Continue logged session' : 'Login to dashboard'}
                </Link>
                <Link
                  to="/register/institution"
                  className="rounded-full border border-white/40 bg-white/10 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  Institution onboarding
                </Link>
              </motion.div>
            </div>

            <motion.div custom={0.5} variants={fadeUp} className="mt-10 grid gap-4 md:grid-cols-3">
              {quickStats.map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-white/30 bg-white/10 p-4 shadow-[0_10px_25px_rgba(2,10,28,0.35)]"
                >
                  <p className="font-display text-3xl font-black text-gold">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-mist/95 drop-shadow-[0_1px_2px_rgba(3,12,29,0.7)]">
                    {item.label}
                  </p>
                </article>
              ))}
            </motion.div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 rounded-[1.8rem] border border-white/70 bg-white/92 p-6 shadow-[0_25px_70px_rgba(2,10,28,0.28)] backdrop-blur"
          >
            <div className="mb-5">
              <div className="relative overflow-hidden rounded-2xl border border-white/30">
                <motion.div
                  className="flex"
                  animate={{ x: `-${heroGalleryIndex * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                  {heroGalleryImages.map((image) => (
                    <img
                      key={image.src}
                      src={image.src}
                      alt={image.alt}
                      className="h-44 w-full shrink-0 object-cover"
                      loading="lazy"
                    />
                  ))}
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#000080]">
                    {activeGalleryImage.tag}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                {heroGalleryImages.map((image, index) => (
                  <span
                    key={image.src}
                    className={[
                      'h-2.5 rounded-full transition-all',
                      index === heroGalleryIndex ? 'w-7 bg-[#000080]' : 'w-2.5 bg-ink/25',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>
            <h2 className="font-display text-3xl font-black text-[#000080]">
              Public quick actions
            </h2>
            <div className="mt-6 space-y-4">
              <article className="rounded-2xl border border-ink/10 bg-mist p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Emergency hotline</p>
                <p className="mt-2 text-lg font-semibold text-[#000080]">
                  Call 112 for immediate danger and rescue response.
                </p>
              </article>
              <article className="rounded-2xl border border-ink/10 bg-mist p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Integrity hotline</p>
                <p className="mt-2 text-lg font-semibold text-[#000080]">
                  Call 997 for bribery, extortion, or service abuse.
                </p>
              </article>
              <article className="rounded-2xl border border-ink/10 bg-mist p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Live dashboard</p>
                <p className="mt-2 text-lg font-semibold text-[#000080]">
                  Track complaints and response deadlines by case ID.
                </p>
              </article>
            </div>

            <Link
              to={dashboardPath}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-200 px-5 py-3 text-sm font-bold text-ink"
            >
              {isAuthenticated ? 'Back to dashboard' : 'Open dashboard login'}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.aside>
        </div>
      </section>

      {isAuthenticated ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-tide/20 bg-mist px-5 py-4">
              <p className="text-sm font-semibold text-ink">
                Welcome back, <span className="font-black">{user?.fullName}</span>. Your session is active.
              </p>
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
              >
                Return to dashboard
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Get started quickly</p>
            <h2 className="mt-4 font-display text-4xl font-black">Join, sign in, and manage your services</h2>
          </div>
          <p className="max-w-2xl leading-7 text-slate">
            Citizens and institution teams use one platform with role-based dashboards, secure sessions, and direct
            access to the right local office.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="rounded-[1.6rem] border border-ink/10 bg-white p-6 shadow-soft"
          >
            <UserPlusIcon className="h-11 w-11 text-tide" />
            <h3 className="mt-4 font-display text-2xl font-black text-ink">Citizen join</h3>
            <p className="mt-3 leading-7 text-slate">
              Register with your full location from province to village and start tracking your cases from dashboard.
            </p>
            <Link
              to="/register/citizen"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm font-bold text-ink"
            >
              Create citizen account
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="rounded-[1.6rem] border border-ink/10 bg-white p-6 shadow-soft"
          >
            <BuildingOffice2Icon className="h-11 w-11 text-tide" />
            <h3 className="mt-4 font-display text-2xl font-black text-ink">Institution onboarding</h3>
            <p className="mt-3 leading-7 text-slate">
              Province, district, sector, cell, and village leaders register teams, services, and hierarchy links.
            </p>
            <Link
              to="/register/institution"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm font-bold text-ink"
            >
              Register institution
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="rounded-[1.6rem] border border-ink/10 bg-gradient-to-br from-ink to-tide p-6 text-white shadow-soft"
          >
            <RectangleGroupIcon className="h-11 w-11 text-gold" />
            <h3 className="mt-4 font-display text-2xl font-black">Login and continue</h3>
            <p className="mt-3 leading-7 text-white/85">
              If you are already signed in, return directly to your dashboard without losing your active session.
            </p>
            <Link
              to={dashboardPath}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink"
            >
              {isAuthenticated ? 'Back to dashboard' : 'Login now'}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.article>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Governance process</p>
              <h2 className="mt-4 font-display text-4xl font-black text-ink">How cases move in the platform</h2>
            </div>
            <p className="max-w-2xl leading-7 text-slate">
              The workflow is built for transparency from first report to final closure with full accountability at
              each administrative level.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step, index) => (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-2xl border border-ink/10 bg-mist p-5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-tide">Step {index + 1}</p>
                <h3 className="mt-2 font-display text-2xl font-black text-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate">{step.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Community visuals</p>
            <h2 className="mt-4 font-display text-4xl font-black">See how the platform supports real workflows</h2>
          </div>
          <p className="max-w-2xl leading-7 text-slate">
            These visual blocks represent institution coordination, digital service access, and transparent support.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {communityVisualCards.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.45, delay: index * 0.09 }}
              className="overflow-hidden rounded-[1.6rem] border border-ink/10 bg-white shadow-soft"
            >
              <img src={item.image} alt={item.title} className="h-48 w-full object-cover" loading="lazy" />
              <div className="p-6">
                <h3 className="font-display text-2xl font-black text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate">{item.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Platform pillars</p>
            <h2 className="mt-4 font-display text-4xl font-black">Professional support for every citizen</h2>
          </div>
          <p className="max-w-2xl leading-7 text-slate">
            Citizen First combines AI guidance, hotline awareness, and role-based accountability dashboards.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {governancePillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className="rounded-[1.6rem] border border-ink/10 bg-white p-6 shadow-soft"
              >
                <Icon className="h-10 w-10 text-tide" />
                <h3 className="mt-4 font-display text-2xl font-black text-ink">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate">{item.description}</p>
              </motion.article>
            );
          })}
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
            {services.map((service) => (
              <article key={service.id} className="rounded-[1.6rem] border border-ink/10 bg-mist p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-tide">{service.category}</p>
                <h3 className="mt-3 font-display text-2xl font-black text-ink">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate">{service.primaryOffice}</p>
                <p className="mt-3 text-sm font-semibold text-ink">{service.processingTime}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-8 shadow-soft lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">Emergency support</p>
              <h2 className="mt-4 font-display text-4xl font-black text-ink">Emergency toll-free contacts</h2>
            </div>
            <Link to="/emergency" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
              Open emergency page
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {emergencyContacts.map((contact) => (
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
              Ask the AI assistant where to go, what to prepare, and what authority level to contact.
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/75">
              The assistant combines service routing guidance with emergency and anti-corruption support so citizens
              get practical next steps quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/assistant" className="rounded-full bg-gold px-6 py-4 text-sm font-bold text-ink">
              Open AI assistant
            </Link>
            <Link to="/report" className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white">
              Submit report
            </Link>
            <Link
              to="/track"
              className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white"
            >
              Track case
            </Link>
            <Link
              to="/governance-structure"
              className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white"
            >
              View hierarchy
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">Ready to start</p>
            <h2 className="mt-4 font-display text-4xl font-black leading-tight text-ink">
              Join the platform and keep public service delivery transparent.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate">
              Register, login, and continue from where you stopped. Your dashboard keeps your role, location, and
              complaint workflow in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register/citizen" className="rounded-full bg-ink px-6 py-4 text-sm font-bold text-white">
              Join now
            </Link>
            <Link
              to={dashboardPath}
              className="rounded-full border border-ink/20 px-6 py-4 text-sm font-bold text-ink"
            >
              {isAuthenticated ? 'Go to dashboard' : 'Login'}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white/70">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {publicFeatureBlocks.map((item) => (
              <article key={item.title} className="rounded-2xl border border-ink/10 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-tide">Feature</p>
                <h3 className="mt-2 font-display text-2xl font-black text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
