// Auth Middleware - Protects routes from unauthorized access

import { getFirebaseAdmin } from '../config/firebase.js';
import User from '../models/User.js';

// Full auth middleware - requires user to exist in MongoDB
const authMiddleware = async (req, res, next) => {
    try {
        const admin = getFirebaseAdmin();
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Find user in MongoDB
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return res.status(401).json({ error: 'User not found. Please complete registration.' });
        }

        req.user = user;
        req.firebaseUser = decodedToken;
        next();

    } catch (error) {
        console.error('Auth error:', error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expired, please login again' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Firebase-only auth - just verifies token, doesn't require MongoDB user
// Used for registration
export const firebaseAuthMiddleware = async (req, res, next) => {
    console.log('🔐 firebaseAuthMiddleware called');
    try {
        const admin = getFirebaseAdmin();
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader ? 'Present' : 'Missing');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        console.log('Token length:', token.length);

        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('✅ Token verified for:', decodedToken.email);

        req.firebaseUser = decodedToken;
        next();

    } catch (error) {
        console.error('❌ Firebase auth error:', error.message);
        return res.status(401).json({ error: 'Invalid token: ' + error.message });
    }
};

export default authMiddleware;
