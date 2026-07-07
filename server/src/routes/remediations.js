import express from 'express';
import { updateRemediation, deleteRemediation } from '../controllers/remediationsController.js';
import { requireAuth, requireRole } from '../authMiddleware.js';

const router = express.Router();

router.put('/:id', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), updateRemediation);
router.delete('/:id', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), deleteRemediation);

export default router;
