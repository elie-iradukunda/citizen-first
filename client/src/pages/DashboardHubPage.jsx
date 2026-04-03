import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartBarSquareIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import DashboardState from '../components/dashboard/DashboardState';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardOverview } from '../lib/dashboardApi';

const roleIconMap = {
  citizen: UserGroupIcon,
  officer: ChartBarSquareIcon,
  admin: ShieldCheckIcon,
};

const rolePathMap = {
  citizen: '/dashboard/citizen',
  officer: '/dashboard/officer',
  admin: '/dashboard/admin',
};

function DashboardHubPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    fetchDashboardOverview()
      .then((payload) => {
        if (isActive) {
          setOverview(payload);
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

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Dashboard Center</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Level-based dashboards for every institution role
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Select a role-based workspace to monitor cases, resolve bottlenecks, and keep accountability
          visible across the full complaint lifecycle.
        </p>
        <div className="mt-6 inline-flex rounded-full border border-ink/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink">
          Signed in as {user?.fullName} ({user?.role})
        </div>

        {isLoading ? (
          <div className="mt-10">
            <DashboardState
              title="Loading dashboards"
              description="Fetching the latest management snapshots for citizens, officers, and oversight administrators."
            />
          </div>
        ) : null}

        {hasError ? (
          <div className="mt-10">
            <DashboardState
              title="Dashboard service unavailable"
              description="The dashboard data endpoint is not reachable right now. Please check the API server and reload."
            />
          </div>
        ) : null}

        {!isLoading && !hasError && overview ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {overview.roles.map((role) => {
              const Icon = roleIconMap[role.key];

              return (
                <article
                  key={role.key}
                  className="rounded-[1.8rem] border border-ink/10 bg-white p-7 shadow-soft"
                >
                  <Icon className="h-10 w-10 text-tide" />
                  <h2 className="mt-5 font-display text-3xl font-black text-ink">{role.label}</h2>
                  <p className="mt-4 leading-7 text-slate">{role.description}</p>
                  <Link
                    to={rolePathMap[role.key]}
                    className="mt-7 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
                  >
                    Open dashboard
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default DashboardHubPage;
