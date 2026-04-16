import AdminDashboardPage from './pages/AdminDashboardPage';
import AssistantPage from './pages/AssistantPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
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
import InstitutionRegistrationPage from './pages/InstitutionRegistrationPage';
import LoginPage from './pages/LoginPage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import PublicInstitutionAccessPage from './pages/PublicInstitutionAccessPage';
import PublicServicesPage from './pages/PublicServicesPage';
import ReportPage from './pages/ReportPage';
import TrackPage from './pages/TrackPage';
import {
  ADMIN_DASHBOARD_ROLES,
  CITIZEN_DASHBOARD_ROLES,
  INVITE_ROLES,
  OFFICER_DASHBOARD_ROLES,
} from './lib/authRouting';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<PublicServicesPage />} />
          <Route path="/governance-structure" element={<GovernanceStructurePage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/register/citizen" element={<CitizenRegistrationPage />} />
          <Route path="/register/institution" element={<InstitutionRegistrationPage />} />
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
            <Route path="/dashboard/citizen" element={<CitizenDashboardPage mode="overview" />} />
            <Route path="/dashboard/citizen/submit" element={<CitizenDashboardPage mode="submit" />} />
            <Route path="/dashboard/citizen/services" element={<CitizenDashboardPage mode="services" />} />
            <Route path="/dashboard/citizen/leaders" element={<CitizenDashboardPage mode="leaders" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[...OFFICER_DASHBOARD_ROLES]} />}>
            <Route path="/dashboard/officer" element={<OfficerDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[...ADMIN_DASHBOARD_ROLES]} />}>
            <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
