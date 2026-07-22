import crypto from 'node:crypto';
import { HIERARCHY_TEST_CREDENTIALS, seedHierarchyTestData } from './hierarchyTestSeed.js';

const NATIONAL_ROOT_ID = 'NATIONAL-PLATFORM';

export const GOVERNMENT_LEVELS = ['province', 'district', 'sector', 'cell', 'village'];

export const LEVEL_TO_ROLE = {
  province: 'province_leader',
  district: 'district_leader',
  sector: 'sector_leader',
  cell: 'cell_leader',
  village: 'village_leader',
};

export const NEXT_LEVEL_MAP = {
  national_admin: 'province',
  province_leader: 'district',
  district_leader: 'sector',
  sector_leader: 'cell',
  cell_leader: 'village',
  village_leader: null,
};

export const POSITION_TEMPLATES = {
  province: {
    title: 'Governor',
    titleKinyarwanda: "Guverineri w'Intara",
    reportsTo: 'National Government',
  },
  district: {
    title: 'Mayor',
    titleKinyarwanda: "Umuyobozi w'Akarere",
    reportsTo: 'Province Governor',
  },
  sector: {
    title: 'Executive Secretary',
    titleKinyarwanda: "Gitifu w'Umurenge",
    reportsTo: 'District Authority',
  },
  cell: {
    title: 'Executive Secretary',
    titleKinyarwanda: "Gitifu w'Akagari",
    reportsTo: 'Sector Executive Secretary',
  },
  village: {
    title: 'Village Leader',
    titleKinyarwanda: "Umuyobozi w'Umudugudu",
    reportsTo: 'Cell Executive Secretary',
  },
};

export const RWANDA_ADMINISTRATIVE_STRUCTURE = [
  {
    province: 'Kigali City',
    districts: [
      {
        district: 'Gasabo',
        sectors: [
          {
            sector: 'Kimironko',
            cells: [
              { cell: 'Bibare', villages: ['Amahoro', 'Umutekano'] },
              { cell: 'Nyagatovu', villages: ['Ubwiyunge', 'Iterambere'] },
            ],
          },
          {
            sector: 'Remera',
            cells: [
              { cell: 'Nyarutarama', villages: ['Urugwiro', 'Umurinzi'] },
              { cell: 'Rukiri I', villages: ['Icyizere', 'Intsinzi'] },
            ],
          },
          {
            sector: 'Kacyiru',
            cells: [
              { cell: 'Kamatamu', villages: ['Ubumwe', 'Ukuri'] },
              { cell: 'Kamatamu II', villages: ['Amahoro II', 'Ubufatanye'] },
            ],
          },
        ],
      },
      {
        district: 'Kicukiro',
        sectors: [
          {
            sector: 'Kagarama',
            cells: [
              { cell: 'Kanserege', villages: ['Amahoro', 'Ubwiyunge'] },
              { cell: 'Muyange', villages: ['Intsinzi', 'Umurava'] },
            ],
          },
          {
            sector: 'Niboye',
            cells: [
              { cell: 'Niboye', villages: ['Isangano', 'Icyerekezo'] },
              { cell: 'Nyakabanda', villages: ['Ubudaheranwa', 'Komeza'] },
            ],
          },
          {
            sector: 'Gahanga',
            cells: [
              { cell: 'Rwabutenge', villages: ['Urukundo', 'Amajyambere'] },
              { cell: 'Kagasa', villages: ['Twese Hamwe', 'Ubumwe'] },
            ],
          },
        ],
      },
      {
        district: 'Nyarugenge',
        sectors: [
          {
            sector: 'Nyamirambo',
            cells: [
              { cell: 'Rugarama', villages: ['Amahoro', 'Abahizi'] },
              { cell: 'Mumena', villages: ['Kigali Nziza', 'Indatwa'] },
            ],
          },
          {
            sector: 'Gitega',
            cells: [
              { cell: 'Kora', villages: ['Abizerwa', 'Intambwe'] },
              { cell: 'Akabahizi', villages: ['Ishimwe', 'Komeza'] },
            ],
          },
        ],
      },
    ],
  },
  {
    province: 'Eastern Province',
    districts: [
      { district: 'Bugesera', sectors: [] },
      { district: 'Gatsibo', sectors: [] },
      { district: 'Kayonza', sectors: [] },
      { district: 'Kirehe', sectors: [] },
      { district: 'Ngoma', sectors: [] },
      { district: 'Nyagatare', sectors: [] },
      { district: 'Rwamagana', sectors: [] },
    ],
  },
  {
    province: 'Northern Province',
    districts: [
      { district: 'Burera', sectors: [] },
      { district: 'Gakenke', sectors: [] },
      { district: 'Gicumbi', sectors: [] },
      { district: 'Musanze', sectors: [] },
      { district: 'Rulindo', sectors: [] },
    ],
  },
  {
    province: 'Southern Province',
    districts: [
      { district: 'Gisagara', sectors: [] },
      { district: 'Huye', sectors: [] },
      { district: 'Kamonyi', sectors: [] },
      { district: 'Muhanga', sectors: [] },
      { district: 'Nyamagabe', sectors: [] },
      { district: 'Nyanza', sectors: [] },
      { district: 'Nyaruguru', sectors: [] },
      { district: 'Ruhango', sectors: [] },
    ],
  },
  {
    province: 'Western Province',
    districts: [
      { district: 'Karongi', sectors: [] },
      { district: 'Ngororero', sectors: [] },
      { district: 'Nyabihu', sectors: [] },
      { district: 'Nyamasheke', sectors: [] },
      { district: 'Rubavu', sectors: [] },
      { district: 'Rusizi', sectors: [] },
      { district: 'Rutsiro', sectors: [] },
    ],
  },
];

const DEFAULT_ADMIN_ACCESS_KEY = process.env.SYSTEM_ADMIN_ACCESS_KEY ?? 'CF-ADMIN-2026';
const TEST_ADMIN_ACCESS_KEY = process.env.TEST_ADMIN_ACCESS_KEY ?? 'CF-TEST-ADMIN-2026';
const DEFAULT_DASHBOARD_CITIZEN_KEY =
  process.env.DASHBOARD_CITIZEN_ACCESS_KEY ?? 'CF-CITIZEN-2026';
const DEFAULT_INSTITUTION_ADMIN_KEY =
  process.env.DASHBOARD_INSTITUTION_ADMIN_ACCESS_KEY ?? 'CF-INSTITUTION-2026';
const DEFAULT_RIB_OFFICER_ONE_KEY =
  process.env.DASHBOARD_RIB_OFFICER_ONE_ACCESS_KEY ?? 'CF-RIB-OFFICER1-2026';
const DEFAULT_RIB_OFFICER_TWO_KEY =
  process.env.DASHBOARD_RIB_OFFICER_TWO_ACCESS_KEY ?? 'CF-RIB-OFFICER2-2026';

const SYSTEM_ADMIN_EMAIL = process.env.SYSTEM_ADMIN_EMAIL ?? 'national.admin@citizenfirst.gov.rw';
const SYSTEM_ADMIN_PASSWORD = process.env.SYSTEM_ADMIN_PASSWORD ?? 'Admin@12345';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'test.admin@citizenfirst.gov.rw';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Admin@12345';
const DASHBOARD_CITIZEN_EMAIL = process.env.DASHBOARD_CITIZEN_EMAIL ?? 'citizen.demo@saccfp.rw';
const DASHBOARD_CITIZEN_PASSWORD = process.env.DASHBOARD_CITIZEN_PASSWORD ?? 'Citizen@12345';
const DASHBOARD_INSTITUTION_ADMIN_EMAIL =
  process.env.DASHBOARD_INSTITUTION_ADMIN_EMAIL ?? 'institution.admin@saccfp.rw';
const DASHBOARD_INSTITUTION_ADMIN_PASSWORD =
  process.env.DASHBOARD_INSTITUTION_ADMIN_PASSWORD ?? 'Institution@12345';
const DASHBOARD_RIB_OFFICER_ONE_EMAIL =
  process.env.DASHBOARD_RIB_OFFICER_ONE_EMAIL ?? 'rib.officer1@saccfp.rw';
const DASHBOARD_RIB_OFFICER_ONE_PASSWORD =
  process.env.DASHBOARD_RIB_OFFICER_ONE_PASSWORD ?? 'RibOfficer1@12345';
const DASHBOARD_RIB_OFFICER_TWO_EMAIL =
  process.env.DASHBOARD_RIB_OFFICER_TWO_EMAIL ?? 'rib.officer2@saccfp.rw';
const DASHBOARD_RIB_OFFICER_TWO_PASSWORD =
  process.env.DASHBOARD_RIB_OFFICER_TWO_PASSWORD ?? 'RibOfficer2@12345';

export function createPasswordCredentials(password, userIdSeed) {
  const passwordSalt = crypto
    .createHash('sha256')
    .update(`${userIdSeed}-citizen-first`)
    .digest('hex')
    .slice(0, 32);

  const passwordHash = crypto.scryptSync(password, passwordSalt, 64).toString('hex');

  return {
    passwordSalt,
    passwordHash,
  };
}

export const systemUsers = [
  {
    userId: 'USR-NATIONAL-001',
    role: 'national_admin',
    level: 'national',
    fullName: 'SACCFP National Admin',
    email: SYSTEM_ADMIN_EMAIL,
    nationalId: null,
    institutionId: 'NATIONAL-PLATFORM',
    accessKey: DEFAULT_ADMIN_ACCESS_KEY,
    status: 'active',
    ...createPasswordCredentials(SYSTEM_ADMIN_PASSWORD, 'USR-NATIONAL-001'),
    createdAt: '2026-04-03T00:00:00.000Z',
  },
  {
    userId: 'USR-TEST-ADMIN-001',
    role: 'national_admin',
    level: 'national',
    fullName: 'SACCFP Test Admin',
    email: TEST_ADMIN_EMAIL,
    nationalId: null,
    institutionId: 'NATIONAL-PLATFORM',
    accessKey: TEST_ADMIN_ACCESS_KEY,
    status: 'active',
    ...createPasswordCredentials(TEST_ADMIN_PASSWORD, 'USR-TEST-ADMIN-001'),
    createdAt: '2026-04-03T00:00:00.000Z',
  },
  {
    userId: 'USR-DASHBOARD-INSTITUTION-001',
    role: 'institution_admin',
    level: 'sector',
    fullName: 'Kacyiru Sector Institution Admin',
    email: DASHBOARD_INSTITUTION_ADMIN_EMAIL,
    nationalId: '1199000099997001',
    institutionId: 'GOV-KACYIRU-SECTOR',
    accessKey: DEFAULT_INSTITUTION_ADMIN_KEY,
    status: 'active',
    ...createPasswordCredentials(DASHBOARD_INSTITUTION_ADMIN_PASSWORD, 'USR-DASHBOARD-INSTITUTION-001'),
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: '',
      village: '',
    },
    createdAt: '2026-04-03T00:00:00.000Z',
  },
  {
    userId: 'USR-DASHBOARD-RIB1-001',
    role: 'rib_officer_1',
    level: 'national',
    fullName: 'RIB Officer 1',
    email: DASHBOARD_RIB_OFFICER_ONE_EMAIL,
    nationalId: '1199000099998888',
    institutionId: 'RIB-INTAKE',
    accessKey: DEFAULT_RIB_OFFICER_ONE_KEY,
    status: 'active',
    ...createPasswordCredentials(DASHBOARD_RIB_OFFICER_ONE_PASSWORD, 'USR-DASHBOARD-RIB1-001'),
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kamatamu',
      village: '',
    },
    createdAt: '2026-04-03T00:00:00.000Z',
  },
  {
    userId: 'USR-DASHBOARD-RIB2-001',
    role: 'rib_officer_2',
    level: 'national',
    fullName: 'RIB Officer 2',
    email: DASHBOARD_RIB_OFFICER_TWO_EMAIL,
    nationalId: '1199000099998889',
    institutionId: 'RIB-ESCALATION',
    accessKey: DEFAULT_RIB_OFFICER_TWO_KEY,
    status: 'active',
    ...createPasswordCredentials(DASHBOARD_RIB_OFFICER_TWO_PASSWORD, 'USR-DASHBOARD-RIB2-001'),
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kamatamu',
      village: '',
    },
    createdAt: '2026-04-03T00:00:00.000Z',
  },
  {
    userId: 'USR-DASHBOARD-CITIZEN-001',
    role: 'citizen',
    level: 'citizen',
    fullName: 'Citizen Demo User',
    email: DASHBOARD_CITIZEN_EMAIL,
    nationalId: '1199111199997777',
    phone: '+250788700001',
    institutionId: null,
    accessKey: DEFAULT_DASHBOARD_CITIZEN_KEY,
    status: 'active',
    ...createPasswordCredentials(DASHBOARD_CITIZEN_PASSWORD, 'USR-DASHBOARD-CITIZEN-001'),
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kamatamu',
      village: 'Ubumwe',
    },
    createdAt: '2026-04-03T00:00:00.000Z',
  },
];

export const institutionInvites = [];

export const registeredInstitutions = [];

export const institutionDepartments = [];

export const institutionEmployees = [];

export const institutionStaffServiceLinks = [];

export const registeredCitizens = [
  {
    citizenId: 'CIT-2026-00001',
    fullName: 'Citizen Demo User',
    nationalId: '1199111199997777',
    phone: '+250788700001',
    email: DASHBOARD_CITIZEN_EMAIL,
    dateOfBirth: '1999-06-14',
    gender: 'Female',
    idType: 'National ID',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kamatamu',
      village: 'Ubumwe',
    },
    createdAt: '2026-04-03T00:00:00.000Z',
    status: 'active',
  },
];

const RIB_CASE_STUDY_LOCATION = {
  country: 'Rwanda',
  province: 'Kigali City',
  district: 'Gasabo',
  sector: 'Kacyiru',
  cell: 'Kamatamu',
  village: 'Ubumwe',
};

const RIB_CASE_STUDY_INSTITUTIONS = [
  {
    institutionId: 'RIB-SUPERVISION',
    slug: 'rib-supervisory-review-and-escalation-unit',
    level: 'province',
    parentInstitutionId: NATIONAL_ROOT_ID,
    institutionName: 'RIB Supervisory Review and Escalation Unit',
    institutionType: 'RIB Anti-Corruption Oversight Unit',
    officialEmail: 'supervision@rib.citizenfirst.gov.rw',
    officialPhone: '+250788997105',
    officeAddress: 'RIB Headquarters, Kigali',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: '',
      sector: '',
      cell: '',
      village: '',
    },
    childLevel: 'district',
    childUnitLabel: 'investigation directorates',
    expectedChildUnits: 1,
    leader: {
      userId: 'USR-RIB-SUPERVISION-001',
      employeeId: 'EMP-RIB-SUPERVISION-L01',
      role: 'institution_officer',
      fullName: 'Clarisse Nyiransabimana',
      nationalId: '1199000088881051',
      phone: '+250788997105',
      email: 'rib.supervision@citizenfirst.gov.rw',
      password: 'RibSupervisor@12345',
      accessKey: 'CF-RIB-SUPERVISION-2026',
      positionTitle: 'RIB Supervisory Review Lead',
      positionKinyarwanda: 'Umuyobozi ushinzwe isuzuma nigenzura',
      reportsTo: 'RIB National Oversight Command',
      description:
        'Reviews escalated sensitive corruption reports, monitors overdue cases, and validates institutional response quality.',
    },
  },
  {
    institutionId: 'RIB-FIN',
    slug: 'rib-economic-and-financial-crimes-directorate',
    level: 'district',
    parentInstitutionId: 'RIB-SUPERVISION',
    institutionName: 'RIB Economic and Financial Crimes Directorate',
    institutionType: 'RIB Investigation Directorate',
    officialEmail: 'financialcrimes@rib.citizenfirst.gov.rw',
    officialPhone: '+250788997104',
    officeAddress: 'RIB Headquarters, Kigali',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: '',
      cell: '',
      village: '',
    },
    childLevel: 'sector',
    childUnitLabel: 'intake desks',
    expectedChildUnits: 1,
    leader: {
      userId: 'USR-RIB-FIN-001',
      employeeId: 'EMP-RIB-FIN-L01',
      role: 'institution_officer',
      fullName: 'Eric Ndayisaba',
      nationalId: '1199000088881041',
      phone: '+250788997104',
      email: 'rib.investigator@citizenfirst.gov.rw',
      password: 'RibInvestigator@12345',
      accessKey: 'CF-RIB-INVESTIGATOR-2026',
      positionTitle: 'Economic and Financial Crimes Investigator',
      positionKinyarwanda: 'Umugenzacyaha wibyaha byubukungu nimari',
      reportsTo: 'RIB Supervisory Review Lead',
      description:
        'Handles investigation review for bribery, unofficial payment, abuse of office, and financial-crime related reports.',
    },
  },
  {
    institutionId: 'RIB-INTAKE',
    slug: 'rib-anti-corruption-intake-desk',
    level: 'sector',
    parentInstitutionId: 'RIB-FIN',
    institutionName: 'RIB Anti-Corruption Intake Desk',
    institutionType: 'RIB Citizen Complaint Intake',
    officialEmail: 'intake@rib.citizenfirst.gov.rw',
    officialPhone: '+250788997103',
    officeAddress: 'RIB Public Intake Desk, Kigali',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: '',
      village: '',
    },
    childLevel: 'cell',
    childUnitLabel: 'evidence triage desks',
    expectedChildUnits: 1,
    leader: {
      userId: 'USR-RIB-INTAKE-001',
      employeeId: 'EMP-RIB-INTAKE-L01',
      role: 'institution_officer',
      fullName: 'Sandrine Uwase',
      nationalId: '1199000088881031',
      phone: '+250788997103',
      email: DASHBOARD_RIB_OFFICER_ONE_EMAIL,
      password: DASHBOARD_RIB_OFFICER_ONE_PASSWORD,
      accessKey: DEFAULT_RIB_OFFICER_ONE_KEY,
      positionTitle: 'RIB Anti-Corruption Intake Officer',
      positionKinyarwanda: 'Umukozi wakira amakuru ya ruswa',
      reportsTo: 'Economic and Financial Crimes Investigator',
      description:
        'Receives QR-based corruption reports, checks completeness, protects confidentiality, and routes cases for review.',
    },
  },
  {
    institutionId: 'RIB-EVIDENCE',
    slug: 'rib-evidence-preservation-and-triage-desk',
    level: 'cell',
    parentInstitutionId: 'RIB-INTAKE',
    institutionName: 'RIB Evidence Preservation and Triage Desk',
    institutionType: 'RIB Evidence Support Desk',
    officialEmail: 'evidence@rib.citizenfirst.gov.rw',
    officialPhone: '+250788997102',
    officeAddress: 'RIB Evidence Support Desk, Kigali',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kamatamu',
      village: '',
    },
    childLevel: 'village',
    childUnitLabel: 'public QR access points',
    expectedChildUnits: 1,
    leader: {
      userId: 'USR-RIB-EVIDENCE-001',
      employeeId: 'EMP-RIB-EVIDENCE-L01',
      role: 'institution_officer',
      fullName: 'Jean Claude Habimana',
      nationalId: '1199000088881021',
      phone: '+250788997102',
      email: 'rib.evidence@citizenfirst.gov.rw',
      password: 'RibEvidence@12345',
      accessKey: 'CF-RIB-EVIDENCE-2026',
      positionTitle: 'Evidence Preservation Officer',
      positionKinyarwanda: 'Umukozi ushinzwe kubika ibimenyetso',
      reportsTo: 'RIB Anti-Corruption Intake Officer',
      description:
        'Checks attached screenshots, documents, receipts, and voice notes before cases move to intake or investigation.',
    },
  },
  {
    institutionId: 'RIB-QR',
    slug: 'rib-public-qr-reporting-access-point',
    level: 'village',
    parentInstitutionId: 'RIB-EVIDENCE',
    institutionName: 'RIB Public QR Reporting Access Point',
    institutionType: 'RIB Citizen Access Channel',
    officialEmail: 'qraccess@rib.citizenfirst.gov.rw',
    officialPhone: '+250788997101',
    officeAddress: 'Public QR access point for RIB anti-corruption reporting',
    location: RIB_CASE_STUDY_LOCATION,
    childLevel: null,
    childUnitLabel: null,
    expectedChildUnits: null,
    leader: {
      userId: 'USR-RIB-QR-001',
      employeeId: 'EMP-RIB-QR-L01',
      role: 'institution_officer',
      fullName: 'Aline Mukamana',
      nationalId: '1199000088881011',
      phone: '+250788997101',
      email: 'rib.qraccess@citizenfirst.gov.rw',
      password: 'RibQrAccess@12345',
      accessKey: 'CF-RIB-QR-2026',
      positionTitle: 'Public QR Access Officer',
      positionKinyarwanda: 'Umukozi ushinzwe inzira ya QR',
      reportsTo: 'Evidence Preservation Officer',
      description:
        'Maintains public QR access, basic reporting guidance, and citizen awareness for safe corruption reporting.',
    },
  },
];

const RIB_SERVICES = [
  {
    name: 'QR corruption report intake',
    description:
      'Citizen scans a QR code and submits a structured corruption-related report to the RIB intake workflow.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'Reporting corruption through this channel is free.',
  },
  {
    name: 'Confidential citizen feedback',
    description:
      'Allows anonymous or verified reporting where the citizen fears exposure, retaliation, or deliberate silence.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'Confidential submissions are handled with controlled visibility.',
  },
  {
    name: 'Evidence and voice-note support',
    description:
      'Supports screenshots, receipts, documents, and voice notes so useful information is preserved.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'Evidence is attached only to support responsible review and follow-up.',
  },
  {
    name: 'Case status tracking',
    description:
      'Provides a reference number and visible status updates so citizens are not left without feedback.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'Use your case ID to follow progress.',
  },
  {
    name: 'Escalation and dashboard oversight',
    description:
      'Routes unresolved or sensitive reports to authorized supervisors and shows trends on oversight dashboards.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'Unresolved cases are escalated through a defined digital pathway.',
  },
];

const KACYIRU_SECTOR_OFFICE = {
  institutionId: 'GOV-KACYIRU-SECTOR',
  slug: 'kacyiru-sector-office',
  level: 'sector',
  parentInstitutionId: 'DIS-9002',
  institutionName: 'Kacyiru Sector Office',
  institutionType: 'Sector government institution',
  officialEmail: 'kacyiru.sector@saccfp.rw',
  officialPhone: '+250788300210',
  officeAddress: 'Kacyiru Sector Office, Gasabo, Kigali',
  location: {
    country: 'Rwanda',
    province: 'Kigali City',
    district: 'Gasabo',
    sector: 'Kacyiru',
    cell: '',
    village: '',
  },
  childLevel: 'cell',
  childUnitLabel: 'cells',
  expectedChildUnits: 2,
  leaderNationalId: '1199000099997001',
};

const KACYIRU_SECTOR_SERVICES = [
  {
    name: 'Civil status certificate support',
    description: 'Citizen receives guidance for certificates, family records, and civil registration requests.',
    feeType: 'paid',
    officialFeeRwf: 500,
    accessNote: 'Official fee only, receipt required where payment applies.',
    schedule: 'Monday to Friday, 08:00 - 15:00',
    documents: 'National ID, application reference, payment receipt where required',
  },
  {
    name: 'Land document guidance',
    description: 'Citizen receives direction on land-related documents and office process.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'No unofficial payment allowed.',
    schedule: 'Tuesday and Thursday, 09:00 - 14:00',
    documents: 'Land reference, owner ID, supporting document copy',
  },
  {
    name: 'Social affairs and Mutuelle support',
    description: 'Citizen receives social affairs guidance, Mutuelle support, and household assistance information.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'Free guidance service - no payment allowed.',
    schedule: 'Monday, Wednesday, Friday, 08:00 - 12:00',
    documents: 'Household ID, Ubudehe or insurance reference where available',
  },
  {
    name: 'Citizen complaint reception',
    description: 'Citizen can report poor service or request guidance before RIB escalation.',
    feeType: 'free',
    officialFeeRwf: 0,
    accessNote: 'This service is free.',
    schedule: 'Every working day, 08:00 - 16:00',
    documents: 'Case explanation, service reference, evidence where available',
  },
];

const KACYIRU_SECTOR_DEPARTMENTS = [
  {
    departmentId: 'DEP-GOV-KACYIRU-CIVIL-STATUS',
    name: 'Civil Status',
    description: 'Certificates, family records, and civil registration support.',
  },
  {
    departmentId: 'DEP-GOV-KACYIRU-LAND',
    name: 'Land and Infrastructure',
    description: 'Land document guidance and infrastructure service follow-up.',
  },
  {
    departmentId: 'DEP-GOV-KACYIRU-SOCIAL',
    name: 'Social Affairs',
    description: 'Mutuelle, household support, and social protection services.',
  },
  {
    departmentId: 'DEP-GOV-KACYIRU-CUSTOMER-CARE',
    name: 'Customer Care',
    description: 'Citizen complaint reception, guidance, and service follow-up desk.',
  },
];

const KACYIRU_SECTOR_EMPLOYEES = [
  {
    employeeId: 'EMP-GOV-KACYIRU-L01',
    fullName: 'Kacyiru Sector Institution Admin',
    nationalId: '1199000099997001',
    phone: '+250788300210',
    email: DASHBOARD_INSTITUTION_ADMIN_EMAIL,
    positionTitle: 'Sector Executive Secretary',
    positionKinyarwanda: "Umunyamabanga Nshingwabikorwa w'Umurenge",
    reportsTo: 'Gasabo District Authority',
    description: 'Approves institutional services, staff records, and public QR access for Kacyiru Sector Office.',
    isLeader: true,
  },
  {
    employeeId: 'EMP-GOV-KACYIRU-S01',
    fullName: 'Agnes Mukamana',
    nationalId: '1199000099997101',
    phone: '+250788111201',
    email: 'agnes.mukamana@saccfp.rw',
    positionTitle: 'Civil Status Officer',
    positionKinyarwanda: 'Umukozi ushinzwe irangamimerere',
    reportsTo: 'Sector Executive Secretary',
    description: 'Handles civil status certificate support and record guidance.',
    isLeader: false,
  },
  {
    employeeId: 'EMP-GOV-KACYIRU-S02',
    fullName: 'Jean Bosco Ndayisenga',
    nationalId: '1199000099997102',
    phone: '+250788111202',
    email: 'jean.ndayisenga@saccfp.rw',
    positionTitle: 'Land Service Officer',
    positionKinyarwanda: "Umukozi ushinzwe ubutaka n'ibikorwaremezo",
    reportsTo: 'Sector Executive Secretary',
    description: 'Handles land document guidance and infrastructure follow-up.',
    isLeader: false,
  },
  {
    employeeId: 'EMP-GOV-KACYIRU-S03',
    fullName: 'Claudine Uwase',
    nationalId: '1199000099997103',
    phone: '+250788111203',
    email: 'claudine.uwase@saccfp.rw',
    positionTitle: 'Social Affairs Officer',
    positionKinyarwanda: 'Umukozi ushinzwe imibereho myiza',
    reportsTo: 'Sector Executive Secretary',
    description: 'Handles social affairs support and Mutuelle guidance.',
    isLeader: false,
  },
  {
    employeeId: 'EMP-GOV-KACYIRU-S04',
    fullName: 'Patrick Habimana',
    nationalId: '1199000099997104',
    phone: '+250788111204',
    email: 'patrick.habimana@saccfp.rw',
    positionTitle: 'Customer Care Officer',
    positionKinyarwanda: 'Umukozi ushinzwe kwakira abaturage',
    reportsTo: 'Sector Executive Secretary',
    description: 'Receives citizen complaints and guides reporting before RIB escalation.',
    isLeader: false,
  },
];

const KACYIRU_STAFF_SERVICE_LINKS = [
  { employeeId: 'EMP-GOV-KACYIRU-S01', serviceName: 'Civil status certificate support' },
  { employeeId: 'EMP-GOV-KACYIRU-S02', serviceName: 'Land document guidance' },
  { employeeId: 'EMP-GOV-KACYIRU-S03', serviceName: 'Social affairs and Mutuelle support' },
  { employeeId: 'EMP-GOV-KACYIRU-S04', serviceName: 'Citizen complaint reception' },
];

function seedKacyiruSectorOfficeData() {
  const now = new Date().toISOString();

  if (!registeredInstitutions.some((entry) => entry.institutionId === KACYIRU_SECTOR_OFFICE.institutionId)) {
    registeredInstitutions.push({
      ...KACYIRU_SECTOR_OFFICE,
      services: KACYIRU_SECTOR_SERVICES,
      employeeCount: KACYIRU_SECTOR_EMPLOYEES.length,
      registeredChildUnits: 0,
      childInstitutionIds: [],
      createdByInviteId: 'INV-GOV-KACYIRU-SECTOR',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      qrCodeDataUrl: null,
    });
  }

  for (const department of KACYIRU_SECTOR_DEPARTMENTS) {
    if (institutionDepartments.some((entry) => entry.departmentId === department.departmentId)) {
      continue;
    }

    institutionDepartments.push({
      ...department,
      institutionId: KACYIRU_SECTOR_OFFICE.institutionId,
      createdAt: now,
    });
  }

  for (const employee of KACYIRU_SECTOR_EMPLOYEES) {
    if (institutionEmployees.some((entry) => entry.employeeId === employee.employeeId)) {
      continue;
    }

    institutionEmployees.push({
      ...employee,
      institutionId: KACYIRU_SECTOR_OFFICE.institutionId,
      status: 'Active',
      createdAt: now,
    });
  }

  for (const [index, link] of KACYIRU_STAFF_SERVICE_LINKS.entries()) {
    const exists = institutionStaffServiceLinks.some(
      (entry) =>
        entry.institutionId === KACYIRU_SECTOR_OFFICE.institutionId &&
        entry.employeeId === link.employeeId &&
        entry.serviceName === link.serviceName,
    );
    if (exists) {
      continue;
    }

    institutionStaffServiceLinks.push({
      linkId: `LNK-GOV-KACYIRU-${String(index + 1).padStart(3, '0')}`,
      institutionId: KACYIRU_SECTOR_OFFICE.institutionId,
      employeeId: link.employeeId,
      serviceName: link.serviceName,
      createdAt: now,
    });
  }
}

function seedRibCaseStudyData() {
  const now = new Date().toISOString();

  for (const institution of [...RIB_CASE_STUDY_INSTITUTIONS].reverse()) {
    if (!registeredInstitutions.some((entry) => entry.institutionId === institution.institutionId)) {
      registeredInstitutions.unshift({
        institutionId: institution.institutionId,
        slug: institution.slug,
        level: institution.level,
        parentInstitutionId: institution.parentInstitutionId,
        institutionName: institution.institutionName,
        institutionType: institution.institutionType,
        officialEmail: institution.officialEmail,
        officialPhone: institution.officialPhone,
        officeAddress: institution.officeAddress,
        location: institution.location,
        leaderNationalId: institution.leader.nationalId,
        childLevel: institution.childLevel,
        childUnitLabel: institution.childUnitLabel,
        expectedChildUnits: institution.expectedChildUnits,
        registeredChildUnits: 0,
        childInstitutionIds: [],
        services: RIB_SERVICES,
        employeeCount: 0,
        createdByInviteId: `INV-${institution.institutionId}`,
        createdAt: now,
        updatedAt: now,
        status: 'active',
        qrCodeDataUrl: null,
      });
    }

    if (!institutionEmployees.some((entry) => entry.employeeId === institution.leader.employeeId)) {
      institutionEmployees.push({
        employeeId: institution.leader.employeeId,
        institutionId: institution.institutionId,
        fullName: institution.leader.fullName,
        nationalId: institution.leader.nationalId,
        phone: institution.leader.phone,
        email: institution.leader.email,
        positionTitle: institution.leader.positionTitle,
        positionKinyarwanda: institution.leader.positionKinyarwanda,
        reportsTo: institution.leader.reportsTo,
        description: institution.leader.description,
        status: 'Active',
        isLeader: true,
        createdAt: now,
      });
    }

    const staffProfiles = [
      {
        suffix: 'S02',
        fullName: `${institution.leader.fullName.split(' ')[0]} Intake Staff 02`,
        title: 'Complaint Intake Officer',
        description: 'Reviews submitted complaint details and confirms required evidence fields.',
      },
      {
        suffix: 'S03',
        fullName: `${institution.leader.fullName.split(' ')[0]} Evidence Staff 03`,
        title: 'Evidence Review Officer',
        description: 'Checks attached images, receipts, screenshots, and voice notes for completeness.',
      },
    ];

    staffProfiles.forEach((staff, index) => {
      const employeeId = `${institution.leader.employeeId.replace('-L01', '')}-${staff.suffix}`;
      if (institutionEmployees.some((entry) => entry.employeeId === employeeId)) {
        return;
      }

      institutionEmployees.push({
        employeeId,
        institutionId: institution.institutionId,
        fullName: staff.fullName,
        nationalId: `119900008${institution.institutionId.replace(/[^0-9]/g, '').padStart(3, '0')}${index + 20}`,
        phone: `+2507889972${String(index + 1).padStart(2, '0')}`,
        email: `${institution.slug}.staff${index + 2}@citizenfirst.gov.rw`,
        positionTitle: staff.title,
        positionKinyarwanda: 'Umukozi wa RIB',
        reportsTo: institution.leader.positionTitle,
        description: staff.description,
        status: 'Active',
        isLeader: false,
        createdAt: now,
      });
    });

    if (!systemUsers.some((entry) => entry.userId === institution.leader.userId)) {
      systemUsers.push({
        userId: institution.leader.userId,
        role: institution.leader.role,
        level: institution.level,
        fullName: institution.leader.fullName,
        email: institution.leader.email,
        nationalId: institution.leader.nationalId,
        institutionId: institution.institutionId,
        employeeId: institution.leader.employeeId,
        phone: institution.leader.phone,
        positionTitle: institution.leader.positionTitle,
        accessKey: institution.leader.accessKey,
        status: 'active',
        location: institution.location,
        ...createPasswordCredentials(institution.leader.password, institution.leader.userId),
        createdAt: now,
      });
    }

    ['Intake and Triage', 'Evidence Management', 'Escalation and Oversight'].forEach((name) => {
      const departmentId = `DEP-${institution.institutionId}-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;
      if (institutionDepartments.some((entry) => entry.departmentId === departmentId)) {
        return;
      }

      institutionDepartments.push({
        departmentId,
        institutionId: institution.institutionId,
        name,
        description: `${name} support for the RIB QR-enabled anti-corruption and citizen feedback workflow.`,
        createdAt: now,
      });
    });
  }

  for (const institution of registeredInstitutions) {
    const children = registeredInstitutions
      .filter((entry) => entry.parentInstitutionId === institution.institutionId)
      .map((entry) => entry.institutionId);

    institution.childInstitutionIds = children;
    institution.registeredChildUnits = children.length;
    institution.employeeCount = institutionEmployees.filter(
      (entry) => entry.institutionId === institution.institutionId,
    ).length;
    institution.updatedAt = now;
  }
}

export const staffTemplateExamples = [
  {
    leader_code: 'VIL-001',
    full_name: 'Mukamana Claudine',
    national_id: '1199XXXXXXXXXXX',
    position_title: 'Village Leader',
    position_kinyarwanda: "Umuyobozi w'Umudugudu",
    institution_level: 'Village',
    province: 'Kigali City',
    district: 'Kicukiro',
    sector: 'Kagarama',
    cell_name: 'Kanserege',
    village_name: 'Amahoro',
    phone: '+250788111111',
    email: '',
    reports_to: 'Cell Executive Secretary',
    description:
      "Ashinzwe kuyobora Umudugudu, gukurikirana abaturage no kugeza ibibazo byabo ku Kagari.",
    status: 'Active',
  },
  {
    leader_code: 'CEL-001',
    full_name: 'Uwimana Eric',
    national_id: '1198XXXXXXXXXXX',
    position_title: 'Executive Secretary',
    position_kinyarwanda: "Gitifu w'Akagari",
    institution_level: 'Cell',
    province: 'Kigali City',
    district: 'Kicukiro',
    sector: 'Kagarama',
    cell_name: 'Kanserege',
    village_name: '',
    phone: '+250788222222',
    email: 'eric.uwimana@kicukiro.gov.rw',
    reports_to: 'Sector Executive Secretary',
    description:
      "Ashinzwe ibikorwa by'Akagari, gutanga serivisi z'ibanze, kwakira ibibazo by'abaturage no kubitangira raporo ku Murenge.",
    status: 'Active',
  },
  {
    leader_code: 'SEC-001',
    full_name: 'Ndayisaba Patrick',
    national_id: '1197XXXXXXXXXXX',
    position_title: 'Executive Secretary',
    position_kinyarwanda: "Gitifu w'Umurenge",
    institution_level: 'Sector',
    province: 'Kigali City',
    district: 'Kicukiro',
    sector: 'Kagarama',
    cell_name: '',
    village_name: '',
    phone: '+250788333333',
    email: 'patrick.ndayisaba@kicukiro.gov.rw',
    reports_to: 'District Authority',
    description:
      "Ashinzwe guhuza ibikorwa by'Umurenge, gukurikirana Utugari no gutanga raporo ku Karere.",
    status: 'Active',
  },
];

export { HIERARCHY_TEST_CREDENTIALS };

seedHierarchyTestData({
  systemUsers,
  registeredInstitutions,
  institutionEmployees,
  institutionDepartments,
  createPasswordCredentials,
});

seedKacyiruSectorOfficeData();
seedRibCaseStudyData();
