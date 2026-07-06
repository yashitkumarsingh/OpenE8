import express from 'express';
import { register, login, logout, getMe, loginWithEntra } from '../controllers/authController.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.post('/entra', loginWithEntra);
router.get('/me', requireAuth, getMe);

export default router;
