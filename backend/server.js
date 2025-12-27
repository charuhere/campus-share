// Entry point - Start the Server with Socket.io
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { app, connectDB } from './src/app.js';
import { initializeSocket } from './src/socket/chat.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
};

startServer();
