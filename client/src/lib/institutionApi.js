const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed with status ${response.status}`);
  }

  return data;
}

export function fetchInstitutionProfile(slug) {
  return request(`/api/institutions/${slug}`);
}

export function fetchInstitutionQr(slug) {
  return request(`/api/institutions/${slug}/qr`);
}
