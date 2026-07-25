// Institution QR codes are produced in several shapes over time: a public URL,
// a JSON payload, or a bare slug. Everything is reduced to the institution slug
// here so both the public scanner and the citizen dashboard read them the same
// way.
const knownQrSlugs = {
  'SACCFP-KACYIRU-SECTOR': 'kacyiru-sector-office',
  'GOV-KACYIRU-SECTOR': 'kacyiru-sector-office',
};

export function extractInstitutionSlug(rawValue) {
  const value = String(rawValue ?? '').trim();
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    const publicUrl = parsed.publicUrl ?? parsed.accessUrl ?? parsed.url;
    const slug = parsed.slug ?? parsed.institutionSlug;

    if (publicUrl) {
      return extractInstitutionSlug(publicUrl);
    }
    if (slug) {
      return String(slug).trim();
    }
  } catch {
    // Most QR codes are URLs or plain text, so JSON parsing is optional.
  }

  const knownSlug = knownQrSlugs[value.toUpperCase()];
  if (knownSlug) {
    return knownSlug;
  }

  try {
    const parsedUrl = new URL(value, window.location.origin);
    const slugFromQuery =
      parsedUrl.searchParams.get('slug') ??
      parsedUrl.searchParams.get('institutionSlug') ??
      parsedUrl.searchParams.get('institution');

    if (parsedUrl.pathname.startsWith('/institutions/')) {
      const fromPath = parsedUrl.pathname.split('/institutions/')[1]?.split('/')[0];
      if (fromPath) {
        return decodeURIComponent(fromPath);
      }
    }

    if (slugFromQuery) {
      return slugFromQuery;
    }
  } catch {
    // Fall through to the bare-slug case.
  }

  if (/^[a-z0-9-]+$/i.test(value)) {
    return value.toLowerCase();
  }

  return null;
}

export function normalizeQrDestination(rawValue) {
  const slug = extractInstitutionSlug(rawValue);
  return slug ? `/institutions/${encodeURIComponent(slug)}#info` : null;
}
