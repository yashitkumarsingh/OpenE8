import express from 'express';
import { updateAssessment, signOffAssessment } from '../controllers/assessmentsController.js';
import { requireAuth, requireRole } from '../authMiddleware.js';

const router = express.Router();

router.put('/:id', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), updateAssessment);
router.post('/:id/sign-off', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), signOffAssessment);

export default router;
