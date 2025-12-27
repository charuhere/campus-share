// Auth Routes

import { Router } from 'express';
import { register, getMe, updateProfile } from '../controllers/authController.js';
import authMiddleware, { firebaseAuthMiddleware } from '../middleware/auth.js';

const router = Router();

// Register user in MongoDB (after Firebase signup)
// Uses firebaseAuthMiddleware - only verifies token, user doesn't exist in DB yet
router.post('/register', firebaseAuthMiddleware, register);

// Get current user's profile
router.get('/me', authMiddleware, getMe);

// Update user's profile
router.put('/profile', authMiddleware, updateProfile);

export default router;
