import express from 'express';
import { importEvidence } from '../controllers/importersController.js';
import { requireAuth, requireRole } from '../authMiddleware.js';

const router = express.Router();

router.post('/:assessmentId/import', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), importEvidence);

export default router;
