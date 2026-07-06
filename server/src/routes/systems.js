import express from 'express';
import { 
  getSystems, createSystem, getSystemById, 
  updateSystem, deleteSystem, getSystemReport, exportAuditLogs
} from '../controllers/systemsController.js';
import { createAssessment } from '../controllers/assessmentsController.js';
import { getExceptions, createException } from '../controllers/exceptionsController.js';
import { getRemediations, createRemediation } from '../controllers/remediationsController.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, getSystems);
router.post('/', requireAuth, createSystem);
router.get('/:id', requireAuth, getSystemById);
router.put('/:id', requireAuth, updateSystem);
router.delete('/:id', requireAuth, deleteSystem);
router.get('/:id/report', requireAuth, getSystemReport);
router.get('/:id/audit/export', requireAuth, exportAuditLogs);

// Nested routes mapping to assessments, exceptions, remediations under system boundary
router.post('/:systemId/assessments', requireAuth, createAssessment);
router.get('/:systemId/exceptions', requireAuth, getExceptions);
router.post('/:systemId/exceptions', requireAuth, createException);
router.get('/:systemId/remediations', requireAuth, getRemediations);
router.post('/:systemId/remediations', requireAuth, createRemediation);

export default router;
