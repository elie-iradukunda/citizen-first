import { lazy, Suspense } from 'react';
import AssistantPage from './pages/AssistantPage';
import CitizenRegistrationPage from './pages/CitizenRegistrationPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';
import DashboardHubPage from './pages/DashboardHubPage';
import EmergencyPage from './pages/EmergencyPage';
import { Route, Routes } from 'react-router-dom';
import GovernanceStructurePage from './pages/GovernanceStructurePage';
import HomePage from './pages/HomePage';
import InstitutionInvitePage from './pages/InstitutionInvitePage';
import InstitutionActivationPage from './pages/InstitutionActivationPage';
import LoginPage from './pages/LoginPage';
import PublicInstitutionAccessPage from './pages/PublicInstitutionAccessPage';
import PublicServicesPage from './pages/PublicServicesPage';
import ReportPage from './pages/ReportPage';
import TrackPage from './pages/TrackPage';
import {
  ADMIN_DASHBOARD_ROLES,
  CITIZEN_DASHBOARD_ROLES,
  INSTITUTION_SETTINGS_ROLES,
  INVITE_ROLES,
  OFFICER_DASHBOARD_ROLES,
} from './lib/authRouting';

const CitizenDashboardHomePage = lazy(() =>
  import('./pages/CitizenDashboardPages').then((module) => ({
    default: module.CitizenDashboardHomePage,
  })),
);
const CitizenScanServicesPage = lazy(() =>
  import('./pages/CitizenDashboardPages').then((module) => ({
    default: module.CitizenScanServicesPage,
  })),
);
const CitizenSubmitReportPage = lazy(() =>
  import('./pages/CitizenDashboardPages').then((module) => ({
    default: module.CitizenSubmitReportPage,
  })),
);
const CitizenMyReportsPage = lazy(() =>
  import('./pages/CitizenDashboardPages').then((module) => ({
    default: module.CitizenMyReportsPage,
  })),
);
const CitizenTrackCasePage = lazy(() =>
  import('./pages/CitizenDashboardPages').then((module) => ({
    default: module.CitizenTrackCasePage,
  })),
);
const InstitutionAdminDashboardPage = lazy(() => import('./pages/InstitutionAdminDashboardPage'));
const RibAdminDashboardPage = lazy(() => import('./pages/RibAdminDashboardPage'));
const RibOfficerDashboardPage = lazy(() => import('./pages/RibOfficerDashboardPage'));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-mist px-6 py-12 text-sm font-semibold text-ink">
      Loading dashboard...
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<PublicServicesPage />} />
          <Route path="/governance-structure" element={<GovernanceStructurePage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/register/citizen" element={<CitizenRegistrationPage />} />
          <Route path="/register/institution" element={<InstitutionActivationPage />} />
          <Route path="/institutions/:slug" element={<PublicInstitutionAccessPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/track" element={<TrackPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboards" element={<DashboardHubPage />} />

            <Route element={<ProtectedRoute allowedRoles={[...INVITE_ROLES]} />}>
              <Route path="/register/invite" element={<InstitutionInvitePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[...CITIZEN_DASHBOARD_ROLES]} />}>
              <Route path="/dashboard/citizen" element={<CitizenDashboardHomePage />} />
              <Route path="/dashboard/citizen/scan-services" element={<CitizenScanServicesPage />} />
              <Route path="/dashboard/citizen/submit" element={<CitizenSubmitReportPage />} />
              <Route path="/dashboard/citizen/reports" element={<CitizenMyReportsPage />} />
              <Route path="/dashboard/citizen/track" element={<CitizenTrackCasePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[...INSTITUTION_SETTINGS_ROLES]} />}>
              <Route path="/dashboard/institution" element={<InstitutionAdminDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[...OFFICER_DASHBOARD_ROLES]} />}>
              <Route path="/dashboard/rib-officer-1" element={<RibOfficerDashboardPage />} />
              <Route path="/dashboard/rib-officer-2" element={<RibOfficerDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[...ADMIN_DASHBOARD_ROLES]} />}>
              <Route path="/dashboard/admin" element={<RibAdminDashboardPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
