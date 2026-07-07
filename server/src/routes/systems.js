import express from 'express';
import { 
  getSystems, createSystem, getSystemById, 
  updateSystem, deleteSystem, getSystemReport, exportAuditLogs
} from '../controllers/systemsController.js';
import { createAssessment } from '../controllers/assessmentsController.js';
import { getExceptions, createException } from '../controllers/exceptionsController.js';
import { getRemediations, createRemediation } from '../controllers/remediationsController.js';
import { requireAuth, requireRole } from '../authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, getSystems);
router.post('/', requireAuth, requireRole(['SYSTEM_OWNER', 'ASSESSOR']), createSystem);
router.get('/:id', requireAuth, getSystemById);
router.put('/:id', requireAuth, requireRole(['SYSTEM_OWNER', 'ASSESSOR']), updateSystem);
router.delete('/:id', requireAuth, requireRole(['SYSTEM_OWNER', 'ASSESSOR']), deleteSystem);
router.get('/:id/report', requireAuth, getSystemReport);
router.get('/:id/audit/export', requireAuth, exportAuditLogs);

// Nested routes mapping to assessments, exceptions, remediations under system boundary
router.post('/:systemId/assessments', requireAuth, requireRole(['SYSTEM_OWNER', 'ASSESSOR']), createAssessment);
router.get('/:systemId/exceptions', requireAuth, getExceptions);
router.post('/:systemId/exceptions', requireAuth, requireRole(['SYSTEM_OWNER', 'ASSESSOR']), createException);
router.get('/:systemId/remediations', requireAuth, getRemediations);
router.post('/:systemId/remediations', requireAuth, requireRole(['SYSTEM_OWNER', 'ASSESSOR']), createRemediation);

export default router;
