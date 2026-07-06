import express from 'express';
import { updateControlTest, addEvidence } from '../controllers/controlTestsController.js';

const router = express.Router();

router.put('/:id', updateControlTest);
router.post('/:testId/evidence', addEvidence);

export default router;
