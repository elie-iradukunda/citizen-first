const PRODUCTION_FALLBACK_URL = 'https://saccfp-production.up.railway.app';

export function getClientBaseUrl() {
  const configuredUrl =
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME) {
    return PRODUCTION_FALLBACK_URL;
  }

  return 'http://localhost:5173';
}

export function buildInstitutionAccessUrl(slug) {
  return `${getClientBaseUrl()}/institutions/${slug}`;
}
