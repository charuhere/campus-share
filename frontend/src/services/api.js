// API Service - Makes requests to our backend
// Uses axios with automatic token attachment

import axios from 'axios';
import { auth } from '../config/firebase';

// Create axios instance with base URL
const api = axios.create({
    baseURL: '/api',
});

// Interceptor - runs before EVERY request
// Automatically attaches the Firebase token
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;

    if (user) {
        // Get the current token
        const token = await user.getIdToken();
        // Attach to request header
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
