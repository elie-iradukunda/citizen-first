const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'cf_auth_token';

function getAuthHeaders(withJson = false) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  return {
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed with status ${response.status}`);
  }

  return data;
}

async function postJson(path, payload = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed with status ${response.status}`);
  }

  return data;
}

export function fetchDashboardOverview() {
  return request('/api/dashboard/overview');
}

export function fetchCitizenDashboard() {
  return request('/api/dashboard/citizen');
}

export function fetchCitizenContext(filters = {}) {
  const params = new URLSearchParams();
  const keys = ['province', 'district', 'sector', 'cell', 'village', 'institution'];
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
  return postJson('/api/dashboard/citizen/complaints', payload);
}

export function acceptCitizenFeedback(complaintId, payload = {}) {
  return postJson(`/api/dashboard/citizen/complaints/${complaintId}/accept-feedback`, payload);
}

export function escalateCitizenComplaint(complaintId, payload = {}) {
  return postJson(`/api/dashboard/citizen/complaints/${complaintId}/escalate`, payload);
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

export function submitOfficerComplaintResponse(complaintId, payload) {
  return postJson(`/api/dashboard/officer/complaints/${complaintId}/respond`, payload);
}
