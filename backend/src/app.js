// Express Application Setup
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/authRoutes.js';
import rideRoutes from './routes/rideRoutes.js';

const app = express();

// MIDDLEWARE
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DATABASE CONNECTION
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully!');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// TEST ROUTES
app.get('/', (req, res) => {
    res.json({
        message: '🚗 Campus RideShare API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

// ERROR HANDLING
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
});

export { app, connectDB };
