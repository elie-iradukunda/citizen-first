import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';

dotenv.config();

const { default: app } = await import('./app.js');

const basePort = Number(process.env.PORT ?? 4000);
const maxPortRetries = Number(process.env.PORT_RETRY_ATTEMPTS ?? 5);

async function startServer() {
  await initializeDatabase();

  let port = basePort;

  for (let attempt = 0; attempt <= maxPortRetries; attempt += 1) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`Citizen First API is running on http://localhost:${port}`);
          resolve(server);
        });

        server.once('error', reject);
      });

      return;
    } catch (error) {
      if (error?.code === 'EADDRINUSE' && attempt < maxPortRetries) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
        port = nextPort;
        continue;
      }

      throw error;
    }
  }
}

try {
  await startServer();
} catch (error) {
  console.error('Server startup failed.');
  console.error(
    'Check MySQL availability and your DB env values (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).',
  );
  console.error(error);
  process.exit(1);
}
