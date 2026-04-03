import { Router } from 'express';
import QRCode from 'qrcode';
import { institutions } from '../data/mockData.js';
import { registeredInstitutions } from '../data/registrationData.js';

const router = Router();

function normalizeLegacyInstitution(item) {
  return {
    institutionId: String(item.id),
    slug: item.qrCodeSlug,
    institutionName: item.name,
    level: item.level,
    location: {
      country: 'Rwanda',
      province: null,
      district: item.district ?? null,
      sector: null,
      cell: null,
      village: null,
    },
    source: 'legacy',
  };
}

function normalizeRegisteredInstitution(item) {
  return {
    institutionId: item.institutionId,
    slug: item.slug,
    institutionName: item.institutionName,
    level: item.level,
    location: item.location,
    source: 'registered',
    qrCodeDataUrl: item.qrCodeDataUrl,
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

    const reportUrl = `${
      process.env.CLIENT_URL ?? 'http://localhost:5173'
    }/report?institution=${institution.slug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(reportUrl, {
      margin: 1,
      color: {
        dark: '#1d3567',
        light: '#f3f6fc',
      },
    });

    return response.json({
      institution,
      reportUrl,
      qrCodeDataUrl,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
