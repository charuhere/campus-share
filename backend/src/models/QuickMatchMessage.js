// QuickMatchMessage Model - Temporary chat messages for Quick Match sessions
// Messages are deleted when session expires (cascade via session deletion)

import mongoose from 'mongoose';

const quickMatchMessageSchema = new mongoose.Schema({
    // Which Quick Match session this message belongs to
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuickMatchSession',
        required: true,
    },

    // Who sent the message (stored for internal use)
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Sender nickname (for privacy - displayed instead of real name)
    senderNickname: {
        type: String,
        required: true,
    },

    // Message content (text only, no media for safety)
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500, // Keep messages short
    },

}, {
    timestamps: true,
});

// Index for faster queries
quickMatchMessageSchema.index({ session: 1, createdAt: 1 });

// TTL index to auto-delete messages after 15 minutes (slightly longer than session)
quickMatchMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const QuickMatchMessage = mongoose.model('QuickMatchMessage', quickMatchMessageSchema);

export default QuickMatchMessage;
