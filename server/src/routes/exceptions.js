import express from 'express';
import { updateException, deleteException } from '../controllers/exceptionsController.js';

const router = express.Router();

router.put('/:id', updateException);
router.delete('/:id', deleteException);

export default router;
