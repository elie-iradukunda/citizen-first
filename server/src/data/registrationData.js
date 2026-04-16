import crypto from 'node:crypto';
import { HIERARCHY_TEST_CREDENTIALS, seedHierarchyTestData } from './hierarchyTestSeed.js';

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
const DEFAULT_DASHBOARD_ADMIN_KEY =
  process.env.DASHBOARD_ADMIN_ACCESS_KEY ?? 'CF-DASH-ADMIN-2026';
const DEFAULT_DASHBOARD_OFFICER_KEY =
  process.env.DASHBOARD_OFFICER_ACCESS_KEY ?? 'CF-DASH-OFFICER-2026';
const DEFAULT_DASHBOARD_CITIZEN_KEY =
  process.env.DASHBOARD_CITIZEN_ACCESS_KEY ?? 'CF-DASH-CITIZEN-2026';

const SYSTEM_ADMIN_EMAIL = process.env.SYSTEM_ADMIN_EMAIL ?? 'national.admin@citizenfirst.gov.rw';
const SYSTEM_ADMIN_PASSWORD = process.env.SYSTEM_ADMIN_PASSWORD ?? 'Admin@12345';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'test.admin@citizenfirst.gov.rw';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Admin@12345';
const DASHBOARD_ADMIN_EMAIL = process.env.DASHBOARD_ADMIN_EMAIL ?? 'oversight.admin@citizenfirst.gov.rw';
const DASHBOARD_ADMIN_PASSWORD = process.env.DASHBOARD_ADMIN_PASSWORD ?? 'Admin@12345';
const DASHBOARD_OFFICER_EMAIL = process.env.DASHBOARD_OFFICER_EMAIL ?? 'officer@citizenfirst.gov.rw';
const DASHBOARD_OFFICER_PASSWORD = process.env.DASHBOARD_OFFICER_PASSWORD ?? 'Officer@12345';
const DASHBOARD_CITIZEN_EMAIL = process.env.DASHBOARD_CITIZEN_EMAIL ?? 'citizen.demo@citizenfirst.gov.rw';
const DASHBOARD_CITIZEN_PASSWORD = process.env.DASHBOARD_CITIZEN_PASSWORD ?? 'Citizen@12345';

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
    fullName: 'Citizen First National Admin',
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
    fullName: 'Citizen First Test Admin',
    email: TEST_ADMIN_EMAIL,
    nationalId: null,
    institutionId: 'NATIONAL-PLATFORM',
    accessKey: TEST_ADMIN_ACCESS_KEY,
    status: 'active',
    ...createPasswordCredentials(TEST_ADMIN_PASSWORD, 'USR-TEST-ADMIN-001'),
    createdAt: '2026-04-03T00:00:00.000Z',
  },
  {
    userId: 'USR-DASHBOARD-ADMIN-001',
    role: 'oversight_admin',
    level: 'national',
    fullName: 'Oversight Dashboard Admin',
    email: DASHBOARD_ADMIN_EMAIL,
    nationalId: null,
    institutionId: 'NATIONAL-PLATFORM',
    accessKey: DEFAULT_DASHBOARD_ADMIN_KEY,
    status: 'active',
    ...createPasswordCredentials(DASHBOARD_ADMIN_PASSWORD, 'USR-DASHBOARD-ADMIN-001'),
    createdAt: '2026-04-03T00:00:00.000Z',
  },
  {
    userId: 'USR-DASHBOARD-OFFICER-001',
    role: 'institution_officer',
    level: 'district',
    fullName: 'District Operations Officer',
    email: DASHBOARD_OFFICER_EMAIL,
    nationalId: '1199000099998888',
    institutionId: 'DIS-0001',
    accessKey: DEFAULT_DASHBOARD_OFFICER_KEY,
    status: 'active',
    ...createPasswordCredentials(DASHBOARD_OFFICER_PASSWORD, 'USR-DASHBOARD-OFFICER-001'),
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Kicukiro',
      sector: '',
      cell: '',
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
      district: 'Kicukiro',
      sector: 'Kagarama',
      cell: 'Kanserege',
      village: 'Amahoro',
    },
    createdAt: '2026-04-03T00:00:00.000Z',
  },
];

export const institutionInvites = [];

export const registeredInstitutions = [];

export const institutionDepartments = [];

export const institutionEmployees = [];

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
      district: 'Kicukiro',
      sector: 'Kagarama',
      cell: 'Kanserege',
      village: 'Amahoro',
    },
    createdAt: '2026-04-03T00:00:00.000Z',
    status: 'active',
  },
];

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
