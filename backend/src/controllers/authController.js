// Auth Controller - Handles user registration and profile

import User from '../models/User.js';

// Register user in MongoDB after Firebase signup
// Called AFTER frontend signs up user with Firebase
export const register = async (req, res) => {
    try {
        const { name, phone, hostel, department } = req.body;
        const { uid, email } = req.firebaseUser; // From auth middleware

        // Check if user already exists
        const existingUser = await User.findOne({ firebaseUid: uid });
        if (existingUser) {
            return res.status(400).json({ error: 'User already registered' });
        }

        // Validate VIT email
        if (!email.endsWith('@vitstudent.ac.in')) {
            return res.status(400).json({ error: 'Only VIT student emails allowed' });
        }

        // Create new user (only name is required)
        const user = await User.create({
            firebaseUid: uid,
            email,
            name,
            phone: phone || '',
            hostel: hostel || '',
            department: department || '',
        });

        res.status(201).json({
            message: 'User registered successfully',
            user,
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Get current logged-in user's profile
export const getMe = async (req, res) => {
    try {
        // req.user is set by auth middleware
        res.json({ user: req.user });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, phone, hostel, department } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, hostel, department },
            { new: true } // Return updated document
        );

        res.json({ user: updatedUser });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
