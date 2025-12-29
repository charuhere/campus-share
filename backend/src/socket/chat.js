// Socket.io Setup for Real-time Chat

import { Server } from 'socket.io';
import { getFirebaseAdmin } from '../config/firebase.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Ride from '../models/Ride.js';
import QuickMatchSession from '../models/QuickMatchSession.js';
import QuickMatchMessage from '../models/QuickMatchMessage.js';

let io;

export function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:3000'],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('No token provided'));
            }

            // Verify Firebase token
            const admin = getFirebaseAdmin();
            const decodedToken = await admin.auth().verifyIdToken(token);

            // Find user
            const user = await User.findOne({ firebaseUid: decodedToken.uid });

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user to socket
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    // Handle connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.name}`);

        // ===== RIDE CHAT (Planned Rides) =====

        // Join a ride's chat room
        socket.on('join-ride', async (rideId) => {
            try {
                // Verify user is a participant of this ride
                const ride = await Ride.findById(rideId);

                if (!ride) {
                    socket.emit('error', 'Ride not found');
                    return;
                }

                const isParticipant = ride.participants.some(
                    p => p.user.toString() === socket.user._id.toString()
                );

                if (!isParticipant) {
                    socket.emit('error', 'You are not a participant of this ride');
                    return;
                }

                // Join the room
                socket.join(`ride-${rideId}`);
                console.log(`${socket.user.name} joined ride-${rideId}`);

                // Send recent messages
                const messages = await Message.find({ ride: rideId })
                    .sort({ createdAt: 1 })
                    .limit(50);

                socket.emit('previous-messages', messages);
            } catch (error) {
                socket.emit('error', 'Failed to join ride chat');
            }
        });

        // Leave a ride's chat room
        socket.on('leave-ride', (rideId) => {
            socket.leave(`ride-${rideId}`);
            console.log(`${socket.user.name} left ride-${rideId}`);
        });

        // Send a message (Ride chat)
        socket.on('send-message', async ({ rideId, content }) => {
            try {
                if (!content || !content.trim()) {
                    return;
                }

                // Create message in database
                const message = await Message.create({
                    ride: rideId,
                    sender: socket.user._id,
                    senderName: socket.user.name,
                    content: content.trim(),
                });

                // Broadcast to all in the room (including sender)
                io.to(`ride-${rideId}`).emit('new-message', {
                    _id: message._id,
                    ride: rideId,
                    sender: socket.user._id,
                    senderName: socket.user.name,
                    content: message.content,
                    createdAt: message.createdAt,
                });
            } catch (error) {
                socket.emit('error', 'Failed to send message');
            }
        });

        // ===== QUICK MATCH CHAT (Temporary Sessions) =====

        // Join a Quick Match session's chat room
        socket.on('join-quick-match', async (sessionId) => {
            try {
                const session = await QuickMatchSession.findById(sessionId);

                if (!session) {
                    socket.emit('qm-error', 'Session not found');
                    return;
                }

                // Check if session is expired
                if (session.expiresAt < new Date()) {
                    socket.emit('qm-error', 'Session has expired');
                    return;
                }

                // Check if user is creator or participant
                const isCreator = session.creator.toString() === socket.user._id.toString();
                const isParticipant = session.participants.some(
                    p => p.user.toString() === socket.user._id.toString()
                );

                if (!isCreator && !isParticipant) {
                    socket.emit('qm-error', 'You are not in this Quick Match session');
                    return;
                }

                // Get user's nickname
                let nickname;
                if (isCreator) {
                    nickname = session.creatorNickname;
                } else {
                    const participant = session.participants.find(
                        p => p.user.toString() === socket.user._id.toString()
                    );
                    nickname = participant?.nickname;
                }

                // Store nickname on socket for later use
                socket.qmNickname = nickname;
                socket.qmSessionId = sessionId;

                // Join the room
                socket.join(`qm-${sessionId}`);
                console.log(`${nickname} joined Quick Match session ${sessionId}`);

                // Send recent messages (privacy: only nicknames, not real names)
                const messages = await QuickMatchMessage.find({ session: sessionId })
                    .select('senderNickname content createdAt')
                    .sort({ createdAt: 1 })
                    .limit(30);

                socket.emit('qm-previous-messages', messages);

                // Notify others that someone joined
                socket.to(`qm-${sessionId}`).emit('qm-user-joined', { nickname });

            } catch (error) {
                console.error('Join Quick Match error:', error);
                socket.emit('qm-error', 'Failed to join Quick Match chat');
            }
        });

        // Leave a Quick Match session's chat room
        socket.on('leave-quick-match', (sessionId) => {
            const nickname = socket.qmNickname;
            socket.leave(`qm-${sessionId}`);
            console.log(`${nickname || 'User'} left Quick Match session ${sessionId}`);

            // Notify others
            socket.to(`qm-${sessionId}`).emit('qm-user-left', { nickname });

            // Clear session data from socket
            socket.qmNickname = null;
            socket.qmSessionId = null;
        });

        // Send a message (Quick Match - uses nicknames)
        socket.on('send-qm-message', async ({ sessionId, content }) => {
            try {
                if (!content || !content.trim()) {
                    return;
                }

                // Verify user is in this session
                const session = await QuickMatchSession.findById(sessionId);
                if (!session) {
                    socket.emit('qm-error', 'Session not found');
                    return;
                }

                // Check if expired
                if (session.expiresAt < new Date()) {
                    socket.emit('qm-error', 'Session has expired');
                    return;
                }

                // Get user's nickname
                const isCreator = session.creator.toString() === socket.user._id.toString();
                let nickname;
                if (isCreator) {
                    nickname = session.creatorNickname;
                } else {
                    const participant = session.participants.find(
                        p => p.user.toString() === socket.user._id.toString()
                    );
                    if (!participant) {
                        socket.emit('qm-error', 'You are not in this session');
                        return;
                    }
                    nickname = participant.nickname;
                }

                // Create message in database (with TTL auto-delete)
                const message = await QuickMatchMessage.create({
                    session: sessionId,
                    sender: socket.user._id,
                    senderNickname: nickname,
                    content: content.trim().substring(0, 500), // Max 500 chars
                });

                // Broadcast to all in the room (with nickname, not real name)
                io.to(`qm-${sessionId}`).emit('qm-new-message', {
                    _id: message._id,
                    session: sessionId,
                    senderNickname: nickname,
                    content: message.content,
                    createdAt: message.createdAt,
                });
            } catch (error) {
                console.error('Send QM message error:', error);
                socket.emit('qm-error', 'Failed to send message');
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.name}`);

            // Clean up Quick Match if needed
            if (socket.qmSessionId) {
                socket.to(`qm-${socket.qmSessionId}`).emit('qm-user-left', {
                    nickname: socket.qmNickname
                });
            }
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

