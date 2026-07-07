import express from 'express';
import { updateException, deleteException } from '../controllers/exceptionsController.js';
import { requireAuth, requireRole } from '../authMiddleware.js';

const router = express.Router();

router.put('/:id', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), updateException);
router.delete('/:id', requireAuth, requireRole(['ASSESSOR', 'SYSTEM_OWNER']), deleteException);

export default router;
