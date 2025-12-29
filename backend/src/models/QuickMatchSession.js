// QuickMatchSession Model - Temporary sessions for instant ride matching
// Sessions auto-expire after 10 minutes via MongoDB TTL index

import mongoose from 'mongoose';

const quickMatchSessionSchema = new mongoose.Schema({
    // Who started this Quick Match session
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Creator's nickname (for privacy - no real names in Quick Match)
    creatorNickname: {
        type: String,
        required: true,
        default: function () {
            return `User${Math.floor(1000 + Math.random() * 9000)}`;
        }
    },

    // Current GPS location of creator
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        }
    },

    // Where they want to go
    destination: {
        id: { type: String, required: true },
        name: { type: String, required: true },
    },

    // Suggested meetup point (auto-calculated or from saved places)
    meetupPoint: {
        name: { type: String, default: '' },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: undefined,
        }
    },

    // Session configuration
    maxParticipants: {
        type: Number,
        default: 4,
        min: 2,
        max: 6,
    },

    radius: {
        type: Number,
        default: 100, // meters
        min: 50,
        max: 500,
    },

    // People who joined this session
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        nickname: {
            type: String,
            default: function () {
                return `User${Math.floor(1000 + Math.random() * 9000)}`;
            }
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: [Number], // [longitude, latitude]
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    }],

    // Session status
    status: {
        type: String,
        enum: ['searching', 'matched', 'expired', 'completed'],
        default: 'searching',
    },

    // Manually closed by creator (no more joins allowed)
    isClosed: {
        type: Boolean,
        default: false,
    },

    // Auto-expiry time (10 minutes from creation)
    expiresAt: {
        type: Date,
        required: true,
        default: function () {
            return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        },
        index: { expires: 0 } // TTL index - MongoDB auto-deletes when expiresAt is reached
    },

}, {
    timestamps: true,
});

// Geospatial index for location-based queries
quickMatchSessionSchema.index({ location: '2dsphere' });

// Index for finding active sessions
quickMatchSessionSchema.index({ status: 1, expiresAt: 1 });

// Virtual: Get participant count
quickMatchSessionSchema.virtual('participantCount').get(function () {
    return this.participants.length + 1; // +1 for creator
});

// Virtual: Available spots
quickMatchSessionSchema.virtual('availableSpots').get(function () {
    return this.maxParticipants - this.participantCount;
});

// Virtual: Is session full
quickMatchSessionSchema.virtual('isFull').get(function () {
    return this.availableSpots <= 0;
});

// Virtual: Time remaining in seconds
quickMatchSessionSchema.virtual('timeRemaining').get(function () {
    const now = new Date();
    const remaining = Math.max(0, this.expiresAt - now);
    return Math.floor(remaining / 1000); // seconds
});

// Include virtuals in JSON output
quickMatchSessionSchema.set('toJSON', { virtuals: true });
quickMatchSessionSchema.set('toObject', { virtuals: true });

const QuickMatchSession = mongoose.model('QuickMatchSession', quickMatchSessionSchema);

export default QuickMatchSession;
