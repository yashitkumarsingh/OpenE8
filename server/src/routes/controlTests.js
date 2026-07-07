import express from 'express';
import { updateControlTest, addEvidence } from '../controllers/controlTestsController.js';
import { requireAuth, requireRole } from '../authMiddleware.js';

const router = express.Router();

router.put('/:id', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), updateControlTest);
router.post('/:testId/evidence', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), addEvidence);

export default router;
