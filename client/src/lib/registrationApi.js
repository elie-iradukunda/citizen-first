const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'cf_auth_token';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export function fetchHierarchy() {
  return request('/api/registration/hierarchy');
}

export function fetchFieldDefinitions() {
  return request('/api/registration/field-definitions');
}

function querySource(source) {
  return source ? `source=${encodeURIComponent(source)}` : '';
}

export function fetchProvinces(source = 'hybrid') {
  const sourceQuery = querySource(source);
  return request(`/api/registration/locations/provinces${sourceQuery ? `?${sourceQuery}` : ''}`);
}

export function fetchLocationTree() {
  return request('/api/registration/locations/tree');
}

export function fetchDistricts(province, source = 'hybrid') {
  return request(
    `/api/registration/locations/districts?province=${encodeURIComponent(province)}&source=${encodeURIComponent(source)}`,
  );
}

export function fetchSectors({ province, district, source = 'hybrid' }) {
  return request(
    `/api/registration/locations/sectors?province=${encodeURIComponent(province)}&district=${encodeURIComponent(
      district,
    )}&source=${encodeURIComponent(source)}`,
  );
}

export function fetchCells({ province, district, sector, source = 'hybrid' }) {
  return request(
    `/api/registration/locations/cells?province=${encodeURIComponent(province)}&district=${encodeURIComponent(
      district,
    )}&sector=${encodeURIComponent(sector)}&source=${encodeURIComponent(source)}`,
  );
}

export function fetchVillages({ province, district, sector, cell, source = 'hybrid' }) {
  return request(
    `/api/registration/locations/villages?province=${encodeURIComponent(
      province,
    )}&district=${encodeURIComponent(district)}&sector=${encodeURIComponent(
      sector,
    )}&cell=${encodeURIComponent(cell)}&source=${encodeURIComponent(source)}`,
  );
}

export function fetchStaffTemplateExamples() {
  return request('/api/registration/staff-template');
}

export function fetchRelationshipTree(accessKey) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (accessKey?.trim()) {
    headers['x-access-key'] = accessKey.trim();
  }

  return request('/api/registration/relationships/tree', {
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}

export function fetchRelationshipChildren(institutionId, accessKey) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (accessKey?.trim()) {
    headers['x-access-key'] = accessKey.trim();
  }

  return request(`/api/registration/relationships/children/${encodeURIComponent(institutionId)}`, {
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}

export function createInstitutionInvite(accessKey, payload) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (accessKey?.trim()) {
    headers['x-access-key'] = accessKey.trim();
  }

  return request('/api/registration/invites', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

export function fetchInviteDetail(inviteToken) {
  return request(`/api/registration/invites/${inviteToken}`);
}

export function completeInstitutionRegistration(payload) {
  return request('/api/registration/institutions/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export function registerCitizen(payload) {
  return request('/api/registration/citizens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
