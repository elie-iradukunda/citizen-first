import { Navigate } from 'react-router-dom';
import DashboardState from '../components/dashboard/DashboardState';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../lib/authRouting';

function DashboardHubPage() {
  const { user } = useAuth();
  const dashboardPath = getRoleDashboardPath(user?.role);

  if (dashboardPath) {
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <DashboardState
          title="Resolving dashboard access"
          description="We are preparing the correct workspace for your account."
        />
      </section>
    </div>
  );
}

export default DashboardHubPage;
