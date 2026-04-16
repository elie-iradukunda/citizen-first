import crypto from 'node:crypto';
import { Router } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';
import { getAuthUserFromRequest } from '../middleware/authMiddleware.js';
import {
  GOVERNMENT_LEVELS,
  LEVEL_TO_ROLE,
  NEXT_LEVEL_MAP,
  POSITION_TEMPLATES,
  RWANDA_ADMINISTRATIVE_STRUCTURE,
  createPasswordCredentials,
  institutionDepartments,
  institutionEmployees,
  institutionInvites,
  registeredCitizens,
  registeredInstitutions,
  staffTemplateExamples,
  systemUsers,
} from '../data/registrationData.js';

const router = Router();

const LEVEL_PREFIX = {
  province: 'PRO',
  district: 'DIS',
  sector: 'SEC',
  cell: 'CEL',
  village: 'VIL',
};

const NATIONAL_ROOT_ID = 'NATIONAL-PLATFORM';
const NEXT_LEVEL_BY_LEVEL = {
  province: 'district',
  district: 'sector',
  sector: 'cell',
  cell: 'village',
  village: null,
};
const CHILD_UNIT_LABEL_BY_LEVEL = {
  province: 'districts',
  district: 'sectors',
  sector: 'cells',
  cell: 'villages',
  village: null,
};

const nationalIdSchema = z
  .string()
  .regex(/^\d{16}$/, 'National ID must be 16 numeric digits.');

const phoneSchema = z
  .string()
  .regex(/^\+2507\d{8}$/, 'Phone must be a valid Rwanda mobile number, e.g. +250788123456.');

const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(64, 'Password is too long.');
const serviceItemSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().max(320).optional().or(z.literal('')),
});

const locationSchema = z.object({
  country: z.string().min(2).default('Rwanda'),
  province: z.string().min(2),
  provinceId: z.string().max(12).optional(),
  district: z.string().optional(),
  districtId: z.string().max(12).optional(),
  sector: z.string().optional(),
  sectorId: z.string().max(12).optional(),
  cell: z.string().optional(),
  cellId: z.string().max(12).optional(),
  village: z.string().optional(),
  villageId: z.string().max(12).optional(),
});

const createInviteSchema = z.object({
  targetLevel: z.enum(GOVERNMENT_LEVELS),
  institutionNameHint: z.string().min(3).max(180),
  location: locationSchema,
  contactEmail: emailSchema.optional().or(z.literal('')),
  contactPhone: phoneSchema.optional().or(z.literal('')),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

const registerInstitutionSchema = z.object({
  inviteToken: z.string().min(16),
  institutionName: z.string().min(4).max(180),
  institutionType: z.string().min(2).max(120),
  officialEmail: emailSchema.optional().or(z.literal('')),
  officialPhone: phoneSchema,
  officeAddress: z.string().min(4).max(240),
  location: locationSchema,
  leader: z.object({
    fullName: z.string().min(4).max(140),
    nationalId: nationalIdSchema,
    phone: phoneSchema,
    email: emailSchema,
    password: passwordSchema,
    positionTitle: z.string().min(2).max(120),
    positionKinyarwanda: z.string().min(2).max(180),
    description: z.string().max(320).optional().or(z.literal('')),
  }),
  departments: z
    .array(
      z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(220).optional().or(z.literal('')),
      }),
    )
    .max(20)
    .optional(),
  employees: z
    .array(
      z.object({
        leaderCode: z.string().max(40).optional().or(z.literal('')),
        fullName: z.string().min(4).max(140),
        nationalId: nationalIdSchema,
        positionTitle: z.string().min(2).max(120),
        positionKinyarwanda: z.string().max(180).optional().or(z.literal('')),
        phone: phoneSchema,
        email: emailSchema.optional().or(z.literal('')),
        reportsTo: z.string().max(140).optional().or(z.literal('')),
        description: z.string().max(320).optional().or(z.literal('')),
        status: z.enum(['Active', 'Inactive']).default('Active'),
      }),
    )
    .max(150)
    .optional(),
  expectedChildUnits: z.number().int().min(0).max(5000).optional(),
  services: z.array(serviceItemSchema).max(20).optional(),
});

const registerCitizenSchema = z.object({
  fullName: z.string().min(4).max(140),
  nationalId: nationalIdSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  dateOfBirth: z.string().min(8).max(20),
  gender: z.enum(['Male', 'Female', 'Other']),
  country: z.string().min(2).default('Rwanda'),
  province: z.string().min(2),
  district: z.string().min(2),
  sector: z.string().min(2),
  cell: z.string().min(2),
  village: z.string().min(2),
  idType: z.enum(['NATIONAL_ID', 'PASSPORT']).default('NATIONAL_ID'),
});

const citizenRegistrationFields = [
  { key: 'fullName', label: 'Full Name', required: true },
  { key: 'nationalId', label: 'National ID', required: true },
  { key: 'phone', label: 'Phone Number', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'password', label: 'Password', required: true },
  { key: 'dateOfBirth', label: 'Date of Birth', required: true },
  { key: 'gender', label: 'Gender', required: true },
  { key: 'country', label: 'Country', required: true, defaultValue: 'Rwanda' },
  { key: 'province', label: 'Province', required: true },
  { key: 'provinceId', label: 'Province ID (Optional)', required: false },
  { key: 'district', label: 'District', required: true },
  { key: 'districtId', label: 'District ID (Optional)', required: false },
  { key: 'sector', label: 'Sector', required: true },
  { key: 'sectorId', label: 'Sector ID (Optional)', required: false },
  { key: 'cell', label: 'Cell', required: true },
  { key: 'cellId', label: 'Cell ID (Optional)', required: false },
  { key: 'village', label: 'Village', required: true },
  { key: 'villageId', label: 'Village ID (Optional)', required: false },
];

const institutionRegistrationFields = [
  { key: 'institutionName', label: 'Institution Name', required: true },
  { key: 'institutionType', label: 'Institution Type', required: true },
  { key: 'officialEmail', label: 'Official Email', required: false },
  { key: 'officialPhone', label: 'Official Phone', required: true },
  { key: 'officeAddress', label: 'Office Physical Address', required: true },
  { key: 'province', label: 'Province', required: true },
  { key: 'provinceId', label: 'Province ID (Optional)', required: false },
  { key: 'district', label: 'District', required: false },
  { key: 'districtId', label: 'District ID (Optional)', required: false },
  { key: 'sector', label: 'Sector', required: false },
  { key: 'sectorId', label: 'Sector ID (Optional)', required: false },
  { key: 'cell', label: 'Cell', required: false },
  { key: 'cellId', label: 'Cell ID (Optional)', required: false },
  { key: 'village', label: 'Village', required: false },
  { key: 'villageId', label: 'Village ID (Optional)', required: false },
  { key: 'leader.fullName', label: 'Leader Full Name', required: true },
  { key: 'leader.nationalId', label: 'Leader National ID', required: true },
  { key: 'leader.phone', label: 'Leader Phone', required: true },
  { key: 'leader.email', label: 'Leader Email', required: true },
  { key: 'leader.password', label: 'Leader Password', required: true },
  { key: 'leader.positionTitle', label: 'Leader Position (English)', required: true },
  {
    key: 'leader.positionKinyarwanda',
    label: 'Leader Position (Kinyarwanda)',
    required: true,
  },
  {
    key: 'expectedChildUnits',
    label: 'Expected Next-Level Units',
    required: false,
  },
  {
    key: 'services[]',
    label: 'Institution Services',
    required: false,
  },
];

function titleCase(value) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isEmailAlreadyInUse(email) {
  const normalizedEmail = normalizeEmail(email);
  return systemUsers.some(
    (user) => user.email && normalizeEmail(user.email) === normalizedEmail,
  );
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function getRegisteredProvinces() {
  return uniqueSorted(
    registeredInstitutions
      .filter((entry) => entry.level === 'province')
      .map((entry) => entry.location?.province),
  );
}

function getRegisteredDistricts(provinceName) {
  return uniqueSorted(
    registeredInstitutions
      .filter(
        (entry) =>
          entry.level === 'district' && entry.location?.province === provinceName,
      )
      .map((entry) => entry.location?.district),
  );
}

function getRegisteredSectors(provinceName, districtName) {
  return uniqueSorted(
    registeredInstitutions
      .filter(
        (entry) =>
          entry.level === 'sector' &&
          entry.location?.province === provinceName &&
          entry.location?.district === districtName,
      )
      .map((entry) => entry.location?.sector),
  );
}

function getRegisteredCells(provinceName, districtName, sectorName) {
  return uniqueSorted(
    registeredInstitutions
      .filter(
        (entry) =>
          entry.level === 'cell' &&
          entry.location?.province === provinceName &&
          entry.location?.district === districtName &&
          entry.location?.sector === sectorName,
      )
      .map((entry) => entry.location?.cell),
  );
}

function getRegisteredVillages(provinceName, districtName, sectorName, cellName) {
  return uniqueSorted(
    registeredInstitutions
      .filter(
        (entry) =>
          entry.level === 'village' &&
          entry.location?.province === provinceName &&
          entry.location?.district === districtName &&
          entry.location?.sector === sectorName &&
          entry.location?.cell === cellName,
      )
      .map((entry) => entry.location?.village),
  );
}

function hasRegisteredInstitutionAtLevel(level, location) {
  return registeredInstitutions.some((entry) => {
    if (entry.level !== level) {
      return false;
    }
    if (entry.location?.province !== location.province) {
      return false;
    }
    if (['district', 'sector', 'cell', 'village'].includes(level)) {
      if (entry.location?.district !== location.district) {
        return false;
      }
    }
    if (['sector', 'cell', 'village'].includes(level)) {
      if (entry.location?.sector !== location.sector) {
        return false;
      }
    }
    if (['cell', 'village'].includes(level)) {
      if (entry.location?.cell !== location.cell) {
        return false;
      }
    }
    if (level === 'village') {
      if (entry.location?.village !== location.village) {
        return false;
      }
    }
    return true;
  });
}

function getStaticProvinces() {
  return RWANDA_ADMINISTRATIVE_STRUCTURE.map((entry) => entry.province);
}

function getStaticDistricts(provinceName) {
  const provinceEntry = getProvinceEntry(provinceName);
  return provinceEntry ? provinceEntry.districts.map((entry) => entry.district) : [];
}

function getStaticSectors(provinceName, districtName) {
  const districtEntry = getDistrictEntry(provinceName, districtName);
  return districtEntry ? districtEntry.sectors.map((entry) => entry.sector) : [];
}

function getStaticCells(provinceName, districtName, sectorName) {
  const sectorEntry = getSectorEntry(provinceName, districtName, sectorName);
  return sectorEntry ? sectorEntry.cells.map((entry) => entry.cell) : [];
}

function getStaticVillages(provinceName, districtName, sectorName, cellName) {
  const cellEntry = getCellEntry(provinceName, districtName, sectorName, cellName);
  return cellEntry ? cellEntry.villages : [];
}

function mergeLocationOptions(staticItems, registeredItems) {
  return uniqueSorted([...(staticItems ?? []), ...(registeredItems ?? [])]);
}

function getProvinces(source = 'hybrid') {
  const registeredProvinces = getRegisteredProvinces();
  if (source === 'registered') {
    return registeredProvinces;
  }
  if (source === 'static') {
    return getStaticProvinces();
  }
  return mergeLocationOptions(getStaticProvinces(), registeredProvinces);
}

function getDistricts(provinceName, source = 'hybrid') {
  const registeredDistricts = getRegisteredDistricts(provinceName);
  if (source === 'registered') {
    return registeredDistricts;
  }
  if (source === 'static') {
    return getStaticDistricts(provinceName);
  }
  return mergeLocationOptions(getStaticDistricts(provinceName), registeredDistricts);
}

function getSectors(provinceName, districtName, source = 'hybrid') {
  const registeredSectors = getRegisteredSectors(provinceName, districtName);
  if (source === 'registered') {
    return registeredSectors;
  }
  if (source === 'static') {
    return getStaticSectors(provinceName, districtName);
  }
  return mergeLocationOptions(getStaticSectors(provinceName, districtName), registeredSectors);
}

function getCells(provinceName, districtName, sectorName, source = 'hybrid') {
  const registeredCells = getRegisteredCells(provinceName, districtName, sectorName);
  if (source === 'registered') {
    return registeredCells;
  }
  if (source === 'static') {
    return getStaticCells(provinceName, districtName, sectorName);
  }
  return mergeLocationOptions(
    getStaticCells(provinceName, districtName, sectorName),
    registeredCells,
  );
}

function getVillages(provinceName, districtName, sectorName, cellName, source = 'hybrid') {
  const registeredVillages = getRegisteredVillages(provinceName, districtName, sectorName, cellName);
  if (source === 'registered') {
    return registeredVillages;
  }
  if (source === 'static') {
    return getStaticVillages(provinceName, districtName, sectorName, cellName);
  }
  return mergeLocationOptions(
    getStaticVillages(provinceName, districtName, sectorName, cellName),
    registeredVillages,
  );
}

function buildRegisteredLocationTree() {
  return getRegisteredProvinces().map((province) => ({
    province,
    districts: getRegisteredDistricts(province).map((district) => ({
      district,
      sectors: getRegisteredSectors(province, district).map((sector) => ({
        sector,
        cells: getRegisteredCells(province, district, sector).map((cell) => ({
          cell,
          villages: getRegisteredVillages(province, district, sector, cell),
        })),
      })),
    })),
  }));
}

function getProvinceEntry(provinceName) {
  return RWANDA_ADMINISTRATIVE_STRUCTURE.find((entry) => entry.province === provinceName);
}

function getDistrictEntry(provinceName, districtName) {
  const province = getProvinceEntry(provinceName);
  if (!province) {
    return null;
  }
  return province.districts.find((entry) => entry.district === districtName) ?? null;
}

function getSectorEntry(provinceName, districtName, sectorName) {
  const district = getDistrictEntry(provinceName, districtName);
  if (!district) {
    return null;
  }
  return district.sectors.find((entry) => entry.sector === sectorName) ?? null;
}

function getCellEntry(provinceName, districtName, sectorName, cellName) {
  const sector = getSectorEntry(provinceName, districtName, sectorName);
  if (!sector) {
    return null;
  }
  return sector.cells.find((entry) => entry.cell === cellName) ?? null;
}

function normalizeLocation(rawLocation) {
  return {
    country: titleCase(rawLocation.country ?? 'Rwanda'),
    province: titleCase(rawLocation.province ?? ''),
    provinceId: rawLocation.provinceId ?? '',
    district: titleCase(rawLocation.district ?? ''),
    districtId: rawLocation.districtId ?? '',
    sector: titleCase(rawLocation.sector ?? ''),
    sectorId: rawLocation.sectorId ?? '',
    cell: titleCase(rawLocation.cell ?? ''),
    cellId: rawLocation.cellId ?? '',
    village: titleCase(rawLocation.village ?? ''),
    villageId: rawLocation.villageId ?? '',
  };
}

function mustIncludeLocationField(location, field) {
  return Boolean(location[field] && location[field].trim().length > 1);
}

function validateLocationByLevel(level, rawLocation) {
  const location = normalizeLocation(rawLocation);
  const errors = [];

  if (!getProvinces().includes(location.province)) {
    errors.push('Province must match official Rwanda province options.');
  }

  if (['district', 'sector', 'cell', 'village'].includes(level) && !mustIncludeLocationField(location, 'district')) {
    errors.push('District is required for this level.');
  }

  if (['sector', 'cell', 'village'].includes(level) && !mustIncludeLocationField(location, 'sector')) {
    errors.push('Sector is required for this level.');
  }

  if (['cell', 'village'].includes(level) && !mustIncludeLocationField(location, 'cell')) {
    errors.push('Cell is required for this level.');
  }

  if (level === 'village' && !mustIncludeLocationField(location, 'village')) {
    errors.push('Village is required for village-level registration.');
  }

  const districtEntry = location.district
    ? getDistrictEntry(location.province, location.district)
    : null;
  const hasRegisteredDistrict = location.district
    ? hasRegisteredInstitutionAtLevel('district', location)
    : false;
  if (location.district && !districtEntry && !hasRegisteredDistrict) {
    errors.push('District must belong to the selected province.');
  }

  const registeredSectors = location.district
    ? getRegisteredSectors(location.province, location.district)
    : [];
  const hasSectorCatalog =
    (districtEntry && districtEntry.sectors.length > 0) || registeredSectors.length > 0;
  const sectorEntry = location.sector
    ? getSectorEntry(location.province, location.district, location.sector)
    : null;
  const hasRegisteredSector = location.sector
    ? hasRegisteredInstitutionAtLevel('sector', location)
    : false;
  if (hasSectorCatalog && location.sector && !sectorEntry && !hasRegisteredSector) {
    errors.push('Sector must belong to the selected district.');
  }

  const registeredCells = location.sector
    ? getRegisteredCells(location.province, location.district, location.sector)
    : [];
  const hasCellCatalog = (sectorEntry && sectorEntry.cells.length > 0) || registeredCells.length > 0;
  const cellEntry = location.cell
    ? getCellEntry(location.province, location.district, location.sector, location.cell)
    : null;
  const hasRegisteredCell = location.cell ? hasRegisteredInstitutionAtLevel('cell', location) : false;
  if (hasCellCatalog && location.cell && !cellEntry && !hasRegisteredCell) {
    errors.push('Cell must belong to the selected sector.');
  }

  if (location.village) {
    const registeredVillages = getRegisteredVillages(
      location.province,
      location.district,
      location.sector,
      location.cell,
    );
    const hasVillageCatalog =
      (cellEntry && cellEntry.villages.length > 0) || registeredVillages.length > 0;
    const hasVillageInStatic = cellEntry ? cellEntry.villages.includes(location.village) : false;
    const hasVillageInRegistered = hasRegisteredInstitutionAtLevel('village', location);

    if (hasVillageCatalog && !hasVillageInStatic && !hasVillageInRegistered) {
      errors.push('Village must belong to the selected cell.');
    }
  }

  return {
    location,
    errors,
    catalogs: {
      hasSectorCatalog,
      hasCellCatalog,
    },
  };
}

function resolveActor(request) {
  const authContext = getAuthUserFromRequest(request);
  if (authContext?.user) {
    return authContext.user;
  }

  const headerKey = request.get('x-access-key');
  const bodyKey =
    request.body && typeof request.body === 'object' && 'accessKey' in request.body
      ? request.body.accessKey
      : undefined;
  const accessKey = headerKey ?? bodyKey;

  if (!accessKey) {
    return null;
  }

  return systemUsers.find(
    (user) => user.accessKey === accessKey && user.status === 'active',
  );
}

function ensureRoleCanInvite(actor, targetLevel) {
  const allowedNextLevel =
    NEXT_LEVEL_MAP[actor.role] ?? (actor.role === 'oversight_admin' ? 'province' : null);
  return allowedNextLevel === targetLevel;
}

function ensureLocationInActorScope(actor, location) {
  if (actor.role === 'national_admin' || actor.role === 'oversight_admin') {
    return true;
  }

  const actorLocation = actor.location ?? {};

  if (actor.role === 'province_leader') {
    return actorLocation.province === location.province;
  }
  if (actor.role === 'district_leader') {
    return (
      actorLocation.province === location.province &&
      actorLocation.district === location.district
    );
  }
  if (actor.role === 'sector_leader') {
    return (
      actorLocation.province === location.province &&
      actorLocation.district === location.district &&
      actorLocation.sector === location.sector
    );
  }
  if (actor.role === 'cell_leader') {
    return (
      actorLocation.province === location.province &&
      actorLocation.district === location.district &&
      actorLocation.sector === location.sector &&
      actorLocation.cell === location.cell
    );
  }

  return false;
}

function generateId(prefix, count) {
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

function getClientBaseUrl() {
  return process.env.CLIENT_URL ?? 'http://localhost:5173';
}

function getAccessKeyForNewLeader(level) {
  return `CF-${LEVEL_PREFIX[level]}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function getInviteByToken(token) {
  return institutionInvites.find((invite) => invite.token === token);
}

function getNextLevelForLevel(level) {
  return NEXT_LEVEL_BY_LEVEL[level] ?? null;
}

function getChildUnitLabelForLevel(level) {
  return CHILD_UNIT_LABEL_BY_LEVEL[level] ?? null;
}

function normalizeServiceCatalog(services = []) {
  const seen = new Set();
  return services
    .map((item) => ({
      name: titleCase(item.name ?? ''),
      description: (item.description ?? '').trim(),
    }))
    .filter((item) => item.name.length > 1)
    .filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function findInstitutionById(institutionId) {
  return registeredInstitutions.find((institution) => institution.institutionId === institutionId);
}

function getChildrenInstitutions(parentInstitutionId) {
  return registeredInstitutions.filter(
    (institution) => institution.parentInstitutionId === parentInstitutionId,
  );
}

function isSameScopeForLevel(level, leftLocation, rightLocation) {
  if (!leftLocation || !rightLocation) {
    return false;
  }

  if (leftLocation.province !== rightLocation.province) {
    return false;
  }
  if (['district', 'sector', 'cell', 'village'].includes(level)) {
    if (leftLocation.district !== rightLocation.district) {
      return false;
    }
  }
  if (['sector', 'cell', 'village'].includes(level)) {
    if (leftLocation.sector !== rightLocation.sector) {
      return false;
    }
  }
  if (['cell', 'village'].includes(level)) {
    if (leftLocation.cell !== rightLocation.cell) {
      return false;
    }
  }
  if (level === 'village') {
    if (leftLocation.village !== rightLocation.village) {
      return false;
    }
  }

  return true;
}

function canActorViewInstitution(actor, institution) {
  if (!actor || !institution) {
    return false;
  }
  if (actor.role === 'national_admin') {
    return true;
  }
  if (actor.institutionId && actor.institutionId === institution.institutionId) {
    return true;
  }

  return ensureLocationInActorScope(actor, institution.location);
}

function matchesLocationFilters(location, filters) {
  const keys = ['province', 'district', 'sector', 'cell', 'village'];
  return keys.every((key) => {
    if (!filters[key]) {
      return true;
    }
    return location?.[key] === filters[key];
  });
}

function buildInstitutionTreeNode(institution) {
  const children = getChildrenInstitutions(institution.institutionId)
    .sort((left, right) => left.institutionName.localeCompare(right.institutionName))
    .map((child) => buildInstitutionTreeNode(child));

  return {
    institutionId: institution.institutionId,
    institutionName: institution.institutionName,
    level: institution.level,
    location: institution.location,
    expectedChildUnits: institution.expectedChildUnits ?? null,
    registeredChildUnits: children.length,
    childUnitLabel: getChildUnitLabelForLevel(institution.level),
    employeeCount: institution.employeeCount ?? 0,
    servicesCount: institution.services?.length ?? 0,
    services: institution.services ?? [],
    children,
  };
}

function summarizeNodes(nodes) {
  const summary = {
    totalInstitutions: 0,
    byLevel: {
      province: 0,
      district: 0,
      sector: 0,
      cell: 0,
      village: 0,
    },
  };

  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    summary.totalInstitutions += 1;
    if (node?.level && node.level in summary.byLevel) {
      summary.byLevel[node.level] += 1;
    }
    if (Array.isArray(node?.children)) {
      stack.push(...node.children);
    }
  }

  return summary;
}

router.get('/hierarchy', (_request, response) => {
  response.json({
    levels: GOVERNMENT_LEVELS,
    nextLevelByRole: NEXT_LEVEL_MAP,
    levelPositionTemplates: POSITION_TEMPLATES,
    nationalRoot: {
      institutionId: NATIONAL_ROOT_ID,
      expectedChildUnits: RWANDA_ADMINISTRATIVE_STRUCTURE.length,
      childUnitLabel: 'provinces',
    },
    structureSummary: {
      provinces: RWANDA_ADMINISTRATIVE_STRUCTURE.length,
      districts: RWANDA_ADMINISTRATIVE_STRUCTURE.reduce(
        (accumulator, entry) => accumulator + entry.districts.length,
        0,
      ),
      sectorsWithCatalog: RWANDA_ADMINISTRATIVE_STRUCTURE.reduce(
        (accumulator, entry) =>
          accumulator +
          entry.districts.filter((districtEntry) => districtEntry.sectors.length > 0).length,
        0,
      ),
    },
  });
});

router.get('/field-definitions', (_request, response) => {
  response.json({
    citizenFields: citizenRegistrationFields,
    institutionFields: institutionRegistrationFields,
    managementFieldsByLevel: {
      province: {
        expectedChildUnitsLabel: 'Number of districts in this province',
        childUnitLabel: 'districts',
      },
      district: {
        expectedChildUnitsLabel: 'Number of sectors in this district',
        childUnitLabel: 'sectors',
      },
      sector: {
        expectedChildUnitsLabel: 'Number of cells in this sector',
        childUnitLabel: 'cells',
      },
      cell: {
        expectedChildUnitsLabel: 'Number of villages in this cell',
        childUnitLabel: 'villages',
      },
      village: {
        expectedChildUnitsLabel: null,
        childUnitLabel: null,
      },
    },
  });
});

router.get('/locations/provinces', (_request, response) => {
  const source = String(_request.query.source ?? 'hybrid');
  response.json({
    items: getProvinces(source),
  });
});

router.get('/locations/tree', (_request, response) => {
  response.json({
    items: RWANDA_ADMINISTRATIVE_STRUCTURE,
    registeredItems: buildRegisteredLocationTree(),
  });
});

router.get('/locations/districts', (request, response) => {
  const province = titleCase(request.query.province ?? '');
  const source = String(request.query.source ?? 'hybrid');
  const provinces = getProvinces(source);

  if (!provinces.includes(province)) {
    return response.status(400).json({
      message: 'Invalid province.',
      items: [],
    });
  }

  return response.json({
    items: getDistricts(province, source),
  });
});

router.get('/locations/sectors', (request, response) => {
  const province = titleCase(request.query.province ?? '');
  const district = titleCase(request.query.district ?? '');
  const source = String(request.query.source ?? 'hybrid');
  const districts = getDistricts(province, source);

  if (!districts.includes(district)) {
    return response.status(400).json({
      message: 'Invalid province or district.',
      items: [],
    });
  }

  const items = getSectors(province, district, source);

  return response.json({
    items,
    catalogAvailable: items.length > 0,
  });
});

router.get('/locations/cells', (request, response) => {
  const province = titleCase(request.query.province ?? '');
  const district = titleCase(request.query.district ?? '');
  const sector = titleCase(request.query.sector ?? '');
  const source = String(request.query.source ?? 'hybrid');
  const sectors = getSectors(province, district, source);

  if (!sectors.includes(sector)) {
    return response.status(400).json({
      message: 'Sector not found in catalog. You can manually provide cell if catalog is unavailable.',
      items: [],
      catalogAvailable: false,
    });
  }

  const items = getCells(province, district, sector, source);

  return response.json({
    items,
    catalogAvailable: items.length > 0,
  });
});

router.get('/locations/villages', (request, response) => {
  const province = titleCase(request.query.province ?? '');
  const district = titleCase(request.query.district ?? '');
  const sector = titleCase(request.query.sector ?? '');
  const cell = titleCase(request.query.cell ?? '');
  const source = String(request.query.source ?? 'hybrid');
  const cells = getCells(province, district, sector, source);

  if (!cells.includes(cell)) {
    return response.status(400).json({
      message: 'Cell not found in catalog. You can manually provide village if catalog is unavailable.',
      items: [],
      catalogAvailable: false,
    });
  }

  const items = getVillages(province, district, sector, cell, source);

  return response.json({
    items,
    catalogAvailable: items.length > 0,
  });
});

router.get('/staff-template', (_request, response) => {
  response.json({
    items: staffTemplateExamples,
  });
});

router.get('/relationships/tree', (request, response) => {
  const actor = resolveActor(request);
  if (!actor) {
    return response.status(401).json({
      message: 'Authentication or access key is required.',
    });
  }

  let nodes = [];

  if (['national_admin', 'oversight_admin'].includes(actor.role)) {
    nodes = getChildrenInstitutions(NATIONAL_ROOT_ID)
      .sort((left, right) => left.institutionName.localeCompare(right.institutionName))
      .map((institution) => buildInstitutionTreeNode(institution));
  } else {
    const actorInstitution = findInstitutionById(actor.institutionId);
    if (actorInstitution && canActorViewInstitution(actor, actorInstitution)) {
      nodes = [buildInstitutionTreeNode(actorInstitution)];
    }
  }

  const summary = summarizeNodes(nodes);

  return response.json({
    national: {
      institutionId: NATIONAL_ROOT_ID,
      expectedChildUnits: RWANDA_ADMINISTRATIVE_STRUCTURE.length,
      registeredChildUnits: getChildrenInstitutions(NATIONAL_ROOT_ID).length,
      childUnitLabel: 'provinces',
    },
    summary,
    items: nodes,
  });
});

router.get('/relationships/children/:institutionId', (request, response) => {
  const actor = resolveActor(request);
  if (!actor) {
    return response.status(401).json({
      message: 'Authentication or access key is required.',
    });
  }

  const { institutionId } = request.params;
  const parentInstitution =
    institutionId === NATIONAL_ROOT_ID ? null : findInstitutionById(institutionId);

  if (institutionId !== NATIONAL_ROOT_ID && !parentInstitution) {
    return response.status(404).json({
      message: 'Institution not found.',
    });
  }

  if (
    institutionId !== NATIONAL_ROOT_ID &&
    !canActorViewInstitution(actor, parentInstitution)
  ) {
    return response.status(403).json({
      message: 'You cannot access this institution scope.',
    });
  }

  if (
    institutionId === NATIONAL_ROOT_ID &&
    !['national_admin', 'oversight_admin'].includes(actor.role)
  ) {
    return response.status(403).json({
      message: 'Only national-level roles can list province institutions from root.',
    });
  }

  const children = getChildrenInstitutions(institutionId)
    .filter((entry) => canActorViewInstitution(actor, entry))
    .sort((left, right) => left.institutionName.localeCompare(right.institutionName))
    .map((institution) => ({
      institutionId: institution.institutionId,
      institutionName: institution.institutionName,
      level: institution.level,
      location: institution.location,
      expectedChildUnits: institution.expectedChildUnits ?? null,
      registeredChildUnits: getChildrenInstitutions(institution.institutionId).length,
      childUnitLabel: getChildUnitLabelForLevel(institution.level),
      employeeCount: institution.employeeCount ?? 0,
      servicesCount: institution.services?.length ?? 0,
      services: institution.services ?? [],
    }));

  return response.json({
    parentInstitutionId: institutionId,
    items: children,
  });
});

router.get('/invites/:token', (request, response) => {
  const invite = getInviteByToken(request.params.token);

  if (!invite) {
    return response.status(404).json({
      message: 'Invite token not found.',
    });
  }

  const expired = new Date(invite.expiresAt) < new Date();

  return response.json({
    item: {
      inviteId: invite.inviteId,
      token: invite.token,
      targetLevel: invite.targetLevel,
      institutionNameHint: invite.institutionNameHint,
      location: invite.location,
      status: invite.status,
      expiresAt: invite.expiresAt,
      expired,
      createdByRole: invite.createdByRole,
      parentInstitutionId: invite.parentInstitutionId ?? null,
    },
  });
});

router.post('/invites', async (request, response, next) => {
  try {
    const actor = resolveActor(request);
    if (!actor) {
      return response.status(401).json({
        message: 'Invalid or missing access key.',
      });
    }

    const parseResult = createInviteSchema.safeParse(request.body);
    if (!parseResult.success) {
      return response.status(400).json({
        message: 'Invalid invite payload.',
        errors: parseResult.error.flatten(),
      });
    }

    const payload = parseResult.data;
    const { location, errors } = validateLocationByLevel(payload.targetLevel, payload.location);
    if (errors.length > 0) {
      return response.status(400).json({
        message: 'Location validation failed.',
        errors,
      });
    }

    if (!ensureRoleCanInvite(actor, payload.targetLevel)) {
      const allowedTargetLevel =
        NEXT_LEVEL_MAP[actor.role] ?? (actor.role === 'oversight_admin' ? 'province' : null);
      return response.status(403).json({
        message: `Your role (${actor.role}) can only invite the next hierarchy level.`,
        allowedTargetLevel,
      });
    }

    if (!ensureLocationInActorScope(actor, location)) {
      return response.status(403).json({
        message: 'Invite location is outside your governance scope.',
      });
    }

    if (!['national_admin', 'oversight_admin'].includes(actor.role) && !actor.institutionId) {
      return response.status(403).json({
        message: 'Your account is not linked to an institution and cannot issue invites.',
      });
    }

    const inviteToken = crypto.randomBytes(16).toString('hex');
    const inviteId = generateId('INV', institutionInvites.length);
    const expiresInDays = payload.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const parentInstitutionId =
      actor.role === 'national_admin' || actor.role === 'oversight_admin'
        ? NATIONAL_ROOT_ID
        : actor.institutionId;
    const registrationLink = `${getClientBaseUrl()}/register/institution?inviteToken=${inviteToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(registrationLink, {
      margin: 1,
      color: {
        dark: '#1d3567',
        light: '#f3f6fc',
      },
    });

    const inviteRecord = {
      inviteId,
      token: inviteToken,
      targetLevel: payload.targetLevel,
      institutionNameHint: payload.institutionNameHint,
      location,
      contactEmail: payload.contactEmail || null,
      contactPhone: payload.contactPhone || null,
      status: 'pending',
      createdByUserId: actor.userId,
      createdByRole: actor.role,
      parentInstitutionId,
      createdAt: new Date().toISOString(),
      expiresAt,
      registrationLink,
      qrCodeDataUrl,
    };

    institutionInvites.push(inviteRecord);

    return response.status(201).json({
      message: 'Registration invite created successfully.',
      item: inviteRecord,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/institutions/complete', async (request, response, next) => {
  try {
    const parseResult = registerInstitutionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return response.status(400).json({
        message: 'Invalid institution registration payload.',
        errors: parseResult.error.flatten(),
      });
    }

    const payload = parseResult.data;
    const invite = getInviteByToken(payload.inviteToken);

    if (!invite) {
      return response.status(404).json({
        message: 'Invite token not found.',
      });
    }

    if (invite.status !== 'pending') {
      return response.status(400).json({
        message: 'Invite token has already been used or revoked.',
      });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return response.status(400).json({
        message: 'Invite token has expired.',
      });
    }

    const { location, errors } = validateLocationByLevel(invite.targetLevel, payload.location);
    if (errors.length > 0) {
      return response.status(400).json({
        message: 'Location validation failed.',
        errors,
      });
    }

    if (
      location.province !== invite.location.province ||
      (invite.location.district && invite.location.district !== location.district) ||
      (invite.location.sector && invite.location.sector !== location.sector) ||
      (invite.location.cell && invite.location.cell !== location.cell)
    ) {
      return response.status(400).json({
        message: 'Registration location does not match invite scope.',
      });
    }

    const hasLeaderNationalId = systemUsers.some(
      (user) => user.nationalId && user.nationalId === payload.leader.nationalId,
    );
    if (hasLeaderNationalId) {
      return response.status(409).json({
        message: 'Leader with this national ID already exists in system.',
      });
    }

    if (isEmailAlreadyInUse(payload.leader.email)) {
      return response.status(409).json({
        message: 'Leader email is already registered.',
      });
    }

    const level = invite.targetLevel;
    const nextLevel = getNextLevelForLevel(level);
    const expectedChildUnits = nextLevel ? payload.expectedChildUnits : null;

    if (nextLevel && (typeof expectedChildUnits !== 'number' || expectedChildUnits < 1)) {
      return response.status(400).json({
        message: `Expected number of ${getChildUnitLabelForLevel(level)} is required for ${level} level.`,
      });
    }

    const parentInstitutionId =
      invite.parentInstitutionId ??
      (['national_admin', 'oversight_admin'].includes(invite.createdByRole)
        ? NATIONAL_ROOT_ID
        : null);
    const parentInstitution =
      parentInstitutionId && parentInstitutionId !== NATIONAL_ROOT_ID
        ? findInstitutionById(parentInstitutionId)
        : null;

    if (level !== 'province' && !parentInstitutionId) {
      return response.status(400).json({
        message:
          'Invite relationship is invalid. Non-province registrations require a parent institution.',
      });
    }

    if (parentInstitutionId && parentInstitutionId !== NATIONAL_ROOT_ID && !parentInstitution) {
      return response.status(400).json({
        message: 'Parent institution was not found for this invite chain.',
      });
    }

    if (parentInstitution && getNextLevelForLevel(parentInstitution.level) !== level) {
      return response.status(400).json({
        message: 'Invite chain is inconsistent with hierarchy levels.',
      });
    }

    const duplicateInstitution = registeredInstitutions.find(
      (entry) =>
        entry.level === level &&
        isSameScopeForLevel(level, entry.location, location),
    );
    if (duplicateInstitution) {
      return response.status(409).json({
        message: `A ${level}-level institution is already registered for this location scope.`,
        institutionId: duplicateInstitution.institutionId,
      });
    }

    const services = normalizeServiceCatalog(payload.services ?? []);
    const institutionId = generateId(LEVEL_PREFIX[level], registeredInstitutions.length);
    const institutionSlug = slugify(`${payload.institutionName}-${institutionId}`);

    const institutionRecord = {
      institutionId,
      slug: institutionSlug,
      level,
      parentInstitutionId,
      institutionName: payload.institutionName,
      institutionType: payload.institutionType,
      officialEmail: payload.officialEmail || null,
      officialPhone: payload.officialPhone,
      officeAddress: payload.officeAddress,
      location,
      leaderNationalId: payload.leader.nationalId,
      childLevel: nextLevel,
      childUnitLabel: getChildUnitLabelForLevel(level),
      expectedChildUnits,
      registeredChildUnits: 0,
      childInstitutionIds: [],
      services,
      employeeCount: 0,
      createdByInviteId: invite.inviteId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    };

    const qrContent = {
      institutionId,
      institutionName: payload.institutionName,
      level,
      parentInstitutionId,
      location,
      leader: {
        fullName: payload.leader.fullName,
        positionTitle: payload.leader.positionTitle,
      },
      expectedChildUnits,
      services: services.map((item) => item.name),
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrContent), {
      margin: 1,
      color: {
        dark: '#1d3567',
        light: '#f3f6fc',
      },
    });

    institutionRecord.qrCodeDataUrl = qrCodeDataUrl;

    const leaderRole = LEVEL_TO_ROLE[level];
    const leaderAccessKey = getAccessKeyForNewLeader(level);
    const leaderUserId = generateId('USR', systemUsers.length);
    const leaderEmail = normalizeEmail(payload.leader.email);
    const leaderUser = {
      userId: leaderUserId,
      role: leaderRole,
      level,
      institutionId,
      fullName: payload.leader.fullName,
      email: leaderEmail,
      nationalId: payload.leader.nationalId,
      accessKey: leaderAccessKey,
      status: 'active',
      location,
      ...createPasswordCredentials(payload.leader.password, leaderUserId),
      createdAt: new Date().toISOString(),
    };

    systemUsers.push(leaderUser);

    const leaderEmployeeRecord = {
      employeeId: generateId('EMP', institutionEmployees.length),
      institutionId,
      fullName: payload.leader.fullName,
      nationalId: payload.leader.nationalId,
      phone: payload.leader.phone,
      email: leaderEmail,
      positionTitle: payload.leader.positionTitle,
      positionKinyarwanda: payload.leader.positionKinyarwanda,
      reportsTo: POSITION_TEMPLATES[level]?.reportsTo ?? 'N/A',
      description: payload.leader.description || null,
      status: 'Active',
      isLeader: true,
      createdAt: new Date().toISOString(),
    };
    institutionEmployees.push(leaderEmployeeRecord);

    (payload.departments ?? []).forEach((department) => {
      institutionDepartments.push({
        departmentId: generateId('DEP', institutionDepartments.length),
        institutionId,
        name: department.name,
        description: department.description || null,
        createdAt: new Date().toISOString(),
      });
    });

    (payload.employees ?? []).forEach((employee) => {
      institutionEmployees.push({
        employeeId: generateId('EMP', institutionEmployees.length),
        institutionId,
        leaderCode: employee.leaderCode || null,
        fullName: employee.fullName,
        nationalId: employee.nationalId,
        phone: employee.phone,
        email: employee.email || null,
        positionTitle: employee.positionTitle,
        positionKinyarwanda: employee.positionKinyarwanda || null,
        reportsTo: employee.reportsTo || null,
        description: employee.description || null,
        status: employee.status,
        isLeader: false,
        createdAt: new Date().toISOString(),
      });
    });

    const totalEmployeeCount = institutionEmployees.filter(
      (entry) => entry.institutionId === institutionId,
    ).length;
    institutionRecord.employeeCount = totalEmployeeCount;
    registeredInstitutions.push(institutionRecord);

    if (parentInstitution) {
      if (!Array.isArray(parentInstitution.childInstitutionIds)) {
        parentInstitution.childInstitutionIds = [];
      }
      if (!parentInstitution.childInstitutionIds.includes(institutionId)) {
        parentInstitution.childInstitutionIds.push(institutionId);
      }
      parentInstitution.registeredChildUnits = getChildrenInstitutions(
        parentInstitution.institutionId,
      ).length;
      parentInstitution.updatedAt = new Date().toISOString();
    }

    invite.status = 'used';
    invite.usedAt = new Date().toISOString();
    invite.usedByInstitutionId = institutionId;

    return response.status(201).json({
      message: 'Institution registered successfully.',
      item: {
        institution: institutionRecord,
        leaderUser: {
          userId: leaderUser.userId,
          role: leaderUser.role,
          email: leaderUser.email,
          accessKey: leaderUser.accessKey,
          nextLevelToInvite: NEXT_LEVEL_MAP[leaderUser.role],
        },
        departmentsCount: institutionDepartments.filter(
          (entry) => entry.institutionId === institutionId,
        ).length,
        employeesCount: totalEmployeeCount,
        hierarchy: {
          parentInstitutionId,
          expectedChildUnits,
          registeredChildUnits: institutionRecord.registeredChildUnits,
          childUnitLabel: getChildUnitLabelForLevel(level),
          nextLevel,
        },
        servicesCount: services.length,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/citizens', (request, response) => {
  const parseResult = registerCitizenSchema.safeParse(request.body);

  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Invalid citizen registration payload.',
      errors: parseResult.error.flatten(),
    });
  }

  const payload = parseResult.data;
  const { location, errors } = validateLocationByLevel('village', {
    country: payload.country,
    province: payload.province,
    district: payload.district,
    sector: payload.sector,
    cell: payload.cell,
    village: payload.village,
  });

  if (errors.length > 0) {
    return response.status(400).json({
      message: 'Citizen location validation failed.',
      errors,
    });
  }

  const alreadyExists = registeredCitizens.some(
    (citizen) => citizen.nationalId === payload.nationalId,
  );
  if (alreadyExists) {
    return response.status(409).json({
      message: 'Citizen with this national ID is already registered.',
    });
  }

  if (isEmailAlreadyInUse(payload.email)) {
    return response.status(409).json({
      message: 'Citizen email is already registered.',
    });
  }

  const citizenId = `CIT-${new Date().getFullYear()}-${String(
    registeredCitizens.length + 1,
  ).padStart(5, '0')}`;

  const citizenRecord = {
    citizenId,
    fullName: payload.fullName,
    nationalId: payload.nationalId,
    phone: payload.phone,
    email: normalizeEmail(payload.email),
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    idType: payload.idType,
    location,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  registeredCitizens.push(citizenRecord);

  const citizenAccessKey = `CF-CIT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const citizenUserId = `USR-CIT-${String(systemUsers.length + 1).padStart(4, '0')}`;
  const citizenUser = {
    userId: citizenUserId,
    role: 'citizen',
    level: 'citizen',
    fullName: payload.fullName,
    email: normalizeEmail(payload.email),
    nationalId: payload.nationalId,
    phone: payload.phone,
    institutionId: null,
    accessKey: citizenAccessKey,
    status: 'active',
    location,
    ...createPasswordCredentials(payload.password, citizenUserId),
    createdAt: new Date().toISOString(),
  };

  systemUsers.push(citizenUser);

  return response.status(201).json({
    message: 'Citizen registered successfully.',
    item: {
      ...citizenRecord,
      loginEmail: citizenUser.email,
      accessKey: citizenAccessKey,
    },
  });
});

router.get('/institutions', (request, response) => {
  const actor = resolveActor(request);
  if (!actor) {
    return response.status(401).json({
      message: 'Invalid or missing access key.',
    });
  }

  let items = registeredInstitutions;
  if (!['national_admin', 'oversight_admin'].includes(actor.role)) {
    items = registeredInstitutions.filter(
      (institution) => canActorViewInstitution(actor, institution),
    );
  }

  return response.json({
    items,
  });
});

router.get('/employees/:institutionId', (request, response) => {
  return response.json({
    items: institutionEmployees.filter(
      (entry) => entry.institutionId === request.params.institutionId,
    ),
  });
});

router.get('/departments/:institutionId', (request, response) => {
  return response.json({
    items: institutionDepartments.filter(
      (entry) => entry.institutionId === request.params.institutionId,
    ),
  });
});

router.get('/leaders', (request, response) => {
  const actor = resolveActor(request);
  if (!actor) {
    return response.status(401).json({
      message: 'Authentication or access key is required.',
    });
  }

  const filters = {
    province: titleCase(request.query.province ?? ''),
    district: titleCase(request.query.district ?? ''),
    sector: titleCase(request.query.sector ?? ''),
    cell: titleCase(request.query.cell ?? ''),
    village: titleCase(request.query.village ?? ''),
  };

  const visibleInstitutions = registeredInstitutions.filter((institution) => {
    if (!canActorViewInstitution(actor, institution)) {
      return false;
    }
    return matchesLocationFilters(institution.location, filters);
  });

  const leaders = visibleInstitutions
    .map((institution) => {
      const leaderEmployee = institutionEmployees.find(
        (employee) =>
          employee.institutionId === institution.institutionId && employee.isLeader === true,
      );

      return {
        institutionId: institution.institutionId,
        institutionName: institution.institutionName,
        level: institution.level,
        location: institution.location,
        services: institution.services ?? [],
        leader: leaderEmployee
          ? {
              fullName: leaderEmployee.fullName,
              nationalId: leaderEmployee.nationalId,
              phone: leaderEmployee.phone,
              email: leaderEmployee.email,
              positionTitle: leaderEmployee.positionTitle,
              positionKinyarwanda: leaderEmployee.positionKinyarwanda,
              reportsTo: leaderEmployee.reportsTo,
              status: leaderEmployee.status,
            }
          : null,
      };
    })
    .sort((left, right) => left.institutionName.localeCompare(right.institutionName));

  return response.json({
    filters,
    count: leaders.length,
    items: leaders,
  });
});

router.get('/citizens', (request, response) => {
  const actor = resolveActor(request);
  if (!actor || actor.role !== 'national_admin') {
    return response.status(401).json({
      message: 'Only national admin can list citizens.',
    });
  }

  return response.json({
    items: registeredCitizens,
  });
});

export default router;
