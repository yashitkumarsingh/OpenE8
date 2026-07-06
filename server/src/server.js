import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routers
import authRouter from './routes/auth.js';
import systemsRouter from './routes/systems.js';
import assessmentsRouter from './routes/assessments.js';
import importersRouter from './routes/importers.js';
import controlTestsRouter from './routes/controlTests.js';
import exceptionsRouter from './routes/exceptions.js';
import remediationsRouter from './routes/remediations.js';
import evidenceRouter from './routes/evidence.js';
import { requireAuth } from './authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Read catalog from data directory
const catalogPath = path.join(__dirname, '../../data/essential-eight/controls.json');
let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (err) {
  console.error('Error loading controls catalog in server.js:', err);
}

// 1. Auth routes (Public access)
app.use('/api/auth', authRouter);

// 2. Controls Catalog API Route (Authenticated)
app.get('/api/catalog', requireAuth, (req, res) => {
  res.json(catalog);
});

// 3. Mount Decoupled Resource Routers (Authenticated)
app.use('/api/systems', requireAuth, systemsRouter);
app.use('/api/assessments', requireAuth, assessmentsRouter);
app.use('/api/assessments', requireAuth, importersRouter);
app.use('/api/control-tests', requireAuth, controlTestsRouter);
app.use('/api/exceptions', requireAuth, exceptionsRouter);
app.use('/api/remediations', requireAuth, remediationsRouter);
app.use('/api/evidence', requireAuth, evidenceRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`OpenE8 Governance API running on http://localhost:${PORT}`);
});
