// Ride Routes

import { Router } from 'express';
import {
    createRide,
    getRides,
    getRideById,
    joinRide,
    leaveRide,
    cancelRide,
    closeRide,
    getMyRides,
    getJoinedRides,
} from '../controllers/rideController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Get all available rides (with optional filters)
router.get('/', authMiddleware, getRides);

// Get rides created by current user
router.get('/my/created', authMiddleware, getMyRides);

// Get rides user has joined
router.get('/my/joined', authMiddleware, getJoinedRides);

// Create a new ride
router.post('/', authMiddleware, createRide);

// Get single ride details
router.get('/:id', authMiddleware, getRideById);

// Join a ride
router.post('/:id/join', authMiddleware, joinRide);

// Leave a ride
router.delete('/:id/leave', authMiddleware, leaveRide);

// Cancel a ride (creator only)
router.put('/:id/cancel', authMiddleware, cancelRide);

// Close/reopen a ride (creator only - no more joins)
router.post('/:id/close', authMiddleware, closeRide);

export default router;
