// Quick Match Routes - Instant ride matching API endpoints

import { Router } from 'express';
import {
    createSession,
    findNearby,
    joinSession,
    leaveSession,
    cancelSession,
    closeSession,
    getActiveSession,
    getSessionById,
} from '../controllers/quickMatchController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's active Quick Match session
router.get('/active', getActiveSession);

// Find nearby Quick Match sessions
router.get('/nearby', findNearby);

// Create a new Quick Match session (start searching)
router.post('/', createSession);

// Get session by ID (for participants only)
router.get('/:id', getSessionById);

// Join a Quick Match session
router.post('/:id/join', joinSession);

// Close/reopen a Quick Match session (creator only)
router.post('/:id/close', closeSession);

// Leave a Quick Match session
router.delete('/:id/leave', leaveSession);

// Cancel a Quick Match session (creator only)
router.delete('/:id', cancelSession);

export default router;
