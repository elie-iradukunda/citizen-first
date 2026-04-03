export const GOVERNANCE_LEVELS = [
  'national',
  'province',
  'district',
  'sector',
  'cell',
  'village',
];

export const USER_LEVELS = [...GOVERNANCE_LEVELS, 'citizen'];

export const USER_ROLES = [
  'national_admin',
  'oversight_admin',
  'institution_officer',
  'province_leader',
  'district_leader',
  'sector_leader',
  'cell_leader',
  'village_leader',
  'citizen',
];

export const RECORD_STATUS = ['active', 'inactive', 'suspended'];

export const EMPLOYEE_STATUS = ['Active', 'Inactive'];

export const COMPLAINT_REPORTING_MODES = ['anonymous', 'verified'];

export const COMPLAINT_STATUS = [
  'submitted',
  'in_review',
  'resolved',
  'escalated',
  'rejected',
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const CITIZEN_ID_TYPES = ['NATIONAL_ID', 'PASSPORT'];
