// Ride Controller - Handles ride CRUD operations

import Ride from '../models/Ride.js';
import User from '../models/User.js';
import { RIDE_STATUS } from '../constants/locations.js';

// Create a new ride
export const createRide = async (req, res) => {
    try {
        const { from, to, dateTime, cabType, totalSeats, estimatedCost, notes, dropPoints } = req.body;

        // Create ride with creator as first participant
        const ride = await Ride.create({
            creator: req.user._id,
            from,
            to,
            dropPoints: dropPoints || [], // On-the-way drop points
            dateTime: new Date(dateTime),
            cabType,
            totalSeats,
            estimatedCost,
            notes: notes || '',
            participants: [{
                user: req.user._id,
                name: req.user.name,
                dropPoint: null, // Creator goes to final destination
            }],
        });

        // Update user's ridesCreated count
        await User.findByIdAndUpdate(req.user._id, { $inc: { ridesCreated: 1 } });

        res.status(201).json({ message: 'Ride created successfully', ride });

    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({ error: 'Failed to create ride' });
    }
};

// Get all available rides (active rides with future dateTime)
export const getRides = async (req, res) => {
    try {
        const { destination, date } = req.query;

        // Build query
        const query = {
            status: RIDE_STATUS.ACTIVE,
            dateTime: { $gte: new Date() }, // Only future rides
        };

        // Filter by destination if provided
        if (destination) {
            query['to.id'] = destination;
        }

        // Filter by date if provided
        if (date) {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setDate(endOfDay.getDate() + 1);
            query.dateTime = { $gte: startOfDay, $lt: endOfDay };
        }

        const rides = await Ride.find(query)
            .populate('creator', 'name hostel')
            .populate('participants.user', 'name hostel')
            .sort({ dateTime: 1 }); // Soonest first

        res.json({ rides });

    } catch (error) {
        console.error('Get rides error:', error);
        res.status(500).json({ error: 'Failed to get rides' });
    }
};

// Get single ride by ID
export const getRideById = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('creator', 'name hostel phone')
            .populate('participants.user', 'name hostel phone');

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        res.json({ ride });

    } catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({ error: 'Failed to get ride' });
    }
};

// Join a ride (with optional drop point)
export const joinRide = async (req, res) => {
    try {
        const { dropPoint } = req.body; // Optional: where user wants to be dropped
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Check if ride is still active
        if (ride.status !== RIDE_STATUS.ACTIVE) {
            return res.status(400).json({ error: 'Ride is no longer active' });
        }

        // Check if ride is in the past
        if (new Date(ride.dateTime) < new Date()) {
            return res.status(400).json({ error: 'Ride has already departed' });
        }

        // Check if seats available
        if (ride.participants.length >= ride.totalSeats) {
            return res.status(400).json({ error: 'No seats available' });
        }

        // Check if already joined
        const alreadyJoined = ride.participants.some(
            p => p.user.toString() === req.user._id.toString()
        );
        if (alreadyJoined) {
            return res.status(400).json({ error: 'Already joined this ride' });
        }

        // Validate drop point if provided
        if (dropPoint && dropPoint.id) {
            const validDrop = ride.dropPoints.find(dp => dp.id === dropPoint.id);
            if (!validDrop) {
                return res.status(400).json({ error: 'Invalid drop point' });
            }
        }

        // Add user to participants
        ride.participants.push({
            user: req.user._id,
            name: req.user.name,
            dropPoint: dropPoint || null, // null means final destination
        });
        await ride.save();

        // Update user's ridesJoined count
        await User.findByIdAndUpdate(req.user._id, { $inc: { ridesJoined: 1 } });

        res.json({ message: 'Joined ride successfully', ride });

    } catch (error) {
        console.error('Join ride error:', error);
        res.status(500).json({ error: 'Failed to join ride' });
    }
};

// Leave a ride
export const leaveRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Check if user is the creator (creator can't leave, must cancel)
        if (ride.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Creator cannot leave. Cancel the ride instead.' });
        }

        // Check if user is in participants
        const participantIndex = ride.participants.findIndex(
            p => p.user.toString() === req.user._id.toString()
        );

        if (participantIndex === -1) {
            return res.status(400).json({ error: 'You are not in this ride' });
        }

        // Remove user from participants
        ride.participants.splice(participantIndex, 1);
        await ride.save();

        res.json({ message: 'Left ride successfully', ride });

    } catch (error) {
        console.error('Leave ride error:', error);
        res.status(500).json({ error: 'Failed to leave ride' });
    }
};

// Cancel a ride (only creator can cancel)
export const cancelRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Only creator can cancel
        if (ride.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the creator can cancel this ride' });
        }

        ride.status = RIDE_STATUS.CANCELLED;
        await ride.save();

        res.json({ message: 'Ride cancelled successfully', ride });

    } catch (error) {
        console.error('Cancel ride error:', error);
        res.status(500).json({ error: 'Failed to cancel ride' });
    }
};

// Get rides created by current user
export const getMyRides = async (req, res) => {
    try {
        const rides = await Ride.find({ creator: req.user._id })
            .populate('participants.user', 'name hostel')
            .sort({ dateTime: -1 });

        res.json({ rides });

    } catch (error) {
        console.error('Get my rides error:', error);
        res.status(500).json({ error: 'Failed to get your rides' });
    }
};

// Get rides user has joined
export const getJoinedRides = async (req, res) => {
    try {
        const rides = await Ride.find({
            'participants.user': req.user._id,
            creator: { $ne: req.user._id }, // Exclude rides created by user
        })
            .populate('creator', 'name hostel')
            .populate('participants.user', 'name hostel')
            .sort({ dateTime: -1 });

        res.json({ rides });

    } catch (error) {
        console.error('Get joined rides error:', error);
        res.status(500).json({ error: 'Failed to get joined rides' });
    }
};
