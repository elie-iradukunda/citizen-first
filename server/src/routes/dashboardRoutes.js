import { Router } from 'express';
import { z } from 'zod';
import { complaints, escalations, institutions, officers } from '../data/mockData.js';
import {
  RWANDA_ADMINISTRATIVE_STRUCTURE,
  institutionEmployees,
  institutionInvites,
  registeredCitizens,
  registeredInstitutions,
  systemUsers,
} from '../data/registrationData.js';

const router = Router();
const OPEN_STATUSES = new Set(['submitted', 'in_review', 'escalated', 'responded']);
const DEMO_NOW = new Date('2026-04-03T12:00:00.000Z');
const NATIONAL_ROOT_ID = 'NATIONAL-PLATFORM';
const GOVERNANCE_LEVELS = ['village', 'cell', 'sector', 'district', 'province', 'national'];
const CITIZEN_LOCATION_LEVELS = ['province', 'district', 'sector', 'cell', 'village'];
const COMPLAINT_ESCALATION_FLOW = ['village', 'cell', 'sector', 'district', 'province', 'national'];
const ROLE_TO_LEVEL = {
  province_leader: 'province',
  district_leader: 'district',
  sector_leader: 'sector',
  cell_leader: 'cell',
  village_leader: 'village',
  institution_officer: 'district',
  national_admin: 'national',
  oversight_admin: 'national',
};
const CITIZEN_DASHBOARD_ROLES = new Set(['citizen']);
const OFFICER_DASHBOARD_ROLES = new Set([
  'institution_officer',
  'province_leader',
  'district_leader',
  'sector_leader',
  'cell_leader',
  'village_leader',
]);
const ADMIN_DASHBOARD_ROLES = new Set(['national_admin', 'oversight_admin']);
const CORRUPTION_CATEGORIES = new Set(['Bribery request', 'Unknown service fee']);
const ABUSE_CATEGORIES = new Set(['Abuse of authority']);
const FOLLOW_UP_CATEGORIES = new Set(['Missing response']);
const CITIZEN_ISSUE_TYPES = ['service_issue', 'corruption_issue'];
const NEXT_LEVEL_BY_ROLE = {
  national_admin: 'province',
  province_leader: 'district',
  district_leader: 'sector',
  sector_leader: 'cell',
  cell_leader: 'village',
  village_leader: null,
  institution_officer: null,
  oversight_admin: null,
};
const REPORT_LEVELS_FOR_CITIZEN = ['village', 'cell', 'sector', 'district', 'province', 'national'];
const citizenIssueNotifications = [];
const LEVEL_SCOPE = {
  national: ['province', 'district', 'sector', 'cell', 'village'],
  province: ['province', 'district'],
  district: ['district', 'sector'],
  sector: ['sector', 'cell'],
  cell: ['cell', 'village'],
  village: ['village'],
};
const LEVEL_MANAGEMENT_PLAYBOOK = {
  province: {
    title: 'Province Leadership Dashboard',
    scopeLabel: 'Province-wide governance supervision',
    responsibilities: [
      'Register and monitor district institutions under the province.',
      'Review overdue and escalated district complaints.',
      'Track district SLA performance and integrity alerts.',
    ],
    requiredDecisions: [
      'Approve district escalation interventions.',
      'Issue compliance directives to district leaders.',
      'Report critical trends to national oversight.',
    ],
  },
  district: {
    title: 'District Leadership Dashboard',
    scopeLabel: 'District operations and sector oversight',
    responsibilities: [
      'Invite and onboard sector institutions.',
      'Supervise sector complaint handling and deadlines.',
      'Coordinate investigation quality across sectors.',
    ],
    requiredDecisions: [
      'Assign high-risk complaints for immediate review.',
      'Escalate unresolved sector cases to province.',
      'Validate service-fee transparency compliance.',
    ],
  },
  sector: {
    title: 'Sector Leadership Dashboard',
    scopeLabel: 'Sector service quality and cell supervision',
    responsibilities: [
      'Invite and onboard cell institutions.',
      'Monitor cell-level complaint response timelines.',
      'Support cell teams on sensitive corruption cases.',
    ],
    requiredDecisions: [
      'Escalate unresolved cell complaints to district.',
      'Balance case workload across cell teams.',
      'Enforce citizen communication standards.',
    ],
  },
  cell: {
    title: 'Cell Leadership Dashboard',
    scopeLabel: 'Cell frontline complaint operations',
    responsibilities: [
      'Invite and onboard village institutions.',
      'Handle first-line complaints and provide timely responses.',
      'Maintain accurate citizen follow-up and evidence records.',
    ],
    requiredDecisions: [
      'Prioritize urgent complaints before SLA breach.',
      'Escalate unresolved cases to sector in time.',
      'Ensure each case has traceable response notes.',
    ],
  },
  village: {
    title: 'Village Leadership Dashboard',
    scopeLabel: 'Village-level citizen coordination',
    responsibilities: [
      'Support citizen reporting and route complaints correctly.',
      'Track open local complaints and status updates.',
      'Coordinate with cell office on unresolved citizen issues.',
    ],
    requiredDecisions: [
      'Identify cases needing immediate cell attention.',
      'Verify complaint details before escalation.',
      'Keep citizens informed on next steps.',
    ],
  },
  national: {
    title: 'National Oversight Operations',
    scopeLabel: 'Countrywide governance and integrity monitoring',
    responsibilities: [
      'Monitor institution performance across all levels.',
      'Track escalation trends and SLA compliance nationwide.',
      'Set policy direction for accountability and transparency.',
    ],
    requiredDecisions: [
      'Intervene on critical systemic integrity incidents.',
      'Authorize strategic corrective actions for provinces.',
      'Publish national governance quality reports.',
    ],
  },
};

function formatDateLabel(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function isOpenCase(item) {
  return OPEN_STATUSES.has(item.status);
}

function isOverdue(item) {
  return isOpenCase(item) && new Date(item.deadlineAt) < DEMO_NOW;
}

function getInstitutionName(id) {
  const mockInstitution = institutions.find((entry) => entry.id === id);
  if (mockInstitution) {
    return mockInstitution.name;
  }

  const registeredInstitution = registeredInstitutions.find(
    (entry) => entry.institutionId === id,
  );
  if (registeredInstitution) {
    return registeredInstitution.institutionName;
  }

  return 'Unknown institution';
}

function getOfficerName(id) {
  const mockOfficer = officers.find((entry) => entry.id === id);
  if (mockOfficer) {
    return mockOfficer.name;
  }

  const registeredEmployee = institutionEmployees.find(
    (entry) => entry.employeeId === id,
  );
  if (registeredEmployee) {
    return registeredEmployee.fullName;
  }

  const systemUser = systemUsers.find((entry) => entry.userId === id);
  if (systemUser) {
    return systemUser.fullName;
  }

  return 'Unassigned';
}

function getHoursBetween(start, end) {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60));
}

function getResolvedCases() {
  return complaints.filter((item) => item.status === 'resolved' && item.resolvedAt);
}

function resolveProvinceName(rawValue = '') {
  const value = titleCase(rawValue);
  if (!value) {
    return '';
  }

  const provinceMatch = RWANDA_ADMINISTRATIVE_STRUCTURE.find((entry) => {
    const provinceLabel = entry.province.toLowerCase();
    const candidate = value.toLowerCase();
    return provinceLabel === candidate || provinceLabel.replace(' province', '') === candidate;
  });

  if (provinceMatch) {
    return provinceMatch.province;
  }

  const districtMatch = RWANDA_ADMINISTRATIVE_STRUCTURE.find((entry) =>
    entry.districts.some((districtEntry) => districtEntry.district === value),
  );

  return districtMatch?.province ?? '';
}

function buildMockInstitutionLocation(institution) {
  const province = resolveProvinceName(institution?.district ?? '');
  const isProvinceLevel = institution?.level === 'province';

  return {
    province,
    district: isProvinceLevel ? '' : titleCase(institution?.district ?? ''),
    sector: '',
    cell: '',
    village: '',
  };
}

function getInstitutionAnalyticsMetadata(institutionId) {
  const mockInstitution = institutions.find((entry) => entry.id === institutionId);
  if (mockInstitution) {
    return {
      institutionId: mockInstitution.id,
      institution: mockInstitution.name,
      level: mockInstitution.level,
      location: buildMockInstitutionLocation(mockInstitution),
    };
  }

  const registeredInstitution = registeredInstitutions.find(
    (entry) => entry.institutionId === institutionId,
  );
  if (registeredInstitution) {
    return {
      institutionId: registeredInstitution.institutionId,
      institution: registeredInstitution.institutionName,
      level: registeredInstitution.level,
      location: registeredInstitution.location ?? {},
    };
  }

  return {
    institutionId,
    institution: 'Unknown institution',
    level: 'unknown',
    location: {},
  };
}

function getIssueClassification(category) {
  if (CORRUPTION_CATEGORIES.has(category)) {
    return {
      key: 'corruption_risk',
      label: 'Corruption risk',
      note: 'Bribery and unofficial fee complaints requiring integrity review.',
    };
  }

  if (ABUSE_CATEGORIES.has(category)) {
    return {
      key: 'authority_abuse',
      label: 'Authority abuse',
      note: 'Power misuse, intimidation, or unlawful service denial cases.',
    };
  }

  if (FOLLOW_UP_CATEGORIES.has(category)) {
    return {
      key: 'service_follow_up',
      label: 'Response gap',
      note: 'Missing response and communication breakdown complaints.',
    };
  }

  return {
    key: 'service_delivery',
    label: 'Service delivery',
    note: 'Operational delay and frontline service execution issues.',
  };
}

function normalizeLevel(level) {
  return GOVERNANCE_LEVELS.includes(level) ? level : 'district';
}

function resolveUserLevel(user) {
  return normalizeLevel(user?.level ?? ROLE_TO_LEVEL[user?.role] ?? 'district');
}

function getScopeLevels(level) {
  return LEVEL_SCOPE[level] ?? LEVEL_SCOPE.district;
}

function findRegisteredInstitutionById(institutionId) {
  return registeredInstitutions.find((entry) => entry.institutionId === institutionId) ?? null;
}

function getChildRegisteredInstitutions(parentInstitutionId) {
  return registeredInstitutions.filter(
    (entry) => entry.parentInstitutionId === parentInstitutionId,
  );
}

function getEmployeeCountForInstitution(institutionId) {
  return institutionEmployees.filter((entry) => entry.institutionId === institutionId).length;
}

function titleCase(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeLocationFilters(rawFilters = {}) {
  return {
    province: titleCase(rawFilters.province ?? ''),
    district: titleCase(rawFilters.district ?? ''),
    sector: titleCase(rawFilters.sector ?? ''),
    cell: titleCase(rawFilters.cell ?? ''),
    village: titleCase(rawFilters.village ?? ''),
  };
}

function matchesUserScope(user, location = {}) {
  if (!user) {
    return false;
  }

  if (user.role === 'national_admin' || user.role === 'oversight_admin') {
    return true;
  }

  const userLocation = user.location ?? {};
  if (user.role === 'province_leader') {
    return location.province === userLocation.province;
  }
  if (user.role === 'district_leader' || user.role === 'institution_officer') {
    return (
      location.province === userLocation.province &&
      location.district === userLocation.district
    );
  }
  if (user.role === 'sector_leader') {
    return (
      location.province === userLocation.province &&
      location.district === userLocation.district &&
      location.sector === userLocation.sector
    );
  }
  if (user.role === 'cell_leader') {
    return (
      location.province === userLocation.province &&
      location.district === userLocation.district &&
      location.sector === userLocation.sector &&
      location.cell === userLocation.cell
    );
  }
  if (user.role === 'village_leader') {
    return (
      location.province === userLocation.province &&
      location.district === userLocation.district &&
      location.sector === userLocation.sector &&
      location.cell === userLocation.cell &&
      location.village === userLocation.village
    );
  }

  return false;
}

function matchesLocationFilters(location = {}, filters = {}) {
  const keys = ['province', 'district', 'sector', 'cell', 'village'];
  return keys.every((key) => !filters[key] || location[key] === filters[key]);
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function filterInstitutionsForScope(user) {
  return registeredInstitutions.filter((institution) => {
    if (matchesUserScope(user, institution.location)) {
      return true;
    }

    if (user?.institutionId && institution.institutionId === user.institutionId) {
      return true;
    }

    return false;
  });
}

function buildExplorerOptions(scopedInstitutions, filters) {
  const provinces = uniqueSorted(scopedInstitutions.map((entry) => entry.location?.province));
  const districts = uniqueSorted(
    scopedInstitutions
      .filter((entry) => !filters.province || entry.location?.province === filters.province)
      .map((entry) => entry.location?.district),
  );
  const sectors = uniqueSorted(
    scopedInstitutions
      .filter(
        (entry) =>
          (!filters.province || entry.location?.province === filters.province) &&
          (!filters.district || entry.location?.district === filters.district),
      )
      .map((entry) => entry.location?.sector),
  );
  const cells = uniqueSorted(
    scopedInstitutions
      .filter(
        (entry) =>
          (!filters.province || entry.location?.province === filters.province) &&
          (!filters.district || entry.location?.district === filters.district) &&
          (!filters.sector || entry.location?.sector === filters.sector),
      )
      .map((entry) => entry.location?.cell),
  );
  const villages = uniqueSorted(
    scopedInstitutions
      .filter(
        (entry) =>
          (!filters.province || entry.location?.province === filters.province) &&
          (!filters.district || entry.location?.district === filters.district) &&
          (!filters.sector || entry.location?.sector === filters.sector) &&
          (!filters.cell || entry.location?.cell === filters.cell),
      )
      .map((entry) => entry.location?.village),
  );

  return {
    provinces,
    districts,
    sectors,
    cells,
    villages,
  };
}

function buildOfficerExplorer(user, rawFilters = {}) {
  const filters = normalizeLocationFilters(rawFilters);
  const scopedInstitutions = filterInstitutionsForScope(user);
  const filteredInstitutions = scopedInstitutions.filter((entry) =>
    matchesLocationFilters(entry.location, filters),
  );
  const institutionIds = new Set(filteredInstitutions.map((entry) => entry.institutionId));
  const employees = institutionEmployees.filter((entry) => institutionIds.has(entry.institutionId));
  const leaders = employees.filter((entry) => entry.isLeader === true);
  const workers = employees.filter((entry) => entry.isLeader !== true);
  const services = filteredInstitutions.flatMap((entry) =>
    (entry.services ?? []).map((service) => ({
      institutionId: entry.institutionId,
      institutionName: entry.institutionName,
      level: entry.level,
      location: entry.location,
      name: service.name,
      description: service.description ?? '',
    })),
  );

  const institutionsPayload = filteredInstitutions
    .slice()
    .sort((left, right) => left.institutionName.localeCompare(right.institutionName))
    .map((entry) => ({
      institutionId: entry.institutionId,
      institutionName: entry.institutionName,
      level: entry.level,
      location: entry.location,
      servicesCount: entry.services?.length ?? 0,
      employeeCount: getEmployeeCountForInstitution(entry.institutionId),
      expectedChildUnits: entry.expectedChildUnits ?? null,
      registeredChildUnits: getChildRegisteredInstitutions(entry.institutionId).length,
      childUnitLabel: entry.childUnitLabel ?? null,
    }));

  const options = buildExplorerOptions(scopedInstitutions, filters);

  return {
    generatedAt: new Date().toISOString(),
    filters,
    options,
    summary: {
      institutions: filteredInstitutions.length,
      districts: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.district)).length,
      sectors: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.sector)).length,
      cells: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.cell)).length,
      villages: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.village)).length,
      services: services.length,
      leaders: leaders.length,
      workers: workers.length,
    },
    coverage: {
      districts: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.district)),
      sectors: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.sector)),
      cells: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.cell)),
      villages: uniqueSorted(filteredInstitutions.map((entry) => entry.location?.village)),
    },
    institutions: institutionsPayload,
    services,
    leaders: leaders.map((entry) => ({
      employeeId: entry.employeeId,
      institutionId: entry.institutionId,
      institutionName:
        filteredInstitutions.find((item) => item.institutionId === entry.institutionId)
          ?.institutionName ?? 'Unknown institution',
      fullName: entry.fullName,
      nationalId: entry.nationalId,
      phone: entry.phone,
      email: entry.email,
      positionTitle: entry.positionTitle,
      positionKinyarwanda: entry.positionKinyarwanda,
      reportsTo: entry.reportsTo,
      status: entry.status,
    })),
    workers: workers.map((entry) => ({
      employeeId: entry.employeeId,
      institutionId: entry.institutionId,
      institutionName:
        filteredInstitutions.find((item) => item.institutionId === entry.institutionId)
          ?.institutionName ?? 'Unknown institution',
      fullName: entry.fullName,
      nationalId: entry.nationalId,
      phone: entry.phone,
      email: entry.email,
      positionTitle: entry.positionTitle,
      reportsTo: entry.reportsTo,
      status: entry.status,
    })),
  };
}

const citizenComplaintImageSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    type: z.string().trim().startsWith('image/'),
    size: z.number().int().positive().max(2 * 1024 * 1024),
    dataUrl: z.string().startsWith('data:image/').max(4_000_000),
  });

const citizenVoiceNoteSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.string().trim().startsWith('audio/'),
  size: z.number().int().positive().max(4 * 1024 * 1024),
  durationSeconds: z.number().int().positive().max(180),
  dataUrl: z.string().startsWith('data:audio/').max(8_000_000),
});

const citizenComplaintSubmissionSchema = z
  .object({
    issueType: z.enum(CITIZEN_ISSUE_TYPES).default('service_issue'),
    category: z.string().min(3).max(120),
    message: z.string().min(20).max(3000),
    reportingMode: z.enum(['anonymous', 'verified']).default('verified'),
    submittedVia: z.enum(['dashboard', 'qr']).default('dashboard'),
    sourceInstitutionSlug: z.string().trim().min(2).optional(),
    serviceName: z.string().trim().max(160).optional(),
    targetLeaderEmployeeId: z.string().min(4).optional(),
    accusedLeaderEmployeeIds: z.array(z.string().min(4)).max(5).optional(),
    evidenceImage: citizenComplaintImageSchema.optional(),
    voiceNote: citizenVoiceNoteSchema.optional(),
  })
  .superRefine((payload, context) => {
    if (payload.issueType === 'service_issue' && !payload.targetLeaderEmployeeId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Receiving leader is required for service issues.',
        path: ['targetLeaderEmployeeId'],
      });
    }

    if (
      payload.issueType === 'corruption_issue' &&
      (!Array.isArray(payload.accusedLeaderEmployeeIds) || payload.accusedLeaderEmployeeIds.length === 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one leader being reported for corruption.',
        path: ['accusedLeaderEmployeeIds'],
      });
    }
  });

const citizenResponseSchema = z.object({
  message: z.string().min(12).max(2000),
  actionTaken: z.string().min(3).max(160).optional(),
});

const citizenDecisionSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

function getClientBaseUrl() {
  return process.env.CLIENT_URL ?? 'http://localhost:5173';
}

function buildCitizenDashboardReportUrl(slug) {
  const redirectPath = encodeURIComponent(`/dashboard/citizen/submit?institution=${slug}&source=qr`);
  return `${getClientBaseUrl()}/login?redirect=${redirectPath}`;
}

function buildCitizenLocationOptions(filters = {}) {
  const province = titleCase(filters.province ?? '');
  const district = titleCase(filters.district ?? '');
  const sector = titleCase(filters.sector ?? '');
  const cell = titleCase(filters.cell ?? '');

  const staticProvinces = RWANDA_ADMINISTRATIVE_STRUCTURE.map((entry) => entry.province);
  const staticDistricts = province
    ? RWANDA_ADMINISTRATIVE_STRUCTURE.find((entry) => entry.province === province)?.districts.map(
        (entry) => entry.district,
      ) ?? []
    : RWANDA_ADMINISTRATIVE_STRUCTURE.flatMap((entry) => entry.districts.map((item) => item.district));
  const staticSectors =
    province && district
      ? RWANDA_ADMINISTRATIVE_STRUCTURE.find((entry) => entry.province === province)?.districts.find(
          (entry) => entry.district === district,
        )?.sectors.map((entry) => entry.sector) ?? []
      : [];
  const staticCells =
    province && district && sector
      ? RWANDA_ADMINISTRATIVE_STRUCTURE.find((entry) => entry.province === province)?.districts.find(
          (entry) => entry.district === district,
        )?.sectors.find((entry) => entry.sector === sector)?.cells.map((entry) => entry.cell) ?? []
      : [];
  const staticVillages =
    province && district && sector && cell
      ? RWANDA_ADMINISTRATIVE_STRUCTURE.find((entry) => entry.province === province)?.districts.find(
          (entry) => entry.district === district,
        )?.sectors.find((entry) => entry.sector === sector)?.cells.find((entry) => entry.cell === cell)
          ?.villages ?? []
      : [];

  const registeredProvinces = registeredInstitutions.map((entry) => entry.location?.province);
  const registeredDistricts = registeredInstitutions
    .filter((entry) => !province || entry.location?.province === province)
    .map((entry) => entry.location?.district);
  const registeredSectors = registeredInstitutions
    .filter(
      (entry) =>
        (!province || entry.location?.province === province) &&
        (!district || entry.location?.district === district),
    )
    .map((entry) => entry.location?.sector);
  const registeredCells = registeredInstitutions
    .filter(
      (entry) =>
        (!province || entry.location?.province === province) &&
        (!district || entry.location?.district === district) &&
        (!sector || entry.location?.sector === sector),
    )
    .map((entry) => entry.location?.cell);
  const registeredVillages = registeredInstitutions
    .filter(
      (entry) =>
        (!province || entry.location?.province === province) &&
        (!district || entry.location?.district === district) &&
        (!sector || entry.location?.sector === sector) &&
        (!cell || entry.location?.cell === cell),
    )
    .map((entry) => entry.location?.village);

  return {
    provinces: uniqueSorted([...staticProvinces, ...registeredProvinces]),
    districts: uniqueSorted([...staticDistricts, ...registeredDistricts]),
    sectors: uniqueSorted([...staticSectors, ...registeredSectors]),
    cells: uniqueSorted([...staticCells, ...registeredCells]),
    villages: uniqueSorted([...staticVillages, ...registeredVillages]),
  };
}

function findRegisteredInstitutionBySlug(slug) {
  return registeredInstitutions.find((entry) => entry.slug === slug) ?? null;
}

function getCitizenRecordForUser(user) {
  if (!user?.nationalId) {
    return null;
  }

  return registeredCitizens.find((entry) => entry.nationalId === user.nationalId) ?? null;
}

function buildCitizenReporterProfile(user) {
  const citizenRecord = getCitizenRecordForUser(user);

  return {
    citizenId: citizenRecord?.citizenId ?? null,
    fullName: user?.fullName ?? citizenRecord?.fullName ?? 'Unknown citizen',
    nationalId: user?.nationalId ?? citizenRecord?.nationalId ?? null,
    phone: user?.phone ?? citizenRecord?.phone ?? null,
    email: user?.email ?? citizenRecord?.email ?? null,
    location: user?.location ?? citizenRecord?.location ?? null,
  };
}

function findLeaderEmployeeByUser(user) {
  if (!user?.nationalId) {
    return null;
  }

  return (
    institutionEmployees.find(
      (entry) =>
        entry.isLeader === true &&
        entry.nationalId === user.nationalId &&
        entry.institutionId === user.institutionId,
    ) ?? null
  );
}

function findLeaderUserByEmployeeId(employeeId) {
  const employee = institutionEmployees.find(
    (entry) => entry.employeeId === employeeId && entry.isLeader === true,
  );
  if (!employee) {
    return null;
  }

  const user = systemUsers.find(
    (entry) =>
      entry.nationalId &&
      employee.nationalId &&
      entry.nationalId === employee.nationalId &&
      entry.institutionId === employee.institutionId,
  );
  if (!user) {
    return null;
  }

  return {
    user,
    employee,
  };
}

function normalizeCitizenService(service, index = 0) {
  const feeType = service.feeType ?? (index % 3 === 0 ? 'paid' : 'free');
  const officialFeeRwf =
    typeof service.officialFeeRwf === 'number'
      ? service.officialFeeRwf
      : feeType === 'paid'
        ? (index + 1) * 1000
        : 0;

  return {
    name: service.name,
    description: service.description ?? '',
    feeType,
    officialFeeRwf,
    accessNote:
      service.accessNote ??
      (feeType === 'paid'
        ? 'Use only official receipted payment channels for this service.'
        : 'This service should be offered without any unofficial payment.'),
  };
}

function getLeaderChainByCitizenLocation(location = {}) {
  const levels = ['village', 'cell', 'sector', 'district', 'province'];

  return levels
    .map((level) => {
      const institution = registeredInstitutions.find((entry) => {
        if (entry.level !== level) {
          return false;
        }

        if (entry.location?.province !== location.province) {
          return false;
        }
        if (['district', 'sector', 'cell', 'village'].includes(level) && entry.location?.district !== location.district) {
          return false;
        }
        if (['sector', 'cell', 'village'].includes(level) && entry.location?.sector !== location.sector) {
          return false;
        }
        if (['cell', 'village'].includes(level) && entry.location?.cell !== location.cell) {
          return false;
        }
        if (level === 'village' && entry.location?.village !== location.village) {
          return false;
        }
        return true;
      });

      if (!institution) {
        return null;
      }

      const leader = institutionEmployees.find(
        (employee) =>
          employee.institutionId === institution.institutionId && employee.isLeader === true,
      );

      return {
        level,
        slug: institution.slug,
        institutionId: institution.institutionId,
        institutionName: institution.institutionName,
        officeAddress: institution.officeAddress ?? null,
        officialEmail: institution.officialEmail ?? null,
        officialPhone: institution.officialPhone ?? null,
        location: institution.location,
        reportUrl: buildCitizenDashboardReportUrl(institution.slug),
        qrCodeDataUrl: institution.qrCodeDataUrl ?? null,
        services: (institution.services ?? []).map((service, index) =>
          normalizeCitizenService(service, index),
        ),
        leader: leader
          ? {
              employeeId: leader.employeeId,
              fullName: leader.fullName,
              nationalId: leader.nationalId,
              phone: leader.phone,
              email: leader.email,
              positionTitle: leader.positionTitle,
              positionKinyarwanda: leader.positionKinyarwanda,
              reportsTo: leader.reportsTo,
              description: leader.description ?? '',
            }
          : null,
      };
    })
    .filter(Boolean);
}

function findLeaderChainEntryByLevel(leaderChain = [], level) {
  return leaderChain.find((entry) => entry.level === level && entry.leader) ?? null;
}

function findLeaderChainEntryByEmployeeId(leaderChain = [], employeeId) {
  return leaderChain.find((entry) => entry.leader?.employeeId === employeeId) ?? null;
}

function getNextEscalationLevel(level) {
  const index = COMPLAINT_ESCALATION_FLOW.indexOf(level);
  if (index === -1 || index >= COMPLAINT_ESCALATION_FLOW.length - 1) {
    return null;
  }

  return COMPLAINT_ESCALATION_FLOW[index + 1];
}

function getReviewLevelForAccusedLeaders(accusedEntries = []) {
  const indexes = accusedEntries
    .map((entry) => COMPLAINT_ESCALATION_FLOW.indexOf(entry.level))
    .filter((value) => value >= 0);

  if (indexes.length === 0) {
    return null;
  }

  const highestAccusedLevelIndex = Math.max(...indexes);
  return COMPLAINT_ESCALATION_FLOW[highestAccusedLevelIndex + 1] ?? null;
}

function getComplaintLocation(item) {
  return item.location ?? getInstitutionAnalyticsMetadata(item.institutionId).location ?? {};
}

function addWorkingDays(dateInput, workingDaysToAdd) {
  const date = new Date(dateInput);
  let remaining = workingDaysToAdd;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    if (!isWeekend) {
      remaining -= 1;
    }
  }

  return date;
}

function getCitizenReference(user) {
  return user?.citizenId ?? user?.userId?.replace('USR-', 'CID-') ?? `CID-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

function serializeLeaderChainEntry(entry) {
  return {
    level: entry.level,
    institutionId: entry.institutionId,
    institutionName: entry.institutionName,
    leaderName: entry.leader?.fullName ?? 'Unknown leader',
    leaderEmployeeId: entry.leader?.employeeId ?? null,
    positionTitle: entry.leader?.positionTitle ?? null,
  };
}

function buildComplaintSummary(item) {
  const sourceInstitution =
    item.sourceInstitutionId || item.sourceInstitutionName
      ? {
          institutionId: item.sourceInstitutionId ?? null,
          slug: item.sourceInstitutionSlug ?? null,
          institutionName: item.sourceInstitutionName ?? getInstitutionName(item.sourceInstitutionId),
          serviceName: item.serviceName ?? null,
        }
      : null;

  return {
    id: item.id,
    issueType: item.issueType ?? 'service_issue',
    category: item.category,
    status: item.status,
    currentLevel: item.currentLevel,
    institution: getInstitutionName(item.institutionId),
    assignedOfficer: getOfficerName(item.assignedOfficerId),
    message: item.message,
    submittedAt: item.submittedAt,
    updatedAt: item.updatedAt,
    deadlineAt: item.deadlineAt,
    citizenReference: item.citizenReference ?? null,
    reportingMode: item.reportingMode ?? 'verified',
    submittedVia: item.submittedVia ?? 'dashboard',
    response: item.response ?? null,
    responses: item.responses ?? [],
    feedbackStatus: item.feedbackStatus ?? null,
    reporterProfile: item.reporterProfile ?? null,
    accusedLeaders: item.accusedLeaders ?? [],
    evidenceImage: item.evidenceImage ?? null,
    voiceNote: item.voiceNote ?? null,
    sourceInstitution,
    location: getComplaintLocation(item),
    escalationHistory: escalations
      .filter((entry) => entry.complaintId === item.id)
      .map((entry) => ({
        fromLevel: entry.fromLevel,
        toLevel: entry.toLevel,
        reason: entry.reason,
        escalatedAt: entry.escalatedAt,
      })),
    canAcceptFeedback: item.status === 'responded',
    canEscalate:
      item.status === 'responded' && Boolean(getNextEscalationLevel(item.currentLevel)),
    nextEscalationLevel: getNextEscalationLevel(item.currentLevel),
  };
}

function matchesCitizenHierarchyScope(location = {}, filters = {}) {
  if (filters.province && location.province !== filters.province) {
    return false;
  }

  const scopedKeys = ['district', 'sector', 'cell', 'village'];
  return scopedKeys.every((key) => !location[key] || !filters[key] || location[key] === filters[key]);
}

function buildInstitutionHelpLeader(institution) {
  const leader = institutionEmployees.find(
    (employee) => employee.institutionId === institution.institutionId && employee.isLeader === true,
  );

  if (!leader) {
    return null;
  }

  return {
    employeeId: leader.employeeId,
    fullName: leader.fullName,
    nationalId: leader.nationalId,
    phone: leader.phone,
    email: leader.email,
    positionTitle: leader.positionTitle,
    positionKinyarwanda: leader.positionKinyarwanda,
    reportsTo: leader.reportsTo,
    description: leader.description ?? '',
  };
}

function buildCitizenInstitutionEntry(institution) {
  const helpLeader = buildInstitutionHelpLeader(institution);

  return {
    institutionId: institution.institutionId,
    institutionSlug: institution.slug,
    institutionName: institution.institutionName,
    level: institution.level,
    location: institution.location,
    officeAddress: institution.officeAddress ?? null,
    officialEmail: institution.officialEmail ?? null,
    officialPhone: institution.officialPhone ?? null,
    servicesCount: institution.services?.length ?? 0,
    services: (institution.services ?? []).map((service, index) => normalizeCitizenService(service, index)),
    helpLeader,
    reportUrl: buildCitizenDashboardReportUrl(institution.slug),
    institutionQrCodeDataUrl: institution.qrCodeDataUrl ?? null,
  };
}

function buildComplaintTargetLeaders(leaderChain = [], institutionEntries = [], selectedInstitution = null) {
  const targets = new Map();
  const addTarget = (entry) => {
    if (!entry?.leader?.employeeId || targets.has(entry.leader.employeeId)) {
      return;
    }

    targets.set(entry.leader.employeeId, {
      level: entry.level,
      institutionId: entry.institutionId,
      institutionName: entry.institutionName,
      institutionSlug: entry.slug ?? entry.institutionSlug ?? null,
      leader: entry.leader,
    });
  };

  leaderChain.forEach(addTarget);
  institutionEntries.forEach((entry) => {
    if (!entry.helpLeader) {
      return;
    }

    addTarget({
      level: entry.level,
      institutionId: entry.institutionId,
      institutionName: entry.institutionName,
      institutionSlug: entry.institutionSlug,
      leader: entry.helpLeader,
    });
  });

  if (selectedInstitution?.helpLeader) {
    addTarget({
      level: selectedInstitution.level,
      institutionId: selectedInstitution.institutionId,
      institutionName: selectedInstitution.institutionName,
      institutionSlug: selectedInstitution.institutionSlug,
      leader: selectedInstitution.helpLeader,
    });
  }

  return [...targets.values()];
}

function findSystemUserByAssignmentId(assignmentId) {
  if (!assignmentId) {
    return null;
  }

  const directUser = systemUsers.find((entry) => entry.userId === assignmentId);
  if (directUser) {
    return directUser;
  }

  const employee = institutionEmployees.find((entry) => entry.employeeId === assignmentId);
  if (!employee?.nationalId) {
    return null;
  }

  return (
    systemUsers.find(
      (entry) =>
        entry.nationalId === employee.nationalId &&
        entry.institutionId === employee.institutionId,
    ) ?? null
  );
}

function buildNationalReviewDestination() {
  const nationalUser =
    systemUsers.find((entry) => entry.role === 'national_admin') ??
    systemUsers.find((entry) => ADMIN_DASHBOARD_ROLES.has(entry.role)) ??
    null;

  if (!nationalUser) {
    return null;
  }

  return {
    level: 'national',
    slug: 'national-governance-platform',
    institutionId: NATIONAL_ROOT_ID,
    institutionName: 'National Governance Platform',
    officeAddress: 'National governance command center',
    officialEmail: nationalUser.email ?? null,
    officialPhone: nationalUser.phone ?? null,
    location: {
      country: 'Rwanda',
    },
    reportUrl: null,
    qrCodeDataUrl: null,
    leader: {
      employeeId: nationalUser.userId,
      fullName: nationalUser.fullName,
      nationalId: nationalUser.nationalId ?? null,
      phone: nationalUser.phone ?? null,
      email: nationalUser.email ?? null,
      positionTitle: 'National Admin',
      positionKinyarwanda: '',
      reportsTo: 'National governance command',
      description: 'National oversight and final review for escalated citizen complaints.',
    },
  };
}

function getDestinationForLevel(level, location = {}, leaderChain = getLeaderChainByCitizenLocation(location)) {
  if (level === 'national') {
    return buildNationalReviewDestination();
  }

  return findLeaderChainEntryByLevel(leaderChain, level);
}

function notifyComplaintRecipient(recipientId, complaintRecord, message) {
  const recipientUser = findSystemUserByAssignmentId(recipientId);
  if (!recipientUser) {
    return;
  }

  citizenIssueNotifications.unshift({
    id: `NTF-${String(citizenIssueNotifications.length + 1).padStart(5, '0')}`,
    userId: recipientUser.userId,
    complaintId: complaintRecord.id,
    complaintLevel: complaintRecord.currentLevel,
    message,
    status: 'unread',
    createdAt: new Date().toISOString(),
    leaderEmployeeId: recipientId,
  });
}

function buildCitizenExplorer(rawFilters = {}) {
  const filters = normalizeLocationFilters(rawFilters);
  const selectedInstitution = rawFilters.institutionSlug
    ? findRegisteredInstitutionBySlug(rawFilters.institutionSlug)
    : null;
  const filteredInstitutions = registeredInstitutions.filter((entry) =>
    matchesCitizenHierarchyScope(entry.location, filters),
  );
  const institutionDirectory = filteredInstitutions
    .slice()
    .sort((left, right) => left.institutionName.localeCompare(right.institutionName))
    .map((entry) => buildCitizenInstitutionEntry(entry));
  const options = buildCitizenLocationOptions(filters);
  const leaderChain = getLeaderChainByCitizenLocation(filters);
  const selectedInstitutionEntry = selectedInstitution
    ? buildCitizenInstitutionEntry(selectedInstitution)
    : null;
  const services = institutionDirectory.flatMap((entry) =>
    entry.services.map((service) => ({
      institutionId: entry.institutionId,
      institutionSlug: entry.institutionSlug,
      institutionName: entry.institutionName,
      level: entry.level,
      location: entry.location,
      officeAddress: entry.officeAddress,
      name: service.name,
      description: service.description,
      feeType: service.feeType,
      officialFeeRwf: service.officialFeeRwf,
      accessNote: service.accessNote,
      helpLeader: entry.helpLeader,
      reportUrl: entry.reportUrl,
      institutionQrCodeDataUrl: entry.institutionQrCodeDataUrl,
    })),
  );
  const complaintTargetLeaders = buildComplaintTargetLeaders(
    leaderChain,
    institutionDirectory,
    selectedInstitutionEntry,
  );
  const accusedLeaderOptions = leaderChain
    .filter((entry) => entry.leader)
    .map((entry) => ({
      level: entry.level,
      institutionId: entry.institutionId,
      institutionName: entry.institutionName,
      leader: entry.leader,
    }));

  return {
    generatedAt: new Date().toISOString(),
    filters,
    options,
    summary: {
      institutions: filteredInstitutions.length,
      services: services.length,
      leaders: leaderChain.filter((entry) => entry.leader).length,
    },
    services,
    institutionDirectory,
    selectedInstitution: selectedInstitutionEntry,
    leaderChain,
    accusedLeaderOptions,
    complaintTargetLeaders,
    complaintRoutingGuide: {
      serviceIssue:
        'Choose the service institution or the public leader who should respond first. A response is expected within 3 working days.',
      corruptionIssue:
        'Choose the accused leader. The report is automatically routed to the next higher level for independent review.',
      escalationWindow:
        'If there is no response in 3 working days the case escalates automatically. If you receive feedback and are not satisfied, you can escalate it yourself.',
    },
  };
}

function synchronizeCitizenWorkflowComplaints() {
  const now = new Date();

  complaints.forEach((item) => {
    if (!item.autoEscalateEnabled) {
      return;
    }

    if (item.status === 'resolved' || item.status === 'responded') {
      return;
    }

    if (new Date(item.deadlineAt) >= now) {
      return;
    }

    const leaderChain = getLeaderChainByCitizenLocation(getComplaintLocation(item));
    const nextLevel = getNextEscalationLevel(item.currentLevel);
    const destination = getDestinationForLevel(nextLevel, getComplaintLocation(item), leaderChain);
    if (!nextLevel || !destination?.leader?.employeeId) {
      return;
    }

    const fromLevel = item.currentLevel;
    item.status = 'escalated';
    item.currentLevel = nextLevel;
    item.institutionId = destination.institutionId;
    item.assignedOfficerId = destination.leader.employeeId;
    item.updatedAt = now.toISOString();
    item.deadlineAt = addWorkingDays(now, 3).toISOString();
    item.escalatedReason = 'Automatic escalation after 3 working days without citizen feedback.';

    escalations.unshift({
      id: escalations.length + 1,
      complaintId: item.id,
      fromLevel,
      toLevel: nextLevel,
      reason: item.escalatedReason,
      escalatedAt: now.toISOString(),
    });

    notifyComplaintRecipient(
      destination.leader.employeeId,
      item,
      `Citizen issue auto-escalated to ${nextLevel} after missed response deadline.`,
    );
  });
}

function buildRegisteredHierarchyStats() {
  const byLevel = {
    province: 0,
    district: 0,
    sector: 0,
    cell: 0,
    village: 0,
  };

  for (const institution of registeredInstitutions) {
    if (institution.level in byLevel) {
      byLevel[institution.level] += 1;
    }
  }

  return {
    totalInstitutions: registeredInstitutions.length,
    byLevel,
    registeredProvinces: getChildRegisteredInstitutions(NATIONAL_ROOT_ID).length,
    expectedProvinces: RWANDA_ADMINISTRATIVE_STRUCTURE.length,
  };
}

function buildInstitutionManagementSummary(user) {
  const level = resolveUserLevel(user);

  if (level === 'national') {
    const provinces = getChildRegisteredInstitutions(NATIONAL_ROOT_ID).sort((left, right) =>
      left.institutionName.localeCompare(right.institutionName),
    );

    return {
      hasInstitutionRecord: true,
      institutionId: NATIONAL_ROOT_ID,
      institutionName: 'National Governance Platform',
      level: 'national',
      expectedChildUnits: RWANDA_ADMINISTRATIVE_STRUCTURE.length,
      registeredChildUnits: provinces.length,
      childUnitLabel: 'provinces',
      services: [],
      servicesCount: 0,
      employeeCount: institutionEmployees.length,
      children: provinces.map((item) => ({
        institutionId: item.institutionId,
        institutionName: item.institutionName,
        level: item.level,
        location: item.location,
        expectedChildUnits: item.expectedChildUnits ?? null,
        registeredChildUnits: getChildRegisteredInstitutions(item.institutionId).length,
        childUnitLabel: item.childUnitLabel ?? null,
        servicesCount: item.services?.length ?? 0,
        employeeCount: item.employeeCount ?? getEmployeeCountForInstitution(item.institutionId),
      })),
    };
  }

  const institution = findRegisteredInstitutionById(user?.institutionId);
  if (!institution) {
    return {
      hasInstitutionRecord: false,
      institutionId: user?.institutionId ?? null,
      institutionName: 'Institution not yet registered',
      level,
      expectedChildUnits: null,
      registeredChildUnits: 0,
      childUnitLabel: null,
      services: [],
      servicesCount: 0,
      employeeCount: 0,
      children: [],
    };
  }

  const children = getChildRegisteredInstitutions(institution.institutionId).sort((left, right) =>
    left.institutionName.localeCompare(right.institutionName),
  );

  return {
    hasInstitutionRecord: true,
    institutionId: institution.institutionId,
    institutionName: institution.institutionName,
    level: institution.level,
    location: institution.location,
    expectedChildUnits: institution.expectedChildUnits ?? null,
    registeredChildUnits: children.length,
    childUnitLabel: institution.childUnitLabel ?? null,
    services: institution.services ?? [],
    servicesCount: institution.services?.length ?? 0,
    employeeCount: institution.employeeCount ?? getEmployeeCountForInstitution(institution.institutionId),
    children: children.map((item) => ({
      institutionId: item.institutionId,
      institutionName: item.institutionName,
      level: item.level,
      location: item.location,
      expectedChildUnits: item.expectedChildUnits ?? null,
      registeredChildUnits: getChildRegisteredInstitutions(item.institutionId).length,
      childUnitLabel: item.childUnitLabel ?? null,
      servicesCount: item.services?.length ?? 0,
      employeeCount: item.employeeCount ?? getEmployeeCountForInstitution(item.institutionId),
    })),
  };
}

function buildManagerProfile(user, queueSize, escalationsSize) {
  const level = resolveUserLevel(user);
  const playbook = LEVEL_MANAGEMENT_PLAYBOOK[level] ?? LEVEL_MANAGEMENT_PLAYBOOK.district;
  const nextInviteLevel = NEXT_LEVEL_BY_ROLE[user?.role] ?? null;

  return {
    level,
    role: user?.role ?? 'institution_officer',
    title: playbook.title,
    scopeLabel: playbook.scopeLabel,
    nextInviteLevel,
    responsibilities: playbook.responsibilities,
    requiredDecisions: playbook.requiredDecisions,
    responseWindow: '3 working days per level',
    queueSize,
    escalationsSize,
  };
}

function buildCitizenDashboard(user) {
  synchronizeCitizenWorkflowComplaints();

  const reporterProfile = buildCitizenReporterProfile(user);
  const citizenLocation = reporterProfile.location ?? user?.location ?? {};
  const leaderChain = getLeaderChainByCitizenLocation(citizenLocation);
  const citizenCases = complaints
    .filter((item) => item.reporterUserId === user?.userId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const resolvedCases = citizenCases.filter((item) => item.status === 'resolved');
  const totalResolutionHours = resolvedCases.reduce(
    (accumulator, item) => accumulator + getHoursBetween(item.submittedAt, item.resolvedAt),
    0,
  );
  const averageResolutionHours =
    resolvedCases.length > 0 ? Math.round(totalResolutionHours / resolvedCases.length) : 0;

  return {
    role: 'citizen',
    generatedAt: new Date().toISOString(),
    profile: reporterProfile,
    leadershipChain: leaderChain.map((entry) => ({
      level: entry.level,
      institutionName: entry.institutionName,
      leader: entry.leader,
      officeAddress: entry.officeAddress,
      officialEmail: entry.officialEmail,
      officialPhone: entry.officialPhone,
    })),
    kpis: [
      {
        label: 'Open cases',
        value: citizenCases.filter(isOpenCase).length,
        note: 'Active reports still in progress',
      },
      {
        label: 'Resolved cases',
        value: resolvedCases.length,
        note: 'Cases closed with citizen feedback',
      },
      {
        label: 'Escalated cases',
        value: citizenCases.filter((item) => item.status === 'escalated').length,
        note: 'Moved to higher authority after deadline',
      },
      {
        label: 'Average resolution',
        value: `${averageResolutionHours} hrs`,
        note: 'Typical closure time for resolved records',
      },
    ],
    cases: citizenCases.map((item) => buildComplaintSummary(item)),
    timeline: citizenCases.slice(0, 5).map((item) => ({
      title: `${item.id} updated`,
      detail: item.response
        ? `${item.response.respondedByName} responded at ${item.response.level} level.`
        : item.status === 'resolved'
          ? 'Resolution completed and feedback accepted by citizen.'
          : item.status === 'escalated'
            ? 'Case moved to the next governance level for review.'
            : 'Case is still being reviewed by the assigned institution.',
      time: formatDateLabel(item.updatedAt),
    })),
    awareness: [
      {
        title: 'Verified identity follows the case',
        description:
          'Your citizen ID, phone, email, and village location are attached internally for accountable follow-up.',
      },
      {
        title: 'Corruption goes to the next level',
        description:
          'If you accuse a village leader, the complaint is routed to cell review. The same pattern applies up the hierarchy.',
      },
      {
        title: 'Escalation stays visible',
        description:
          'If no feedback comes within 3 working days the case escalates automatically. If feedback is unsatisfactory, you can escalate it yourself.',
      },
    ],
  };
}

function canUserRespondToComplaint(user, complaint) {
  if (!user || !complaint) {
    return false;
  }

  if (complaint.status === 'resolved' || complaint.status === 'responded') {
    return false;
  }

  if (ADMIN_DASHBOARD_ROLES.has(user.role)) {
    return complaint.assignedOfficerId === user.userId;
  }

  const currentLeaderEmployee = findLeaderEmployeeByUser(user);
  if (currentLeaderEmployee?.employeeId && complaint.assignedOfficerId === currentLeaderEmployee.employeeId) {
    return true;
  }

  if (user.role === 'institution_officer') {
    return (
      complaint.institutionId === user.institutionId ||
      matchesUserScope(user, getComplaintLocation(complaint))
    );
  }

  return false;
}

function buildOfficerDashboard(user) {
  synchronizeCitizenWorkflowComplaints();

  const openQueue = complaints
    .filter(isOpenCase)
    .sort((a, b) => new Date(a.deadlineAt) - new Date(b.deadlineAt));
  const level = resolveUserLevel(user);
  const scopedLevels = new Set(getScopeLevels(level));
  const currentLeaderEmployee = findLeaderEmployeeByUser(user);
  const scopedQueueRaw = openQueue.filter((item) => {
    const withinLevel = scopedLevels.has(item.currentLevel);
    if (!withinLevel) {
      return false;
    }

    if (currentLeaderEmployee?.employeeId && item.assignedOfficerId === currentLeaderEmployee.employeeId) {
      return true;
    }

    if (item.assignedOfficerId === user?.userId) {
      return true;
    }

    return matchesUserScope(user, getComplaintLocation(item));
  });
  const scopedQueue = scopedQueueRaw.slice(0, 8);

  const queue = scopedQueue.map((item) => {
    const hoursToDeadline = getHoursBetween(DEMO_NOW, item.deadlineAt);
    const priority =
      isOverdue(item) || hoursToDeadline <= 12 ? 'high' : hoursToDeadline <= 30 ? 'medium' : 'normal';
    const summary = buildComplaintSummary(item);

    return {
      ...summary,
      taggedLeaderEmployeeIds: item.taggedLeaderEmployeeIds ?? [],
      priority,
      canRespond: canUserRespondToComplaint(user, item),
    };
  });

  const sevenDaysAgo = new Date(DEMO_NOW.getTime() - 7 * 24 * 60 * 60 * 1000);
  const scopedOfficerPool = officers.filter(
    (officer) =>
      scopedLevels.has(officer.level) &&
      matchesUserScope(user, getInstitutionAnalyticsMetadata(officer.institutionId).location),
  );
  const workload = scopedOfficerPool.map((officer) => {
    const assigned = complaints.filter((item) => item.assignedOfficerId === officer.id);
    const activeCases = assigned.filter(isOpenCase).length;
    const resolvedThisWeek = assigned.filter(
      (item) =>
        item.status === 'resolved' &&
        item.resolvedAt &&
        new Date(item.resolvedAt) >= sevenDaysAgo,
    ).length;

    return {
      officerName: officer.name,
      level: officer.level,
      activeCases,
      resolvedThisWeek,
      capacityUsage: Math.min(100, Math.round((activeCases / 6) * 100)),
    };
  });

  const categoryCountMap = scopedQueue.reduce((accumulator, item) => {
    accumulator[item.category] = (accumulator[item.category] ?? 0) + 1;
    return accumulator;
  }, {});
  const managerProfile = buildManagerProfile(user, scopedQueue.length, escalations.length);
  const institutionManagement = buildInstitutionManagementSummary(user);
  const taggedIssues =
    currentLeaderEmployee
      ? complaints
          .filter((item) =>
            item.assignedOfficerId === currentLeaderEmployee.employeeId ||
            (Array.isArray(item.taggedLeaderEmployeeIds)
              ? item.taggedLeaderEmployeeIds.includes(currentLeaderEmployee.employeeId)
              : false),
          )
          .sort((left, right) => new Date(right.submittedAt) - new Date(left.submittedAt))
      : [];
  const notifications = citizenIssueNotifications
    .filter((item) => item.userId === user?.userId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return {
    role: 'officer',
    level,
    managerProfile,
    institutionManagement,
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        label: 'Assigned queue',
        value: scopedQueue.length,
        note: `Open complaints in ${managerProfile.scopeLabel.toLowerCase()}`,
      },
      {
        label: 'Overdue cases',
        value: scopedQueue.filter(isOverdue).length,
        note: 'Missed SLA and needs immediate review',
      },
      {
        label: 'Resolved this week',
        value: getResolvedCases().filter(
          (item) => new Date(item.resolvedAt) >= sevenDaysAgo,
        ).length,
        note: 'Completed with verified follow-up',
      },
      {
        label: 'Escalation watch',
        value: escalations.length,
        note: 'Cases moved upward for oversight',
      },
    ],
    queue,
    workload,
    escalationWatch: escalations
      .filter((entry) => scopedLevels.has(entry.toLevel) || scopedLevels.has(entry.fromLevel))
      .map((entry) => {
        const complaint = complaints.find((item) => item.id === entry.complaintId);

        return {
          complaintId: entry.complaintId,
          fromLevel: entry.fromLevel,
          toLevel: entry.toLevel,
          reason: entry.reason,
          institution: complaint ? getInstitutionName(complaint.institutionId) : 'Unknown institution',
          escalatedAt: entry.escalatedAt,
        };
      }),
    citizenTaggedIssues: taggedIssues.slice(0, 10).map((item) => ({
      ...buildComplaintSummary(item),
    })),
    notifications: notifications.slice(0, 12).map((item) => ({
      id: item.id,
      complaintId: item.complaintId,
      message: item.message,
      createdAt: item.createdAt,
      status: item.status,
    })),
    categoryLoad: Object.entries(categoryCountMap).map(([category, count]) => ({
      category,
      count,
      percentage: Math.max(10, Math.round((count / Math.max(scopedQueue.length, 1)) * 100)),
    })),
  };
}

function buildAdminDashboard() {
  synchronizeCitizenWorkflowComplaints();

  const inviteNow = new Date();
  const allCases = complaints.slice();
  const activeCases = allCases.filter(isOpenCase);
  const overdueCases = activeCases.filter(isOverdue);
  const resolvedCases = getResolvedCases();
  const resolvedWithinDeadline = resolvedCases.filter(
    (item) => new Date(item.resolvedAt) <= new Date(item.deadlineAt),
  );
  const hierarchyStats = buildRegisteredHierarchyStats();
  const leadersCount = institutionEmployees.filter((entry) => entry.isLeader === true).length;
  const corruptionCases = allCases.filter(
    (item) => getIssueClassification(item.category).key === 'corruption_risk',
  ).length;
  const pendingInvites = institutionInvites.filter((invite) => invite.status === 'pending');
  const usedInvites = institutionInvites.filter((invite) => invite.status === 'used');
  const expiringSoonInvites = pendingInvites.filter((invite) => {
    const hoursUntilExpiry = getHoursBetween(inviteNow, invite.expiresAt);
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= 72;
  });
  const citizenSatisfaction = `${
    resolvedCases.length > 0
      ? Math.round((resolvedWithinDeadline.length / resolvedCases.length) * 100)
      : 0
  }%`;
  const provincesWithCases = new Set(
    allCases
      .map((item) => getInstitutionAnalyticsMetadata(item.institutionId).location?.province)
      .filter(Boolean),
  ).size;

  const provinceReportMap = new Map(
    RWANDA_ADMINISTRATIVE_STRUCTURE.map((entry) => [
      entry.province,
      {
        province: entry.province,
        totalIssues: 0,
        activeIssues: 0,
        overdueIssues: 0,
        escalatedIssues: 0,
        resolvedIssues: 0,
        corruptionIssues: 0,
        anonymousIssues: 0,
        institutions: new Set(),
        expectedDistricts: entry.districts.length,
        registeredDistricts: registeredInstitutions.filter(
          (institution) =>
            institution.level === 'district' && institution.location?.province === entry.province,
        ).length,
        provinceOfficeRegistered: registeredInstitutions.some(
          (institution) =>
            institution.level === 'province' && institution.location?.province === entry.province,
        ),
      },
    ]),
  );

  const issuePortfolioMap = new Map(
    [
      getIssueClassification('Bribery request'),
      getIssueClassification('Abuse of authority'),
      getIssueClassification('Missing response'),
      getIssueClassification('Delayed service'),
    ].map((entry) => [entry.key, { ...entry, count: 0 }]),
  );

  const categoryCounts = {};

  for (const item of allCases) {
    const meta = getInstitutionAnalyticsMetadata(item.institutionId);
    const province = meta.location?.province || 'Unassigned';
    const provinceReport = provinceReportMap.get(province) ?? {
      province,
      totalIssues: 0,
      activeIssues: 0,
      overdueIssues: 0,
      escalatedIssues: 0,
      resolvedIssues: 0,
      corruptionIssues: 0,
      anonymousIssues: 0,
      institutions: new Set(),
      expectedDistricts: 0,
      registeredDistricts: 0,
      provinceOfficeRegistered: false,
    };

    provinceReport.totalIssues += 1;
    if (isOpenCase(item)) {
      provinceReport.activeIssues += 1;
    }
    if (isOverdue(item)) {
      provinceReport.overdueIssues += 1;
    }
    if (item.status === 'escalated') {
      provinceReport.escalatedIssues += 1;
    }
    if (item.status === 'resolved') {
      provinceReport.resolvedIssues += 1;
    }
    if (getIssueClassification(item.category).key === 'corruption_risk') {
      provinceReport.corruptionIssues += 1;
    }
    if (item.reportingMode === 'anonymous') {
      provinceReport.anonymousIssues += 1;
    }
    provinceReport.institutions.add(meta.institution);
    provinceReportMap.set(province, provinceReport);

    const issuePortfolio = issuePortfolioMap.get(getIssueClassification(item.category).key);
    if (issuePortfolio) {
      issuePortfolio.count += 1;
    }

    categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1;
  }

  const provinceReports = [...provinceReportMap.values()]
    .map((entry) => ({
      province: entry.province,
      totalIssues: entry.totalIssues,
      activeIssues: entry.activeIssues,
      overdueIssues: entry.overdueIssues,
      escalatedIssues: entry.escalatedIssues,
      resolvedIssues: entry.resolvedIssues,
      corruptionIssues: entry.corruptionIssues,
      anonymousIssues: entry.anonymousIssues,
      institutions: entry.institutions.size,
      expectedDistricts: entry.expectedDistricts,
      registeredDistricts: entry.registeredDistricts,
      provinceOfficeRegistered: entry.provinceOfficeRegistered,
      hotspotScore:
        entry.activeIssues * 3 +
        entry.overdueIssues * 4 +
        entry.corruptionIssues * 5 +
        entry.escalatedIssues * 3,
    }))
    .sort((left, right) => left.province.localeCompare(right.province));

  const institutionPerformance = institutions
    .map((institution) => {
      const meta = getInstitutionAnalyticsMetadata(institution.id);
      const institutionCases = allCases.filter((item) => item.institutionId === institution.id);
      const institutionOpen = institutionCases.filter(isOpenCase);
      const institutionOverdue = institutionOpen.filter(isOverdue);
      const institutionResolved = institutionCases.filter((item) => item.status === 'resolved');
      const slaScore =
        institutionResolved.length > 0
          ? Math.round(
              (institutionResolved.filter(
                (item) => new Date(item.resolvedAt) <= new Date(item.deadlineAt),
              ).length /
                institutionResolved.length) *
                100,
            )
          : 0;

      return {
        institution: institution.name,
        province: meta.location?.province || 'Unassigned',
        level: institution.level,
        openCases: institutionOpen.length,
        overdueCases: institutionOverdue.length,
        resolvedCases: institutionResolved.length,
        slaScore,
      };
    })
    .sort(
      (left, right) =>
        right.overdueCases - left.overdueCases || right.openCases - left.openCases,
    );

  const levelCount = activeCases.reduce((accumulator, item) => {
    accumulator[item.currentLevel] = (accumulator[item.currentLevel] ?? 0) + 1;
    return accumulator;
  }, {});

  const issuePortfolio = [...issuePortfolioMap.values()].map((entry) => ({
    ...entry,
    value: entry.count,
    percentage: allCases.length > 0 ? Math.round((entry.count / allCases.length) * 100) : 0,
  }));

  const issueCategories = Object.entries(categoryCounts)
    .map(([category, count]) => {
      const classification = getIssueClassification(category);
      return {
        category,
        count,
        classification: classification.label,
        percentage: allCases.length > 0 ? Math.round((count / allCases.length) * 100) : 0,
      };
    })
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));

  const reportingModes = ['anonymous', 'verified'].map((mode) => {
    const count = allCases.filter((item) => item.reportingMode === mode).length;
    return {
      mode,
      count,
      percentage: allCases.length > 0 ? Math.round((count / allCases.length) * 100) : 0,
      note:
        mode === 'anonymous'
          ? 'Identity-protected submissions in the national queue.'
          : 'Submissions linked to a verified citizen profile.',
    };
  });

  const locationHotspots = provinceReports
    .filter((entry) => entry.totalIssues > 0)
    .sort((left, right) => right.hotspotScore - left.hotspotScore)
    .slice(0, 5)
    .map((entry) => ({
      province: entry.province,
      activeIssues: entry.activeIssues,
      overdueIssues: entry.overdueIssues,
      escalatedIssues: entry.escalatedIssues,
      corruptionIssues: entry.corruptionIssues,
      note: `${entry.corruptionIssues} corruption-risk cases, ${entry.overdueIssues} overdue, ${entry.escalatedIssues} escalated.`,
    }));

  const recentReports = allCases
    .slice()
    .sort(
      (left, right) =>
        new Date(right.updatedAt ?? right.submittedAt) - new Date(left.updatedAt ?? left.submittedAt),
    )
    .slice(0, 10)
    .map((item) => {
      const meta = getInstitutionAnalyticsMetadata(item.institutionId);
      const classification = getIssueClassification(item.category);

      return {
        id: item.id,
        category: item.category,
        classification: classification.label,
        classificationKey: classification.key,
        status: item.status,
        institution: meta.institution,
        province: meta.location?.province || 'Unassigned',
        district: meta.location?.district || 'Province office',
        currentLevel: item.currentLevel,
        reportingMode: item.reportingMode,
        submittedAt: item.submittedAt,
        updatedAt: item.updatedAt,
        deadlineAt: item.deadlineAt,
      };
    });

  const recentInvites = institutionInvites
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 8)
    .map((invite) => ({
      inviteId: invite.inviteId,
      targetLevel: invite.targetLevel,
      institutionNameHint: invite.institutionNameHint,
      province: invite.location?.province || 'N/A',
      district: invite.location?.district || 'N/A',
      status: invite.status,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      createdByRole: invite.createdByRole,
      usedByInstitutionId: invite.usedByInstitutionId ?? null,
    }));

  const coverageByProvince = RWANDA_ADMINISTRATIVE_STRUCTURE.map((entry) => {
    const provinceInstitutions = registeredInstitutions.filter(
      (institution) => institution.location?.province === entry.province,
    );
    const provinceInstitutionIds = new Set(
      provinceInstitutions.map((institution) => institution.institutionId),
    );

    return {
      province: entry.province,
      provinceOfficeRegistered: provinceInstitutions.some(
        (institution) => institution.level === 'province',
      ),
      districtsRegistered: provinceInstitutions.filter((institution) => institution.level === 'district')
        .length,
      expectedDistricts: entry.districts.length,
      sectorsRegistered: provinceInstitutions.filter((institution) => institution.level === 'sector')
        .length,
      cellsRegistered: provinceInstitutions.filter((institution) => institution.level === 'cell')
        .length,
      villagesRegistered: provinceInstitutions.filter((institution) => institution.level === 'village')
        .length,
      leadersRegistered: institutionEmployees.filter(
        (employee) =>
          employee.isLeader === true && provinceInstitutionIds.has(employee.institutionId),
      ).length,
    };
  });

  return {
    role: 'admin',
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        label: 'Registered institutions',
        value: hierarchyStats.totalInstitutions,
        note: 'All hierarchy offices currently connected to the platform.',
      },
      {
        label: 'Registered leaders',
        value: leadersCount,
        note: 'Leadership accounts available across province to village.',
      },
      {
        label: 'Total issues raised',
        value: allCases.length,
        note: 'All complaint records captured in the national monitoring dataset.',
      },
      {
        label: 'Active issues',
        value: activeCases.length,
        note: 'Complaints still awaiting closure or escalation decisions.',
      },
      {
        label: 'Corruption risk issues',
        value: corruptionCases,
        note: 'Bribery and unofficial fee complaints requiring integrity oversight.',
      },
      {
        label: 'Provinces reporting',
        value: `${provincesWithCases}/${RWANDA_ADMINISTRATIVE_STRUCTURE.length}`,
        note: 'Provinces currently represented in the live complaint feed.',
      },
      {
        label: 'Pending invites',
        value: pendingInvites.length,
        note: 'Next-level onboarding invites not yet used by invited institutions.',
      },
      {
        label: 'SLA satisfaction',
        value: citizenSatisfaction,
        note: 'Resolved cases that closed within the working-day response window.',
      },
    ],
    alerts: [
      {
        severity: overdueCases.length > 0 ? 'high' : 'normal',
        title: 'Overdue case watch',
        detail: `${overdueCases.length} open complaints exceeded their SLA window and need immediate national follow-up.`,
      },
      {
        severity: corruptionCases > 0 ? 'high' : 'normal',
        title: 'Integrity risk load',
        detail: `${corruptionCases} complaints fall into bribery or unofficial fee risk categories.`,
      },
      {
        severity:
          hierarchyStats.registeredProvinces < hierarchyStats.expectedProvinces ? 'medium' : 'normal',
        title: 'Province coverage gap',
        detail: `${hierarchyStats.registeredProvinces} of ${hierarchyStats.expectedProvinces} province offices are registered in the governance chain.`,
      },
      {
        severity: expiringSoonInvites.length > 0 ? 'medium' : 'normal',
        title: 'Invite expiry watch',
        detail: `${expiringSoonInvites.length} pending invites will expire within the next 72 hours.`,
      },
    ],
    nationalCoverage: [
      {
        label: 'Province offices',
        value: `${hierarchyStats.registeredProvinces}/${hierarchyStats.expectedProvinces}`,
        note: 'Registered province institutions compared with the national expectation.',
      },
      {
        label: 'District offices',
        value: hierarchyStats.byLevel.district,
        note: 'District institutions currently linked under provinces.',
      },
      {
        label: 'Sector offices',
        value: hierarchyStats.byLevel.sector,
        note: 'Sector institutions available in the registered governance tree.',
      },
      {
        label: 'Staff accounts',
        value: institutionEmployees.length,
        note: 'Leaders and staff registered across all institutions.',
      },
      {
        label: 'Live escalation rate',
        value: `${Math.round((escalations.length / Math.max(allCases.length, 1)) * 100)}%`,
        note: 'Share of all complaints escalated to a higher authority level.',
      },
      {
        label: 'Response window',
        value: '3 days',
        note: 'Working-day SLA monitored by the national admin dashboard.',
      },
    ],
    institutionPerformance,
    provinceReports,
    issuePortfolio,
    issueCategories,
    reportingModes,
    locationHotspots,
    distributionByLevel: Object.entries(levelCount).map(([level, count]) => ({
      level,
      count,
      percentage: Math.max(12, Math.round((count / Math.max(activeCases.length, 1)) * 100)),
    })),
    compliance: [
      {
        title: 'Privacy-ready submissions',
        value: `${allCases.filter((item) => item.reportingMode === 'anonymous').length}`,
        note: 'Anonymous reports currently in national system scope.',
      },
      {
        title: 'Evidence-backed reports',
        value: `${allCases.filter((item) => item.message.length > 60).length}`,
        note: 'Complaints with detailed narratives that support investigation quality.',
      },
      {
        title: 'Priority integrity incidents',
        value: `${allCases.filter((item) => item.category === 'Bribery request').length}`,
        note: 'Bribery-request complaints needing rapid integrity review.',
      },
    ],
    recentReports,
    inviteOverview: [
      {
        label: 'Pending invites',
        value: pendingInvites.length,
        note: 'Invites waiting for institution registration completion.',
      },
      {
        label: 'Used invites',
        value: usedInvites.length,
        note: 'Invites already consumed by institution onboarding.',
      },
      {
        label: 'Expiring soon',
        value: expiringSoonInvites.length,
        note: 'Pending invites that need follow-up before expiry.',
      },
      {
        label: 'Province invites',
        value: institutionInvites.filter((invite) => invite.targetLevel === 'province').length,
        note: 'National-level invites issued to onboard province leadership.',
      },
    ],
    recentInvites,
    registrationHierarchy: {
      ...hierarchyStats,
      coverageByProvince,
    },
  };
}

router.get('/overview', (request, response) => {
  const userRole = request.auth.user.role;
  const roleList = CITIZEN_DASHBOARD_ROLES.has(userRole)
    ? ['citizen']
    : OFFICER_DASHBOARD_ROLES.has(userRole)
      ? ['officer']
      : ADMIN_DASHBOARD_ROLES.has(userRole)
        ? ['admin']
        : [];

  response.json({
    generatedAt: new Date().toISOString(),
    roles: [
      {
        key: 'citizen',
        label: 'Citizen Dashboard',
        description: 'Track personal complaints, deadlines, and feedback.',
      },
      {
        key: 'officer',
        label: 'Institution Level Dashboard',
        description:
          'Manage invite chain, case queue, escalations, and team actions for your assigned level.',
      },
      {
        key: 'admin',
        label: 'Oversight Admin Dashboard',
        description: 'Monitor system health, SLA compliance, and institution performance.',
      },
    ].filter((role) => roleList.includes(role.key)),
  });
});

router.get('/citizen', (request, response) => {
  const role = request.auth.user.role;
  if (!CITIZEN_DASHBOARD_ROLES.has(role)) {
    return response.status(403).json({
      message: 'Citizen dashboard access denied for your role.',
    });
  }

  response.json(buildCitizenDashboard(request.auth.user));
});

router.get('/citizen/context', (request, response) => {
  const role = request.auth.user.role;
  if (!CITIZEN_DASHBOARD_ROLES.has(role)) {
    return response.status(403).json({
      message: 'Citizen context access denied for your role.',
    });
  }

  const userLocation = request.auth.user.location ?? {};
  const filters = {
    province: request.query.province ?? userLocation.province ?? '',
    district: request.query.district ?? userLocation.district ?? '',
    sector: request.query.sector ?? userLocation.sector ?? '',
    cell: request.query.cell ?? userLocation.cell ?? '',
    village: request.query.village ?? userLocation.village ?? '',
  };

  response.json(
    buildCitizenExplorer({
      ...filters,
      institutionSlug: request.query.institution ?? '',
    }),
  );
});

router.post('/citizen/complaints', (request, response) => {
  const role = request.auth.user.role;
  if (role !== 'citizen') {
    return response.status(403).json({
      message: 'Only citizen accounts can submit complaints through this dashboard form.',
    });
  }

  const parseResult = citizenComplaintSubmissionSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Invalid citizen complaint payload.',
      errors: parseResult.error.flatten(),
    });
  }

  const payload = parseResult.data;
  const reporterProfile = buildCitizenReporterProfile(request.auth.user);
  const citizenLocation = request.auth.user.location ?? {};
  const context = buildCitizenExplorer({
    province: citizenLocation.province,
    district: citizenLocation.district,
    sector: citizenLocation.sector,
    cell: citizenLocation.cell,
    village: citizenLocation.village,
    institutionSlug: payload.sourceInstitutionSlug ?? '',
  });
  const availableTargets = context.complaintTargetLeaders ?? [];
  const sourceInstitution = payload.sourceInstitutionSlug
    ? findRegisteredInstitutionBySlug(payload.sourceInstitutionSlug)
    : null;
  const selectedService =
    payload.serviceName && sourceInstitution
      ? (sourceInstitution.services ?? []).find((service) => service.name === payload.serviceName) ?? null
      : null;

  if (payload.serviceName && payload.sourceInstitutionSlug && !selectedService) {
    return response.status(400).json({
      message: 'Selected service does not belong to the scanned institution.',
    });
  }

  let destination = null;
  let accusedLeaderEntries = [];

  if (payload.issueType === 'service_issue') {
    destination =
      availableTargets.find((entry) => entry.leader.employeeId === payload.targetLeaderEmployeeId) ?? null;

    if (!destination) {
      return response.status(400).json({
        message: 'Receiving leader must be selected from the visible leadership list.',
      });
    }
  } else {
    accusedLeaderEntries = (payload.accusedLeaderEmployeeIds ?? [])
      .map((employeeId) => findLeaderChainEntryByEmployeeId(context.leaderChain ?? [], employeeId))
      .filter(Boolean);

    if (accusedLeaderEntries.length !== (payload.accusedLeaderEmployeeIds ?? []).length) {
      return response.status(400).json({
        message: 'Accused leaders must come from your visible village-to-province leadership chain.',
      });
    }

    const reviewLevel = getReviewLevelForAccusedLeaders(accusedLeaderEntries);
    destination = getDestinationForLevel(reviewLevel, citizenLocation, context.leaderChain ?? []);

    if (!reviewLevel || !destination?.leader?.employeeId) {
      return response.status(400).json({
        message: 'We could not find the correct next review office for the selected corruption report.',
      });
    }
  }

  const now = new Date();
  const deadlineAt = addWorkingDays(now, 3);
  const complaintId = `CF-${now.getFullYear()}-${String(complaints.length + 1001).padStart(4, '0')}`;
  const complaintRecord = {
    id: complaintId,
    issueType: payload.issueType,
    institutionId: destination.institutionId,
    sourceInstitutionId: sourceInstitution?.institutionId ?? null,
    sourceInstitutionSlug: sourceInstitution?.slug ?? null,
    sourceInstitutionName: sourceInstitution?.institutionName ?? null,
    serviceName: selectedService?.name ?? payload.serviceName ?? null,
    category: payload.category,
    status: 'submitted',
    currentLevel: destination.level,
    initialLevel: destination.level,
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
    reportingMode: payload.reportingMode,
    submittedVia: payload.submittedVia,
    citizenReference: getCitizenReference(request.auth.user),
    assignedOfficerId: destination.leader.employeeId,
    message: payload.message,
    reporterUserId: request.auth.user.userId,
    reporterProfile,
    location: citizenLocation,
    targetLeaderEmployeeId: payload.targetLeaderEmployeeId ?? null,
    taggedLeaderEmployeeIds: [destination.leader.employeeId],
    accusedLeaderEmployeeIds: payload.accusedLeaderEmployeeIds ?? [],
    accusedLeaders: accusedLeaderEntries.map((entry) => serializeLeaderChainEntry(entry)),
    evidenceImage: payload.evidenceImage ?? null,
    voiceNote: payload.voiceNote ?? null,
    responses: [],
    response: null,
    feedbackStatus: null,
    autoEscalateEnabled: true,
  };

  complaints.unshift(complaintRecord);
  notifyComplaintRecipient(
    destination.leader.employeeId,
    complaintRecord,
    payload.issueType === 'corruption_issue'
      ? `New corruption report submitted for ${destination.level} review.`
      : `New citizen service issue submitted to ${destination.level} review.`,
  );

  return response.status(201).json({
    message: 'Complaint submitted successfully and routed to the correct review level.',
    item: buildComplaintSummary(complaintRecord),
  });
});

router.post('/citizen/complaints/:complaintId/accept-feedback', (request, response) => {
  const role = request.auth.user.role;
  if (role !== 'citizen') {
    return response.status(403).json({
      message: 'Only citizen accounts can confirm complaint feedback.',
    });
  }

  const parseResult = citizenDecisionSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Invalid citizen decision payload.',
      errors: parseResult.error.flatten(),
    });
  }

  const complaint = complaints.find((item) => item.id === request.params.complaintId);
  if (!complaint || complaint.reporterUserId !== request.auth.user.userId) {
    return response.status(404).json({
      message: 'Complaint not found for this citizen account.',
    });
  }

  if (complaint.status !== 'responded') {
    return response.status(400).json({
      message: 'Only complaints with official feedback can be accepted.',
    });
  }

  const now = new Date();
  complaint.status = 'resolved';
  complaint.feedbackStatus = 'accepted';
  complaint.feedbackNote = parseResult.data.note ?? '';
  complaint.updatedAt = now.toISOString();
  complaint.resolvedAt = now.toISOString();
  complaint.autoEscalateEnabled = false;

  return response.json({
    message: 'Feedback accepted and complaint closed successfully.',
    item: buildComplaintSummary(complaint),
  });
});

router.post('/citizen/complaints/:complaintId/escalate', (request, response) => {
  const role = request.auth.user.role;
  if (role !== 'citizen') {
    return response.status(403).json({
      message: 'Only citizen accounts can escalate dashboard complaints.',
    });
  }

  const parseResult = citizenDecisionSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Invalid citizen escalation payload.',
      errors: parseResult.error.flatten(),
    });
  }

  const complaint = complaints.find((item) => item.id === request.params.complaintId);
  if (!complaint || complaint.reporterUserId !== request.auth.user.userId) {
    return response.status(404).json({
      message: 'Complaint not found for this citizen account.',
    });
  }

  if (complaint.status !== 'responded') {
    return response.status(400).json({
      message: 'Citizen escalation is available after official feedback is received.',
    });
  }

  const nextLevel = getNextEscalationLevel(complaint.currentLevel);
  const destination = getDestinationForLevel(
    nextLevel,
    getComplaintLocation(complaint),
    getLeaderChainByCitizenLocation(getComplaintLocation(complaint)),
  );

  if (!nextLevel || !destination?.leader?.employeeId) {
    return response.status(400).json({
      message: 'No higher review level is available for this complaint.',
    });
  }

  const now = new Date();
  const fromLevel = complaint.currentLevel;
  complaint.status = 'escalated';
  complaint.currentLevel = nextLevel;
  complaint.institutionId = destination.institutionId;
  complaint.assignedOfficerId = destination.leader.employeeId;
  complaint.updatedAt = now.toISOString();
  complaint.deadlineAt = addWorkingDays(now, 3).toISOString();
  complaint.feedbackStatus = 'escalated';
  complaint.feedbackNote = parseResult.data.note ?? '';
  complaint.autoEscalateEnabled = true;

  escalations.unshift({
    id: escalations.length + 1,
    complaintId: complaint.id,
    fromLevel,
    toLevel: nextLevel,
    reason:
      parseResult.data.note?.trim().length > 0
        ? `Citizen escalated after feedback: ${parseResult.data.note.trim()}`
        : 'Citizen escalated after receiving unsatisfactory feedback.',
    escalatedAt: now.toISOString(),
  });

  notifyComplaintRecipient(
    destination.leader.employeeId,
    complaint,
    `Citizen requested escalation to ${nextLevel} after receiving feedback.`,
  );

  return response.json({
    message: `Complaint escalated to ${nextLevel} successfully.`,
    item: buildComplaintSummary(complaint),
  });
});

router.get('/officer', (request, response) => {
  const role = request.auth.user.role;
  if (!OFFICER_DASHBOARD_ROLES.has(role)) {
    return response.status(403).json({
      message: 'Officer dashboard access denied for your role.',
    });
  }

  response.json(buildOfficerDashboard(request.auth.user));
});

router.get('/officer/explorer', (request, response) => {
  const role = request.auth.user.role;
  if (!OFFICER_DASHBOARD_ROLES.has(role)) {
    return response.status(403).json({
      message: 'Officer explorer access denied for your role.',
    });
  }

  response.json(
    buildOfficerExplorer(request.auth.user, {
      province: request.query.province,
      district: request.query.district,
      sector: request.query.sector,
      cell: request.query.cell,
      village: request.query.village,
    }),
  );
});

router.post('/officer/complaints/:complaintId/respond', (request, response) => {
  const role = request.auth.user.role;
  if (!OFFICER_DASHBOARD_ROLES.has(role) && !ADMIN_DASHBOARD_ROLES.has(role)) {
    return response.status(403).json({
      message: 'Only governance review accounts can respond to citizen complaints.',
    });
  }

  const parseResult = citizenResponseSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Invalid complaint response payload.',
      errors: parseResult.error.flatten(),
    });
  }

  const complaint = complaints.find((item) => item.id === request.params.complaintId);
  if (!complaint) {
    return response.status(404).json({
      message: 'Complaint not found.',
    });
  }

  if (!canUserRespondToComplaint(request.auth.user, complaint)) {
    return response.status(403).json({
      message: 'This complaint is not assigned to your dashboard scope.',
    });
  }

  const responderEmployee = findLeaderEmployeeByUser(request.auth.user);
  const responderId = responderEmployee?.employeeId ?? request.auth.user.userId;
  const responderName = responderEmployee?.fullName ?? request.auth.user.fullName ?? 'Assigned officer';
  const now = new Date();
  const responseRecord = {
    message: parseResult.data.message,
    actionTaken: parseResult.data.actionTaken ?? '',
    respondedAt: now.toISOString(),
    respondedByEmployeeId: responderId,
    respondedByName: responderName,
    level: complaint.currentLevel,
  };

  complaint.response = responseRecord;
  complaint.responses = [...(complaint.responses ?? []), responseRecord];
  complaint.status = 'responded';
  complaint.feedbackStatus = 'pending_citizen';
  complaint.updatedAt = now.toISOString();

  return response.json({
    message: 'Citizen feedback recorded successfully.',
    item: buildComplaintSummary(complaint),
  });
});

router.get('/admin', (request, response) => {
  const role = request.auth.user.role;
  if (!ADMIN_DASHBOARD_ROLES.has(role)) {
    return response.status(403).json({
      message: 'Admin dashboard access denied for your role.',
    });
  }

  response.json(buildAdminDashboard());
});

export default router;
