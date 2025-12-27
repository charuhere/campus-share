// Socket.io Setup for Real-time Chat

import { Server } from 'socket.io';
import { getFirebaseAdmin } from '../config/firebase.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Ride from '../models/Ride.js';

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

        // Send a message
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

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.name}`);
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
