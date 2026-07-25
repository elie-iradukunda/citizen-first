// Self-contained test runner: boots the API in-process (in-memory, no DB)
// on an ephemeral port, then runs the node:test suite against it.
import { spawn } from 'node:child_process';

process.env.DB_DISABLED = 'true';
// Tests must never read or overwrite the saved data snapshot: they run against
// the seed data, and their throwaway institutions would otherwise be written
// into whatever the developer created in the running app.
process.env.DATA_PERSISTENCE = 'false';

const { default: app } = await import('../src/app.js');

const server = app.listen(0, () => {
  const { port } = server.address();
  const base = `http://localhost:${port}`;
  console.log(`[test] in-memory API listening on ${base}`);

  const child = spawn(process.execPath, ['--test', 'tests/api.test.js'], {
    stdio: 'inherit',
    env: { ...process.env, TEST_BASE_URL: base },
    cwd: process.cwd(),
  });

  child.on('exit', (code) => {
    server.close(() => process.exit(code ?? 0));
  });
});
