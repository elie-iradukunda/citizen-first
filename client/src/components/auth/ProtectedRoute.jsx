import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleDashboardPath } from '../../lib/authRouting';
import DashboardState from '../dashboard/DashboardState';

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isChecking, user } = useAuth();
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

  if (Array.isArray(allowedRoles) && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleDashboardPath(user?.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
