import { useEffect, useState } from 'react';
import DashboardState from '../components/dashboard/DashboardState';
import SectionCard from '../components/dashboard/SectionCard';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import { fetchAdminDashboard } from '../lib/dashboardApi';

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    fetchAdminDashboard()
      .then((payload) => {
        if (isActive) {
          setDashboard(payload);
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
            title="Loading admin dashboard"
            description="Building oversight metrics, SLA insights, and institution performance views."
          />
        </section>
      </div>
    );
  }

  if (hasError || !dashboard) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Admin dashboard unavailable"
            description="Oversight metrics could not be loaded. Verify the dashboard API and try again."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Admin Dashboard</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Oversight intelligence for system-wide governance quality
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Monitor institution performance, detect integrity risk early, and keep SLA accountability visible.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} note={item.note} />
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard title="System alerts" subtitle="Critical signals requiring leadership attention.">
            <div className="space-y-3">
              {dashboard.alerts.map((item) => (
                <article key={item.title} className="rounded-2xl bg-mist p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <StatusBadge value={item.severity} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate">{item.detail}</p>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Institution performance"
            subtitle="Operational quality by administrative office."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                    <th className="pb-3">Institution</th>
                    <th className="pb-3">Level</th>
                    <th className="pb-3">Open</th>
                    <th className="pb-3">Overdue</th>
                    <th className="pb-3">Resolved</th>
                    <th className="pb-3">SLA score</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.institutionPerformance.map((item) => (
                    <tr key={item.institution} className="border-b border-ink/10">
                      <td className="py-4 font-semibold text-ink">{item.institution}</td>
                      <td className="py-4 text-slate">{item.level}</td>
                      <td className="py-4 text-slate">{item.openCases}</td>
                      <td className="py-4 text-slate">{item.overdueCases}</td>
                      <td className="py-4 text-slate">{item.resolvedCases}</td>
                      <td className="py-4 text-slate">{item.slaScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            title="Distribution by current level"
            subtitle="Live spread of active complaints across the escalation chain."
          >
            <div className="space-y-4">
              {dashboard.distributionByLevel.map((item) => (
                <article key={item.level}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold capitalize text-ink">{item.level}</p>
                    <p className="text-sm text-slate">{item.count} active</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-mist">
                    <div
                      className="h-2 rounded-full bg-tide"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Compliance insights"
            subtitle="Indicators for policy quality and anti-corruption monitoring."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {dashboard.compliance.map((item) => (
                <article key={item.title} className="rounded-2xl bg-mist p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{item.title}</p>
                  <p className="mt-3 font-display text-3xl font-black text-ink">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
