// Firebase Configuration for Frontend
// This connects our React app to Firebase Auth

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCMc04_MdPbFmyrFyMqSSFvmvkW6QAywaQ",
    authDomain: "campus-rideshare-644e0.firebaseapp.com",
    projectId: "campus-rideshare-644e0",
    storageBucket: "campus-rideshare-644e0.firebasestorage.app",
    messagingSenderId: "788607140630",
    appId: "1:788607140630:web:22b29661ebeddfbf910637"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth instance - used for login/signup
export const auth = getAuth(app);

export default app;
