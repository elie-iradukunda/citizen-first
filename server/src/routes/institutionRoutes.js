import { Router } from 'express';
import QRCode from 'qrcode';
import { institutions } from '../data/mockData.js';
import {
  institutionDepartments,
  institutionEmployees,
  registeredInstitutions,
} from '../data/registrationData.js';

const router = Router();

function getClientBaseUrl() {
  return process.env.CLIENT_URL ?? 'http://localhost:5173';
}

function buildInstitutionAccessUrl(slug) {
  return `${getClientBaseUrl()}/institutions/${slug}`;
}

function buildInstitutionInfoUrl(slug) {
  return `${buildInstitutionAccessUrl(slug)}#info`;
}

function buildDashboardReportUrl(slug) {
  const redirectPath = encodeURIComponent(`/dashboard/citizen/submit?institution=${slug}&source=qr`);
  return `${getClientBaseUrl()}/login?redirect=${redirectPath}`;
}

function getEmployeeCountForInstitution(institutionId) {
  return institutionEmployees.filter((employee) => employee.institutionId === institutionId).length;
}

function getChildRegisteredInstitutions(parentInstitutionId) {
  return registeredInstitutions
    .filter((entry) => entry.parentInstitutionId === parentInstitutionId)
    .sort((left, right) => left.institutionName.localeCompare(right.institutionName));
}

function normalizeLegacyInstitution(item) {
  return {
    institutionId: String(item.id),
    slug: item.qrCodeSlug,
    institutionName: item.name,
    institutionType: 'Government Service Office',
    level: item.level,
    officeAddress: null,
    officialEmail: null,
    officialPhone: null,
    services: [],
    departments: [],
    location: {
      country: 'Rwanda',
      province: null,
      district: item.district ?? null,
      sector: null,
      cell: null,
      village: null,
    },
    source: 'legacy',
    leader: null,
    expectedChildUnits: null,
    registeredChildUnits: 0,
    childUnitLabel: null,
    employeeCount: 0,
    children: [],
    qrCodeDataUrl: null,
    accessUrl: buildInstitutionAccessUrl(item.qrCodeSlug),
    infoUrl: buildInstitutionInfoUrl(item.qrCodeSlug),
    reportUrl: buildDashboardReportUrl(item.qrCodeSlug),
  };
}

function normalizeRegisteredInstitution(item) {
  const leader = institutionEmployees.find(
    (employee) => employee.institutionId === item.institutionId && employee.isLeader === true,
  );
  const departments = institutionDepartments
    .filter((department) => department.institutionId === item.institutionId)
    .sort((left, right) => left.name.localeCompare(right.name));
  const children = getChildRegisteredInstitutions(item.institutionId).map((child) => ({
    institutionId: child.institutionId,
    slug: child.slug,
    institutionName: child.institutionName,
    level: child.level,
    location: child.location ?? {},
    servicesCount: child.services?.length ?? 0,
    employeeCount: getEmployeeCountForInstitution(child.institutionId),
  }));

  return {
    institutionId: item.institutionId,
    slug: item.slug,
    institutionName: item.institutionName,
    institutionType: item.institutionType ?? 'Government Institution',
    level: item.level,
    officeAddress: item.officeAddress ?? null,
    officialEmail: item.officialEmail ?? null,
    officialPhone: item.officialPhone ?? null,
    services: item.services ?? [],
    departments,
    location: item.location,
    source: 'registered',
    qrCodeDataUrl: item.qrCodeDataUrl,
    accessUrl: buildInstitutionAccessUrl(item.slug),
    infoUrl: buildInstitutionInfoUrl(item.slug),
    reportUrl: buildDashboardReportUrl(item.slug),
    expectedChildUnits: item.expectedChildUnits ?? null,
    registeredChildUnits: children.length,
    childUnitLabel: item.childUnitLabel ?? null,
    employeeCount: getEmployeeCountForInstitution(item.institutionId),
    children,
    leader: leader
      ? {
          employeeId: leader.employeeId,
          fullName: leader.fullName,
          phone: leader.phone,
          email: leader.email,
          positionTitle: leader.positionTitle,
          positionKinyarwanda: leader.positionKinyarwanda ?? '',
          reportsTo: leader.reportsTo ?? '',
          description: leader.description ?? '',
          duties: leader.description ?? '',
        }
      : null,
  };
}

function getAllInstitutions() {
  return [
    ...institutions.map(normalizeLegacyInstitution),
    ...registeredInstitutions.map(normalizeRegisteredInstitution),
  ];
}

router.get('/', (_request, response) => {
  response.json({
    items: getAllInstitutions(),
  });
});

router.get('/:slug', (request, response) => {
  const institution = getAllInstitutions().find((item) => item.slug === request.params.slug);

  if (!institution) {
    return response.status(404).json({
      message: 'Institution not found.',
    });
  }

  return response.json({
    item: institution,
  });
});

router.get('/:slug/qr', async (request, response, next) => {
  try {
    const institution = getAllInstitutions().find((item) => item.slug === request.params.slug);

    if (!institution) {
      return response.status(404).json({
        message: 'Institution not found.',
      });
    }

    const accessUrl = institution.accessUrl;
    const accessQrCodeDataUrl = await QRCode.toDataURL(accessUrl, {
      margin: 1,
      color: {
        dark: '#1d3567',
        light: '#f3f6fc',
      },
    });

    return response.json({
      institution,
      accessUrl,
      infoUrl: institution.infoUrl,
      reportUrl: institution.reportUrl,
      accessQrCodeDataUrl,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
