const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
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

export function fetchNotifications() {
  return request('/api/dashboard/notifications');
}

export function markNotificationsRead() {
  return postJson('/api/dashboard/notifications/read');
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

export function startComplaintReview(complaintId, payload = {}) {
  return postJson(`/api/dashboard/officer/complaints/${complaintId}/start-review`, payload);
}

export function sendComplaintMessage(complaintId, body) {
  return postJson(`/api/dashboard/complaints/${complaintId}/messages`, { body });
}

// Spreadsheet export. The file is fetched with the auth header rather than
// opened via a plain link, because a link cannot carry the bearer token — the
// server would reject it, or worse, serve it to anyone who copied the URL.
export async function downloadDashboardExport(dataset) {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/exports/${dataset}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message ?? `Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const suggestedName = disposition.match(/filename="?([^"]+)"?/)?.[1];
  const filename = suggestedName ?? `saccfp-${dataset}.csv`;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  return filename;
}
