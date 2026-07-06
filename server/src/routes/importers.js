import express from 'express';
import { importEvidence } from '../controllers/importersController.js';

const router = express.Router();

router.post('/:assessmentId/import', importEvidence);

export default router;
