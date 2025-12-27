// Trust Controller - Manage trusted users

import User from '../models/User.js';

// Add user to trusted list
export const addTrust = async (req, res) => {
    try {
        const { userId } = req.params;

        // Can't trust yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: "You can't add yourself to trusted list" });
        }

        // Check if user exists
        const userToTrust = await User.findById(userId);
        if (!userToTrust) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already trusted
        if (req.user.trustedUsers?.includes(userId)) {
            return res.status(400).json({ error: 'User already in your trusted list' });
        }

        // Add to trusted list
        await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { trustedUsers: userId } }
        );

        res.json({ message: `Added ${userToTrust.name} to trusted list` });

    } catch (error) {
        console.error('Add trust error:', error);
        res.status(500).json({ error: 'Failed to add trusted user' });
    }
};

// Remove user from trusted list
export const removeTrust = async (req, res) => {
    try {
        const { userId } = req.params;

        await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { trustedUsers: userId } }
        );

        res.json({ message: 'Removed from trusted list' });

    } catch (error) {
        console.error('Remove trust error:', error);
        res.status(500).json({ error: 'Failed to remove trusted user' });
    }
};

// Get trusted users list
export const getTrustedUsers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('trustedUsers', 'name email hostel ridesCompleted');

        res.json({ trustedUsers: user.trustedUsers || [] });

    } catch (error) {
        console.error('Get trusted error:', error);
        res.status(500).json({ error: 'Failed to get trusted users' });
    }
};

// Check if a specific user is trusted
export const checkTrust = async (req, res) => {
    try {
        const { userId } = req.params;
        const isTrusted = req.user.trustedUsers?.includes(userId) || false;

        res.json({ isTrusted });

    } catch (error) {
        console.error('Check trust error:', error);
        res.status(500).json({ error: 'Failed to check trust status' });
    }
};
