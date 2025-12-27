// Trust Routes

import { Router } from 'express';
import { addTrust, removeTrust, getTrustedUsers, checkTrust } from '../controllers/trustController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Get my trusted users list
router.get('/', authMiddleware, getTrustedUsers);

// Add user to trusted list
router.post('/:userId', authMiddleware, addTrust);

// Remove user from trusted list
router.delete('/:userId', authMiddleware, removeTrust);

// Check if a user is trusted
router.get('/check/:userId', authMiddleware, checkTrust);

export default router;
