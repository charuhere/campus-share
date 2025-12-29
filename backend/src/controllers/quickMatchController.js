// Quick Match Controller - Handles instant ride matching logic
// Core intelligence: GPS distance, destination, and time-based matching

import QuickMatchSession from '../models/QuickMatchSession.js';
import QuickMatchMessage from '../models/QuickMatchMessage.js';
import User from '../models/User.js';

// Haversine formula - calculates distance between two GPS points in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};


// Create a new Quick Match session
export const createSession = async (req, res) => {
    try {
        const { latitude, longitude, destination, meetupPoint, maxParticipants } = req.body;

        // Validate required fields
        if (!latitude || !longitude || !destination) {
            return res.status(400).json({
                error: 'Missing required fields: latitude, longitude, destination'
            });
        }

        // Check if user already has an active session
        const existingSession = await QuickMatchSession.findOne({
            $or: [
                { creator: req.user._id },
                { 'participants.user': req.user._id }
            ],
            status: { $in: ['searching', 'matched'] },
            expiresAt: { $gt: new Date() }
        });

        if (existingSession) {
            return res.status(400).json({
                error: 'You already have an active Quick Match session',
                sessionId: existingSession._id
            });
        }

        // Create new session (use real name instead of random nickname)
        const session = await QuickMatchSession.create({
            creator: req.user._id,
            creatorNickname: req.user.name,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
            },
            destination: {
                id: destination.id,
                name: destination.name,
            },
            maxParticipants: maxParticipants || 4, // Allow custom max participants (default 4)
            meetupPoint: meetupPoint ? {
                name: meetupPoint.name,
                coordinates: meetupPoint.coordinates
            } : undefined,
        });

        res.status(201).json({
            message: 'Quick Match session created!',
            session: {
                _id: session._id,
                nickname: session.creatorNickname,
                destination: session.destination,
                status: session.status,
                expiresAt: session.expiresAt,
                timeRemaining: session.timeRemaining,
                participantCount: session.participantCount,
            }
        });

    } catch (error) {
        console.error('Create Quick Match error:', error);
        res.status(500).json({ error: 'Failed to create Quick Match session' });
    }
};

// Find nearby Quick Match sessions
export const findNearby = async (req, res) => {
    try {
        const { latitude, longitude, destination, radius = 100 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required fields: latitude, longitude'
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const searchRadius = Math.min(parseInt(radius), 500); // Max 500m

        // Find sessions:
        // 1. Active (searching or matched)
        // 2. Not expired
        // 3. Within radius
        // 4. Same destination (if provided)
        // 5. Not created by current user
        // 6. User not already a participant
        const query = {
            status: { $in: ['searching', 'matched'] },
            expiresAt: { $gt: new Date() },
            creator: { $ne: req.user._id },
            'participants.user': { $ne: req.user._id },
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: searchRadius
                }
            }
        };

        // Filter by destination if provided
        if (destination) {
            query['destination.id'] = destination;
        }

        const sessions = await QuickMatchSession.find(query)
            .select('-participants.user -creator') // Privacy: don't expose user IDs
            .limit(10)
            .lean();

        // Calculate distance for each session
        const sessionsWithDistance = sessions.map(session => {
            const [sessionLng, sessionLat] = session.location.coordinates;
            const distance = calculateDistance(lat, lng, sessionLat, sessionLng);

            return {
                _id: session._id,
                destination: session.destination,
                creatorNickname: session.creatorNickname,
                participantCount: (session.participants?.length || 0) + 1,
                maxParticipants: session.maxParticipants,
                availableSpots: session.maxParticipants - ((session.participants?.length || 0) + 1),
                distance: Math.round(distance), // meters
                status: session.status,
                meetupPoint: session.meetupPoint,
                expiresAt: session.expiresAt,
                timeRemaining: Math.max(0, Math.floor((new Date(session.expiresAt) - new Date()) / 1000)),
                createdAt: session.createdAt,
            };
        });

        res.json({
            count: sessionsWithDistance.length,
            sessions: sessionsWithDistance,
        });

    } catch (error) {
        console.error('Find nearby error:', error);
        res.status(500).json({ error: 'Failed to find nearby sessions' });
    }
};

// Join a Quick Match session
export const joinSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude } = req.body;

        const session = await QuickMatchSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if session is still active
        if (session.status !== 'searching' && session.status !== 'matched') {
            return res.status(400).json({ error: 'Session is no longer active' });
        }

        // Check if expired
        if (session.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Session has expired' });
        }

        // Check if user is the creator
        if (session.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'You cannot join your own session' });
        }

        // Check if already joined
        const alreadyJoined = session.participants.some(
            p => p.user.toString() === req.user._id.toString()
        );
        if (alreadyJoined) {
            return res.status(400).json({ error: 'Already joined this session' });
        }

        // Check if session is full or manually closed
        if (session.isClosed) {
            return res.status(400).json({ error: 'Room is closed' });
        }

        if (session.participants.length + 1 >= session.maxParticipants) {
            return res.status(400).json({ error: 'Session is full' });
        }

        // Add user to participants (use real name)
        const nickname = req.user.name;
        session.participants.push({
            user: req.user._id,
            nickname: nickname,
            location: latitude && longitude ? {
                type: 'Point',
                coordinates: [longitude, latitude]
            } : undefined,
            joinedAt: new Date(),
        });

        // Update status to 'matched' if 2+ people now
        if (session.participants.length >= 1) { // Creator + at least 1 participant
            session.status = 'matched';
        }

        await session.save();

        res.json({
            message: 'Joined Quick Match session!',
            session: {
                _id: session._id,
                nickname: nickname,
                destination: session.destination,
                creatorNickname: session.creatorNickname,
                status: session.status,
                participantCount: session.participants.length + 1,
                meetupPoint: session.meetupPoint,
                expiresAt: session.expiresAt,
                timeRemaining: session.timeRemaining,
            }
        });

    } catch (error) {
        console.error('Join session error:', error);
        res.status(500).json({ error: 'Failed to join session' });
    }
};

// Leave a Quick Match session
export const leaveSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await QuickMatchSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // If user is the creator, they must cancel (not leave)
        if (session.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({
                error: 'Creator cannot leave. Use cancel instead.'
            });
        }

        // Find and remove participant
        const participantIndex = session.participants.findIndex(
            p => p.user.toString() === req.user._id.toString()
        );

        if (participantIndex === -1) {
            return res.status(400).json({ error: 'You are not in this session' });
        }

        session.participants.splice(participantIndex, 1);

        // Update status back to 'searching' if less than 2 people
        if (session.participants.length === 0) {
            session.status = 'searching';
        }

        await session.save();

        res.json({ message: 'Left Quick Match session' });

    } catch (error) {
        console.error('Leave session error:', error);
        res.status(500).json({ error: 'Failed to leave session' });
    }
};

// Cancel a Quick Match session (creator only)
export const cancelSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await QuickMatchSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only creator can cancel
        if (session.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: 'Only the creator can cancel this session'
            });
        }

        // Delete the session
        await QuickMatchSession.findByIdAndDelete(id);

        // Also delete associated messages
        await QuickMatchMessage.deleteMany({ session: id });

        res.json({ message: 'Quick Match session cancelled' });

    } catch (error) {
        console.error('Cancel session error:', error);
        res.status(500).json({ error: 'Failed to cancel session' });
    }
};

// Close a Quick Match session (creator only - no more joins)
export const closeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await QuickMatchSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only creator can close
        if (session.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: 'Only the creator can close this session'
            });
        }

        // Toggle isClosed
        session.isClosed = !session.isClosed;
        await session.save();

        res.json({
            message: session.isClosed ? 'Room closed' : 'Room reopened',
            isClosed: session.isClosed
        });

    } catch (error) {
        console.error('Close session error:', error);
        res.status(500).json({ error: 'Failed to close session' });
    }
};

// Get user's active Quick Match session
export const getActiveSession = async (req, res) => {
    try {
        const session = await QuickMatchSession.findOne({
            $or: [
                { creator: req.user._id },
                { 'participants.user': req.user._id }
            ],
            status: { $in: ['searching', 'matched'] },
            expiresAt: { $gt: new Date() }
        }).populate('creator', 'name').lean();

        if (!session) {
            return res.json({ session: null });
        }

        // Determine user's nickname in this session
        let userNickname;
        let isCreator = false;

        if (session.creator._id.toString() === req.user._id.toString()) {
            userNickname = session.creatorNickname;
            isCreator = true;
        } else {
            const participant = session.participants.find(
                p => p.user.toString() === req.user._id.toString()
            );
            userNickname = participant?.nickname;
        }

        // Get all nicknames for display (privacy: only nicknames, no user IDs)
        const allNicknames = [
            session.creatorNickname,
            ...session.participants.map(p => p.nickname)
        ];

        res.json({
            session: {
                _id: session._id,
                myNickname: userNickname,
                isCreator: isCreator,
                destination: session.destination,
                status: session.status,
                participantCount: session.participants.length + 1,
                maxParticipants: session.maxParticipants,
                participants: allNicknames,
                meetupPoint: session.meetupPoint,
                expiresAt: session.expiresAt,
                timeRemaining: Math.max(0, Math.floor((new Date(session.expiresAt) - new Date()) / 1000)),
                createdAt: session.createdAt,
            }
        });

    } catch (error) {
        console.error('Get active session error:', error);
        res.status(500).json({ error: 'Failed to get active session' });
    }
};

// Get session by ID (for participants only)
export const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await QuickMatchSession.findById(id).lean();

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if user is creator or participant
        const isCreator = session.creator.toString() === req.user._id.toString();
        const isParticipant = session.participants.some(
            p => p.user.toString() === req.user._id.toString()
        );

        if (!isCreator && !isParticipant) {
            return res.status(403).json({ error: 'Not authorized to view this session' });
        }

        // Get user's nickname
        let userNickname = isCreator ? session.creatorNickname :
            session.participants.find(p => p.user.toString() === req.user._id.toString())?.nickname;

        // Get all nicknames
        const allNicknames = [
            session.creatorNickname,
            ...session.participants.map(p => p.nickname)
        ];

        res.json({
            session: {
                _id: session._id,
                myNickname: userNickname,
                isCreator: isCreator,
                destination: session.destination,
                status: session.status,
                participantCount: session.participants.length + 1,
                maxParticipants: session.maxParticipants,
                participants: allNicknames,
                meetupPoint: session.meetupPoint,
                expiresAt: session.expiresAt,
                timeRemaining: Math.max(0, Math.floor((new Date(session.expiresAt) - new Date()) / 1000)),
                createdAt: session.createdAt,
            }
        });

    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
};
