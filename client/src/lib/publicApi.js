const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

export function fetchPublicServices() {
  return request('/api/public/services');
}

export function fetchEmergencyContacts() {
  return request('/api/public/emergency-contacts');
}

export function fetchAssistantQuestions() {
  return request('/api/public/assistant-questions');
}

export function askCitizenAssistant(payload) {
  return request('/api/assistant/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
