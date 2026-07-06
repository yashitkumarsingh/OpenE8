import express from 'express';
import { deleteEvidence, verifyEvidenceIntegrity } from '../controllers/controlTestsController.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();

router.delete('/:id', requireAuth, deleteEvidence);
router.post('/:id/verify', requireAuth, verifyEvidenceIntegrity);

export default router;
