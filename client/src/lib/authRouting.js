export const CITIZEN_DASHBOARD_ROLES = new Set(['citizen']);

export const OFFICER_DASHBOARD_ROLES = new Set([
  'institution_officer',
  'province_leader',
  'district_leader',
  'sector_leader',
  'cell_leader',
  'village_leader',
]);

export const ADMIN_DASHBOARD_ROLES = new Set(['national_admin', 'oversight_admin']);

export const INVITE_ROLES = new Set([
  'national_admin',
  'province_leader',
  'district_leader',
  'sector_leader',
  'cell_leader',
]);

export function isCitizenDashboardRole(role) {
  return CITIZEN_DASHBOARD_ROLES.has(role);
}

export function isOfficerDashboardRole(role) {
  return OFFICER_DASHBOARD_ROLES.has(role);
}

export function isAdminDashboardRole(role) {
  return ADMIN_DASHBOARD_ROLES.has(role);
}

export function canAccessInviteSetup(role) {
  return INVITE_ROLES.has(role);
}

export function getRoleDashboardPath(role) {
  if (isAdminDashboardRole(role)) {
    return '/dashboard/admin';
  }

  if (isOfficerDashboardRole(role)) {
    return '/dashboard/officer';
  }

  return '/dashboard/citizen';
}
