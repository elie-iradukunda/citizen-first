import assistantRoutes from './routes/assistantRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import complaintRoutes from './routes/complaintRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import { requireAuth } from './middleware/authMiddleware.js';
import publicInfoRoutes from './routes/publicInfoRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  }),
);
app.use(express.json({ limit: '12mb' }));

app.get('/', (_request, response) => {
  response.json({
    name: 'SACCFP API',
    version: '1.0.0',
    description:
      'Backend foundation for civic reporting, QR access, complaint tracking, and escalation workflows.',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/public', publicInfoRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/registration', registrationRoutes);

if (existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^\/(?!api(?:\/|$)).*/, (_request, response) => {
    response.sendFile(clientIndexPath);
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);

  response.status(500).json({
    message: 'An unexpected server error occurred.',
  });
});

export default app;
