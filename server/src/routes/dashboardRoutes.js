import { Router } from 'express';
import { z } from 'zod';
import { complaints, escalations, institutions, officers } from '../data/mockData.js';
import {
  RWANDA_ADMINISTRATIVE_STRUCTURE,
  institutionEmployees,
  registeredInstitutions,
  systemUsers,
} from '../data/registrationData.js';

const router = Router();
const OPEN_STATUSES = new Set(['submitted', 'in_review', 'escalated']);
const DEMO_NOW = new Date('2026-04-03T12:00:00.000Z');
const NATIONAL_ROOT_ID = 'NATIONAL-PLATFORM';
const GOVERNANCE_LEVELS = ['village', 'cell', 'sector', 'district', 'province', 'national'];
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
const REPORT_LEVELS_FOR_CITIZEN = ['village', 'cell'];
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

  return 'Unassigned';
}

function getHoursBetween(start, end) {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60));
}

function getResolvedCases() {
  return complaints.filter((item) => item.status === 'resolved' && item.resolvedAt);
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

const citizenComplaintSchema = z.object({
  category: z.string().min(3).max(120),
  message: z.string().min(20).max(3000),
  reportingMode: z.enum(['anonymous', 'verified']).default('verified'),
  targetLevel: z.enum(REPORT_LEVELS_FOR_CITIZEN).default('village'),
  primaryLeaderEmployeeId: z.string().min(4),
  taggedLeaderEmployeeIds: z.array(z.string().min(4)).max(2).optional(),
});

function buildCitizenLocationOptions(filters = {}) {
  const provinces = uniqueSorted(registeredInstitutions.map((entry) => entry.location?.province));
  const districts = uniqueSorted(
    registeredInstitutions
      .filter((entry) => !filters.province || entry.location?.province === filters.province)
      .map((entry) => entry.location?.district),
  );
  const sectors = uniqueSorted(
    registeredInstitutions
      .filter(
        (entry) =>
          (!filters.province || entry.location?.province === filters.province) &&
          (!filters.district || entry.location?.district === filters.district),
      )
      .map((entry) => entry.location?.sector),
  );
  const cells = uniqueSorted(
    registeredInstitutions
      .filter(
        (entry) =>
          (!filters.province || entry.location?.province === filters.province) &&
          (!filters.district || entry.location?.district === filters.district) &&
          (!filters.sector || entry.location?.sector === filters.sector),
      )
      .map((entry) => entry.location?.cell),
  );
  const villages = uniqueSorted(
    registeredInstitutions
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

      if (!institution) {
        return null;
      }

      const leader = institutionEmployees.find(
        (employee) =>
          employee.institutionId === institution.institutionId && employee.isLeader === true,
      );

      return {
        level,
        institutionId: institution.institutionId,
        institutionName: institution.institutionName,
        services: institution.services ?? [],
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

function buildCitizenExplorer(rawFilters = {}) {
  const filters = normalizeLocationFilters(rawFilters);
  const filteredInstitutions = registeredInstitutions.filter((entry) =>
    matchesLocationFilters(entry.location, filters),
  );
  const options = buildCitizenLocationOptions(filters);
  const leaderChain = getLeaderChainByCitizenLocation(filters);
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

  const complaintTargetLeaders = leaderChain
    .filter((entry) => ['village', 'cell', 'sector'].includes(entry.level))
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
    leaderChain,
    complaintTargetLeaders,
  };
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
  return (
    user?.userId?.replace('USR-', 'CID-') ??
    `CID-${String(Math.floor(1000 + Math.random() * 9000))}`
  );
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
  const fallbackCaseIds = new Set(['CF-2026-0412', 'CF-2026-0395', 'CF-2026-0352', 'CF-2026-0348']);
  const reporterCases = complaints.filter((item) => item.reporterUserId === user?.userId);
  const citizenCases = (reporterCases.length > 0
    ? reporterCases
    : complaints.filter((item) => fallbackCaseIds.has(item.id))
  ).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

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
    cases: citizenCases.map((item) => ({
      id: item.id,
      category: item.category,
      status: item.status,
      currentLevel: item.currentLevel,
      institution: getInstitutionName(item.institutionId),
      assignedOfficer: getOfficerName(item.assignedOfficerId),
      message: item.message,
      submittedAt: item.submittedAt,
      updatedAt: item.updatedAt,
      deadlineAt: item.deadlineAt,
    })),
    timeline: citizenCases.slice(0, 5).map((item) => ({
      title: `${item.id} updated`,
      detail:
        item.status === 'resolved'
          ? 'Resolution completed and feedback delivered.'
          : 'Case reviewed by assigned institution and queued for next action.',
      time: formatDateLabel(item.updatedAt),
    })),
    awareness: [
      {
        title: 'Keep evidence ready',
        description: 'Attach receipts, call logs, and timelines to speed up investigation quality.',
      },
      {
        title: 'Use anonymous mode when needed',
        description: 'Identity-protected reporting still receives full case tracking and escalation.',
      },
      {
        title: 'Know official service fees',
        description: 'Fee-awareness cards help citizens detect unofficial payment requests quickly.',
      },
    ],
  };
}

function buildOfficerDashboard(user) {
  const openQueue = complaints
    .filter(isOpenCase)
    .sort((a, b) => new Date(a.deadlineAt) - new Date(b.deadlineAt));
  const level = resolveUserLevel(user);
  const scopedLevels = new Set(getScopeLevels(level));
  const scopedQueueRaw = openQueue.filter((item) => scopedLevels.has(item.currentLevel));
  const scopedQueue = (scopedQueueRaw.length > 0 ? scopedQueueRaw : openQueue).slice(0, 8);

  const queue = scopedQueue.map((item) => {
    const hoursToDeadline = getHoursBetween(DEMO_NOW, item.deadlineAt);
    const priority =
      isOverdue(item) || hoursToDeadline <= 12 ? 'high' : hoursToDeadline <= 30 ? 'medium' : 'normal';

    return {
      id: item.id,
      category: item.category,
      institution: getInstitutionName(item.institutionId),
      citizenReference: item.citizenReference,
      status: item.status,
      currentLevel: item.currentLevel,
      assignedOfficer: getOfficerName(item.assignedOfficerId),
      message: item.message,
      taggedLeaderEmployeeIds: item.taggedLeaderEmployeeIds ?? [],
      submittedAt: item.submittedAt,
      deadlineAt: item.deadlineAt,
      priority,
    };
  });

  const sevenDaysAgo = new Date(DEMO_NOW.getTime() - 7 * 24 * 60 * 60 * 1000);
  const officerPool = officers.filter((officer) => scopedLevels.has(officer.level));
  const scopedOfficerPool = officerPool.length > 0 ? officerPool : officers;
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
  const currentLeaderEmployee = findLeaderEmployeeByUser(user);
  const taggedIssues =
    currentLeaderEmployee
      ? complaints
          .filter((item) =>
            Array.isArray(item.taggedLeaderEmployeeIds)
              ? item.taggedLeaderEmployeeIds.includes(currentLeaderEmployee.employeeId)
              : false,
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
      id: item.id,
      category: item.category,
      status: item.status,
      currentLevel: item.currentLevel,
      message: item.message,
      submittedAt: item.submittedAt,
      deadlineAt: item.deadlineAt,
      institution: getInstitutionName(item.institutionId),
      citizenReference: item.citizenReference,
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
  const activeCases = complaints.filter(isOpenCase);
  const overdueCases = activeCases.filter(isOverdue);
  const resolvedCases = getResolvedCases();
  const resolvedWithinDeadline = resolvedCases.filter(
    (item) => new Date(item.resolvedAt) <= new Date(item.deadlineAt),
  );

  const institutionsMonitored = institutions.length;
  const escalationRate = `${Math.round((escalations.length / complaints.length) * 100)}%`;
  const citizenSatisfaction = `${
    resolvedCases.length > 0
      ? Math.round((resolvedWithinDeadline.length / resolvedCases.length) * 100)
      : 0
  }%`;

  const institutionPerformance = institutions.map((institution) => {
    const institutionCases = complaints.filter((item) => item.institutionId === institution.id);
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
      level: institution.level,
      openCases: institutionOpen.length,
      overdueCases: institutionOverdue.length,
      resolvedCases: institutionResolved.length,
      slaScore,
    };
  });

  const levelCount = activeCases.reduce((accumulator, item) => {
    accumulator[item.currentLevel] = (accumulator[item.currentLevel] ?? 0) + 1;
    return accumulator;
  }, {});
  const hierarchyStats = buildRegisteredHierarchyStats();

  return {
    role: 'admin',
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        label: 'Institutions monitored',
        value: institutionsMonitored,
        note: 'Service offices currently connected',
      },
      {
        label: 'Active cases',
        value: activeCases.length,
        note: 'Complaints in submitted, review, or escalated state',
      },
      {
        label: 'Escalation rate',
        value: escalationRate,
        note: 'Share of complaints escalated to higher authority',
      },
      {
        label: 'SLA satisfaction',
        value: citizenSatisfaction,
        note: 'Resolved cases closed before deadline',
      },
    ],
    alerts: [
      {
        severity: overdueCases.length > 0 ? 'high' : 'normal',
        title: 'Overdue case watch',
        detail: `${overdueCases.length} open complaints exceeded their SLA window.`,
      },
      {
        severity: escalations.length >= 3 ? 'medium' : 'normal',
        title: 'Escalation trend',
        detail: `${escalations.length} escalations recorded in the active monitoring period.`,
      },
      {
        severity: 'normal',
        title: 'System connectivity',
        detail: `${institutionsMonitored} institutions are publishing QR access points.`,
      },
    ],
    institutionPerformance,
    distributionByLevel: Object.entries(levelCount).map(([level, count]) => ({
      level,
      count,
      percentage: Math.max(12, Math.round((count / activeCases.length) * 100)),
    })),
    compliance: [
      {
        title: 'Privacy-ready submissions',
        value: `${complaints.filter((item) => item.reportingMode === 'anonymous').length}`,
        note: 'Anonymous reports currently in system scope',
      },
      {
        title: 'Evidence-backed reports',
        value: `${complaints.filter((item) => item.message.length > 60).length}`,
        note: 'Cases with detailed narratives for investigation',
      },
      {
        title: 'Priority integrity incidents',
        value: `${complaints.filter((item) => item.category === 'Bribery request').length}`,
        note: 'Bribery-related complaints under monitoring',
      },
    ],
    registrationHierarchy: hierarchyStats,
  };
}

router.get('/overview', (request, response) => {
  const userRole = request.auth.user.role;
  const roleList =
    userRole === 'citizen'
      ? ['citizen']
      : userRole === 'national_admin' || userRole === 'oversight_admin'
        ? ['citizen', 'officer', 'admin']
        : userRole === 'institution_officer' ||
            userRole === 'province_leader' ||
            userRole === 'district_leader' ||
            userRole === 'sector_leader' ||
            userRole === 'cell_leader' ||
            userRole === 'village_leader'
          ? ['citizen', 'officer']
          : ['citizen'];

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
  if (
    ![
      'citizen',
      'national_admin',
      'oversight_admin',
      'province_leader',
      'district_leader',
      'sector_leader',
      'cell_leader',
      'village_leader',
    ].includes(
      role,
    )
  ) {
    return response.status(403).json({
      message: 'Citizen dashboard access denied for your role.',
    });
  }

  response.json(buildCitizenDashboard(request.auth.user));
});

router.get('/citizen/context', (request, response) => {
  const role = request.auth.user.role;
  if (!['citizen', 'national_admin', 'oversight_admin'].includes(role)) {
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

  response.json(buildCitizenExplorer(filters));
});

router.post('/citizen/complaints', (request, response) => {
  const role = request.auth.user.role;
  if (role !== 'citizen') {
    return response.status(403).json({
      message: 'Only citizen accounts can submit complaints through this dashboard form.',
    });
  }

  const parseResult = citizenComplaintSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Invalid citizen complaint payload.',
      errors: parseResult.error.flatten(),
    });
  }

  const payload = parseResult.data;
  const citizenLocation = request.auth.user.location ?? {};
  const context = buildCitizenExplorer({
    province: citizenLocation.province,
    district: citizenLocation.district,
    sector: citizenLocation.sector,
    cell: citizenLocation.cell,
    village: citizenLocation.village,
  });

  const availableTargets = context.complaintTargetLeaders ?? [];
  const primaryTarget = availableTargets.find(
    (entry) => entry.leader.employeeId === payload.primaryLeaderEmployeeId,
  );

  if (!primaryTarget) {
    return response.status(400).json({
      message: 'Primary leader must be selected from the approved target leaders list.',
    });
  }

  if (payload.targetLevel && primaryTarget.level !== payload.targetLevel) {
    return response.status(400).json({
      message: `Primary leader level must match selected target level (${payload.targetLevel}).`,
    });
  }

  const taggedSet = new Set([
    payload.primaryLeaderEmployeeId,
    ...(payload.taggedLeaderEmployeeIds ?? []),
  ]);

  if (taggedSet.size > 2) {
    return response.status(400).json({
      message: 'You can select at most two leaders for one complaint.',
    });
  }

  const taggedLeaders = [...taggedSet]
    .map((employeeId) => availableTargets.find((entry) => entry.leader.employeeId === employeeId))
    .filter(Boolean);

  if (taggedLeaders.length === 0) {
    return response.status(400).json({
      message: 'At least one leader must be selected.',
    });
  }

  const now = new Date();
  const deadlineAt = addWorkingDays(now, 3);
  const complaintId = `CF-${now.getFullYear()}-${String(complaints.length + 1001).padStart(4, '0')}`;
  const complaintRecord = {
    id: complaintId,
    institutionId: primaryTarget.institutionId,
    category: payload.category,
    status: 'submitted',
    currentLevel: primaryTarget.level,
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
    reportingMode: payload.reportingMode,
    citizenReference: getCitizenReference(request.auth.user),
    assignedOfficerId: payload.primaryLeaderEmployeeId,
    message: payload.message,
    reporterUserId: request.auth.user.userId,
    location: citizenLocation,
    taggedLeaderEmployeeIds: taggedLeaders.map((entry) => entry.leader.employeeId),
  };

  complaints.unshift(complaintRecord);

  taggedLeaders.forEach((tagged) => {
    const leaderUserInfo = findLeaderUserByEmployeeId(tagged.leader.employeeId);
    if (!leaderUserInfo) {
      return;
    }

    citizenIssueNotifications.unshift({
      id: `NTF-${String(citizenIssueNotifications.length + 1).padStart(5, '0')}`,
      userId: leaderUserInfo.user.userId,
      complaintId,
      complaintLevel: complaintRecord.currentLevel,
      message: `New citizen issue (${complaintRecord.category}) tagged to ${tagged.level} leader.`,
      status: 'unread',
      createdAt: now.toISOString(),
      leaderEmployeeId: tagged.leader.employeeId,
    });
  });

  return response.status(201).json({
    message: 'Complaint submitted successfully and tagged leaders were notified.',
    item: {
      ...complaintRecord,
      taggedLeaders: taggedLeaders.map((entry) => ({
        level: entry.level,
        institutionName: entry.institutionName,
        leaderName: entry.leader.fullName,
      })),
    },
  });
});

router.get('/officer', (request, response) => {
  const role = request.auth.user.role;
  if (
    ![
      'institution_officer',
      'province_leader',
      'district_leader',
      'sector_leader',
      'cell_leader',
      'village_leader',
      'national_admin',
      'oversight_admin',
    ].includes(role)
  ) {
    return response.status(403).json({
      message: 'Officer dashboard access denied for your role.',
    });
  }

  response.json(buildOfficerDashboard(request.auth.user));
});

router.get('/officer/explorer', (request, response) => {
  const role = request.auth.user.role;
  if (
    ![
      'institution_officer',
      'province_leader',
      'district_leader',
      'sector_leader',
      'cell_leader',
      'village_leader',
      'national_admin',
      'oversight_admin',
    ].includes(role)
  ) {
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

router.get('/admin', (request, response) => {
  const role = request.auth.user.role;
  if (!['national_admin', 'oversight_admin'].includes(role)) {
    return response.status(403).json({
      message: 'Admin dashboard access denied for your role.',
    });
  }

  response.json(buildAdminDashboard());
});

export default router;
