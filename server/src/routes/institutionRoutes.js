import { Router } from 'express';
import QRCode from 'qrcode';
import { institutions } from '../data/mockData.js';
import { institutionEmployees, registeredInstitutions } from '../data/registrationData.js';

const router = Router();

function getClientBaseUrl() {
  return process.env.CLIENT_URL ?? 'http://localhost:5173';
}

function buildDashboardReportUrl(slug) {
  const redirectPath = encodeURIComponent(`/dashboard/citizen/submit?institution=${slug}&source=qr`);
  return `${getClientBaseUrl()}/login?redirect=${redirectPath}`;
}

function normalizeLegacyInstitution(item) {
  return {
    institutionId: String(item.id),
    slug: item.qrCodeSlug,
    institutionName: item.name,
    level: item.level,
    officeAddress: null,
    officialEmail: null,
    officialPhone: null,
    services: [],
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
    qrCodeDataUrl: null,
    reportUrl: buildDashboardReportUrl(item.qrCodeSlug),
  };
}

function normalizeRegisteredInstitution(item) {
  const leader = institutionEmployees.find(
    (employee) => employee.institutionId === item.institutionId && employee.isLeader === true,
  );

  return {
    institutionId: item.institutionId,
    slug: item.slug,
    institutionName: item.institutionName,
    level: item.level,
    officeAddress: item.officeAddress ?? null,
    officialEmail: item.officialEmail ?? null,
    officialPhone: item.officialPhone ?? null,
    services: item.services ?? [],
    location: item.location,
    source: 'registered',
    qrCodeDataUrl: item.qrCodeDataUrl,
    reportUrl: buildDashboardReportUrl(item.slug),
    leader: leader
      ? {
          employeeId: leader.employeeId,
          fullName: leader.fullName,
          phone: leader.phone,
          email: leader.email,
          positionTitle: leader.positionTitle,
          description: leader.description ?? '',
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

    const reportUrl = institution.reportUrl;
    const reportQrCodeDataUrl = await QRCode.toDataURL(reportUrl, {
      margin: 1,
      color: {
        dark: '#1d3567',
        light: '#f3f6fc',
      },
    });

    return response.json({
      institution,
      reportUrl,
      reportQrCodeDataUrl,
      institutionInfoQrCodeDataUrl: institution.qrCodeDataUrl ?? null,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
