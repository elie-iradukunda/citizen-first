export function getRoleDashboardPath(role) {
  if (role === 'national_admin' || role === 'oversight_admin') {
    return '/dashboard/admin';
  }

  if (
    role === 'institution_officer' ||
    role === 'province_leader' ||
    role === 'district_leader' ||
    role === 'sector_leader' ||
    role === 'cell_leader' ||
    role === 'village_leader'
  ) {
    return '/dashboard/officer';
  }

  return '/dashboard/citizen';
}
