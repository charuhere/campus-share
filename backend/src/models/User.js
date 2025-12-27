import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Firebase UID - links this user to Firebase Auth
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
    },

    // Email - must be VIT email
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/@vitstudent\.ac\.in$/, 'Must be a VIT student email']
    },

    // User details
    name: {
        type: String,
        required: true,
        trim: true,
    },

    phone: {
        type: String,
        required: true,
    },

    hostel: {
        type: String,
        required: true,
    },

    department: {
        type: String,
        default: '',
    },

    // Trusted users - list of user IDs this user trusts
    trustedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    // Stats
    ridesCreated: {
        type: Number,
        default: 0,
    },

    ridesJoined: {
        type: Number,
        default: 0,
    },

    ridesCompleted: {
        type: Number,
        default: 0,
    },

}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
