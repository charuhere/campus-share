// Socket Service - Connect to backend WebSocket

import { io } from 'socket.io-client';
import { auth } from '../config/firebase';

let socket = null;

export async function connectSocket() {
    if (socket?.connected) return socket;

    // Get current user's token
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();

    // Connect to backend (dynamically using same host as frontend, port 5000)
    const socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    socket = io(socketUrl, {
        auth: { token },
    });

    socket.on('connect', () => {
        console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    return socket;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
