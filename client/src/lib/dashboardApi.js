const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'cf_auth_token';

async function request(path) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export function fetchDashboardOverview() {
  return request('/api/dashboard/overview');
}

export function fetchCitizenDashboard() {
  return request('/api/dashboard/citizen');
}

export function fetchCitizenContext(filters = {}) {
  const params = new URLSearchParams();
  const keys = ['province', 'district', 'sector', 'cell', 'village'];
  keys.forEach((key) => {
    const value = filters[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      params.set(key, value.trim());
    }
  });

  const query = params.toString();
  return request(`/api/dashboard/citizen/context${query ? `?${query}` : ''}`);
}

export async function submitCitizenComplaint(payload) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}/api/dashboard/citizen/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed with status ${response.status}`);
  }

  return data;
}

export function fetchOfficerDashboard() {
  return request('/api/dashboard/officer');
}

export function fetchOfficerExplorer(filters = {}) {
  const params = new URLSearchParams();
  const keys = ['province', 'district', 'sector', 'cell', 'village'];

  keys.forEach((key) => {
    const value = filters[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      params.set(key, value.trim());
    }
  });

  const query = params.toString();
  return request(`/api/dashboard/officer/explorer${query ? `?${query}` : ''}`);
}

export function fetchAdminDashboard() {
  return request('/api/dashboard/admin');
}
