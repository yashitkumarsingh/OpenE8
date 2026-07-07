import express from 'express';
import { deleteEvidence, verifyEvidenceIntegrity, downloadEvidence } from '../controllers/controlTestsController.js';
import { requireAuth, requireRole } from '../authMiddleware.js';

const router = express.Router();

router.delete('/:id', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), deleteEvidence);
router.post('/:id/verify', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), verifyEvidenceIntegrity);
router.get('/:id/download', requireAuth, downloadEvidence);

export default router;
