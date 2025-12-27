// Firebase Admin SDK Setup
// Lazy initialization - only initializes when first used

import admin from 'firebase-admin';

let initialized = false;

function initializeFirebase() {
    if (initialized) return;

    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountStr) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in .env');
    }

    const serviceAccount = JSON.parse(serviceAccountStr);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
}

// Export a function that ensures Firebase is initialized
export function getFirebaseAdmin() {
    initializeFirebase();
    return admin;
}

export default admin;
