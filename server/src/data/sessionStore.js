import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_FILE = path.resolve(__dirname, '../../.sessions.json');
const activeSessions = new Map();

function persistSessions() {
  try {
    const payload = JSON.stringify(Object.fromEntries(activeSessions), null, 2);
    fs.writeFileSync(SESSIONS_FILE, payload, 'utf8');
  } catch (error) {
    console.warn('Failed to persist auth sessions to disk.');
    console.warn(error);
  }
}

function loadSessions() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      return;
    }

    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    if (!raw.trim()) {
      return;
    }

    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([token, session]) => {
      activeSessions.set(token, session);
    });
  } catch (error) {
    console.warn('Failed to load persisted auth sessions. Starting with empty sessions.');
    console.warn(error);
  }
}

loadSessions();

export function createSession(token, sessionData) {
  activeSessions.set(token, sessionData);
  persistSessions();
}

export function getSession(token) {
  return activeSessions.get(token) ?? null;
}

export function updateSession(token, nextSessionData) {
  activeSessions.set(token, nextSessionData);
  persistSessions();
}

export function removeSession(token) {
  const removed = activeSessions.delete(token);
  if (removed) {
    persistSessions();
  }
  return removed;
}

export { activeSessions };
