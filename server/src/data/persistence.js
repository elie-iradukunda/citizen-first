import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_FILE = path.resolve(__dirname, '../../.data-snapshot.json');
const AUTOSAVE_INTERVAL_MS = 2000;

// Registrations, staff, and citizen reports live in plain in-memory arrays, so
// without this they vanish on every restart. The snapshot mirrors the approach
// already used for auth sessions: write the arrays to disk whenever they
// change, and load them back on boot before anything reads them.
const tracked = new Map();
let lastWritten = null;

function serialize() {
  const payload = {};
  for (const [name, collection] of tracked.entries()) {
    payload[name] = collection;
  }
  return JSON.stringify(payload, null, 2);
}

export function saveSnapshot() {
  if (tracked.size === 0) {
    return false;
  }

  try {
    const payload = serialize();
    if (payload === lastWritten) {
      return false;
    }

    fs.writeFileSync(SNAPSHOT_FILE, payload, 'utf8');
    lastWritten = payload;
    return true;
  } catch (error) {
    console.warn(`Failed to persist data snapshot: ${error.message}`);
    return false;
  }
}

// Replaces the seeded contents in place — the arrays are exported bindings that
// other modules already hold, so they must be mutated rather than reassigned.
function restore(name, collection, savedItems) {
  if (!Array.isArray(savedItems)) {
    return;
  }

  collection.length = 0;
  collection.push(...savedItems);
}

export function registerPersistedCollections(collections) {
  for (const [name, collection] of Object.entries(collections)) {
    tracked.set(name, collection);
  }

  if (process.env.DATA_PERSISTENCE === 'false') {
    console.info('Data snapshot persistence is disabled (DATA_PERSISTENCE=false).');
    return;
  }

  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
      if (raw.trim()) {
        const saved = JSON.parse(raw);
        for (const [name, collection] of tracked.entries()) {
          restore(name, collection, saved[name]);
        }
        lastWritten = raw;
        console.info('Restored saved data from .data-snapshot.json');
      }
    }
  } catch (error) {
    console.warn(`Could not read the data snapshot, starting from seed data: ${error.message}`);
  }

  const timer = setInterval(saveSnapshot, AUTOSAVE_INTERVAL_MS);
  timer.unref();

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      saveSnapshot();
      process.exit(0);
    });
  }
  process.on('beforeExit', saveSnapshot);
}
