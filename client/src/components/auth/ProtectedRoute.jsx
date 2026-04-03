import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardState from '../dashboard/DashboardState';

function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();

  if (isChecking) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <DashboardState
          title="Checking session"
          description="Verifying your dashboard access."
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
