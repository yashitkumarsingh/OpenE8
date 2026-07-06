import express from 'express';
import { updateAssessment, signOffAssessment } from '../controllers/assessmentsController.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();

router.put('/:id', requireAuth, updateAssessment);
router.post('/:id/sign-off', requireAuth, signOffAssessment);

export default router;
