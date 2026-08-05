export const CITIZEN_DASHBOARD_ROLES = new Set(['citizen']);

export const INSTITUTION_DASHBOARD_ROLES = new Set(['institution_admin']);

// Only RIB reviews citizen cases. Governance leaders are institution admins
// (see INSTITUTION_SETTINGS_ROLES) and no longer sit on the officer dashboards.
export const OFFICER_DASHBOARD_ROLES = new Set([
  'rib_officer_1',
  'rib_officer_2',
  'institution_officer',
]);

// Roles that own an institution record and may manage its Settings (services,
// departments, staff, and staff-service links). Includes the institution admin
// plus every governance leader created through the activation/registration flow.
export const INSTITUTION_SETTINGS_ROLES = new Set([
  'institution_admin',
  'province_leader',
  'district_leader',
  'sector_leader',
  'cell_leader',
  'village_leader',
]);

export const ADMIN_DASHBOARD_ROLES = new Set(['national_admin', 'oversight_admin']);

// RIB (national admin) registers institutions and creates the invites.
export const INVITE_ROLES = new Set(['national_admin', 'oversight_admin']);

export function isCitizenDashboardRole(role) {
  return CITIZEN_DASHBOARD_ROLES.has(role);
}

export function isOfficerDashboardRole(role) {
  return OFFICER_DASHBOARD_ROLES.has(role);
}

export function isInstitutionDashboardRole(role) {
  return INSTITUTION_DASHBOARD_ROLES.has(role);
}

export function canManageInstitutionSettings(role) {
  return INSTITUTION_SETTINGS_ROLES.has(role);
}

export function isAdminDashboardRole(role) {
  return ADMIN_DASHBOARD_ROLES.has(role);
}

export function canAccessInviteSetup(role) {
  return INVITE_ROLES.has(role);
}

export function getRoleDashboardPath(role) {
  // A governance leader owns an institution, so they land on the institution
  // dashboard like any other institution admin — case review is RIB's job.
  if (INSTITUTION_SETTINGS_ROLES.has(role)) {
    return '/dashboard/institution';
  }

  if (role === 'rib_officer_2') {
    return '/dashboard/rib-officer-2';
  }

  if (ADMIN_DASHBOARD_ROLES.has(role)) {
    return '/dashboard/admin';
  }

  if (OFFICER_DASHBOARD_ROLES.has(role)) {
    return '/dashboard/rib-officer-1';
  }

  return '/dashboard/citizen';
}
