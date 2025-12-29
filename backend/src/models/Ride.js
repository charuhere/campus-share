import mongoose from 'mongoose';
import { RIDE_STATUS } from '../constants/locations.js';

const rideSchema = new mongoose.Schema({
    // Who created this ride
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Pickup location (from campus)
    from: {
        id: { type: String, required: true },
        name: { type: String, required: true },
    },

    // Destination
    to: {
        id: { type: String, required: true },
        name: { type: String, required: true },
    },

    // On-the-way drop points (intermediate stops)
    dropPoints: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        estimatedCost: { type: Number, required: true }, // Cost to reach this point
    }],

    // When is the ride
    dateTime: {
        type: Date,
        required: true,
    },

    // Cab type (optional - for backward compatibility)
    cabType: {
        id: { type: String, default: 'auto' },
        name: { type: String, default: 'Auto/Cab' },
        maxSeats: { type: Number, default: 6 },
    },

    // Seats
    totalSeats: {
        type: Number,
        required: true,
    },

    // Estimated total cost for the cab (to final destination)
    estimatedCost: {
        type: Number,
        required: true,
    },

    // People who joined this ride
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        name: String,
        dropPoint: {
            id: String,       // null if going to final destination
            name: String,
            cost: Number,     // Cost for this person's drop
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    }],

    // Ride status
    status: {
        type: String,
        enum: Object.values(RIDE_STATUS),
        default: RIDE_STATUS.ACTIVE,
    },

    // Optional notes from creator
    notes: {
        type: String,
        default: '',
    },

    // Manually closed by creator (no more joins allowed)
    isClosed: {
        type: Boolean,
        default: false,
    },

}, {
    timestamps: true,
});

// Virtual field: Calculate cost per person (based on their drop point)
rideSchema.virtual('costPerPerson').get(function () {
    const participantCount = this.participants.length || 1;
    return Math.ceil(this.estimatedCost / participantCount);
});

// Virtual field: Available seats
rideSchema.virtual('availableSeats').get(function () {
    return this.totalSeats - this.participants.length;
});

// Include virtuals when converting to JSON
rideSchema.set('toJSON', { virtuals: true });
rideSchema.set('toObject', { virtuals: true });

const Ride = mongoose.model('Ride', rideSchema);

export default Ride;
