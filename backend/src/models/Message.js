// Message Model - Stores chat messages for each ride

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    // Which ride this message belongs to
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true,
    },

    // Who sent the message
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Sender name (cached for faster loading)
    senderName: {
        type: String,
        required: true,
    },

    // Message content
    content: {
        type: String,
        required: true,
        trim: true,
    },

}, {
    timestamps: true,  // Automatically adds createdAt, updatedAt
});

// Index for faster queries
messageSchema.index({ ride: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
