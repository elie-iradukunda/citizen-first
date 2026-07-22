import { Router } from 'express';
import QRCode from 'qrcode';
import { buildInstitutionAccessUrl, getClientBaseUrl } from '../config/publicBaseUrl.js';
import {
  institutionDepartments,
  institutionEmployees,
  institutionStaffServiceLinks,
  registeredInstitutions,
} from '../data/registrationData.js';

const router = Router();

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
    staff: [],
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
  const staff = institutionEmployees
    .filter((employee) => employee.institutionId === item.institutionId)
    .slice()
    .sort((left, right) => {
      if (left.isLeader !== right.isLeader) {
        return left.isLeader ? -1 : 1;
      }

      return left.fullName.localeCompare(right.fullName);
    })
    .map((employee) => ({
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      positionTitle: employee.positionTitle,
      positionKinyarwanda: employee.positionKinyarwanda ?? '',
      phone: employee.phone,
      email: employee.email ?? null,
      reportsTo: employee.reportsTo ?? '',
      description: employee.description ?? '',
      status: employee.status,
      isLeader: employee.isLeader === true,
    }));
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

  const services = (item.services ?? []).map((service) => {
    const responsibleStaff = institutionStaffServiceLinks
      .filter(
        (link) =>
          link.institutionId === item.institutionId &&
          link.serviceName.toLowerCase() === service.name.toLowerCase(),
      )
      .map((link) => {
        const employee = institutionEmployees.find(
          (entry) => entry.employeeId === link.employeeId,
        );

        return employee
          ? {
              employeeId: employee.employeeId,
              fullName: employee.fullName,
              positionTitle: employee.positionTitle,
              phone: employee.phone,
              email: employee.email ?? null,
            }
          : null;
      })
      .filter(Boolean);

    return {
      ...service,
      responsibleStaff,
    };
  });

  return {
    institutionId: item.institutionId,
    slug: item.slug,
    institutionName: item.institutionName,
    institutionType: item.institutionType ?? 'Government Institution',
    level: item.level,
    officeAddress: item.officeAddress ?? null,
    officialEmail: item.officialEmail ?? null,
    officialPhone: item.officialPhone ?? null,
    services,
    departments,
    staff,
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
  return registeredInstitutions.map(normalizeRegisteredInstitution);
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

// '/:slug/access-qr' is the route name documented in the dissertation (Table 17:
// API Design); '/:slug/qr' is kept as the original alias.
router.get(['/:slug/qr', '/:slug/access-qr'], async (request, response, next) => {
  try {
    const institution = getAllInstitutions().find((item) => item.slug === request.params.slug);

    if (!institution) {
      return response.status(404).json({
        message: 'Institution not found.',
      });
    }

    const accessUrl = institution.accessUrl;
    const accessQrCodeDataUrl = await QRCode.toDataURL(accessUrl, {
      margin: 2,
      width: 280,
      color: {
        dark: '#000000',
        light: '#ffffff',
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
