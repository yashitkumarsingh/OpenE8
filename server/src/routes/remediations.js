import express from 'express';
import { updateRemediation, deleteRemediation } from '../controllers/remediationsController.js';

const router = express.Router();

router.put('/:id', updateRemediation);
router.delete('/:id', deleteRemediation);

export default router;
