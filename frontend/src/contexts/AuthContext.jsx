// AuthContext - Global Authentication State
// This makes user info available EVERYWHERE in the app

import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';

// Create the context (like a global container)
const AuthContext = createContext();

// Provider component - wraps the entire app
export function AuthProvider({ children }) {
    // ============================================
    // STATE VARIABLES (data that changes)
    // ============================================

    // Current logged-in user (null if not logged in)
    // WHY useState? → This changes when user logs in/out
    const [user, setUser] = useState(null);

    // User's profile from our MongoDB database
    const [profile, setProfile] = useState(null);

    // Loading state - true while checking if user is logged in
    // WHY useState? → Changes from true to false after check
    const [loading, setLoading] = useState(true);

    // ============================================
    // EFFECT - Runs when app starts
    // ============================================

    useEffect(() => {
        // Listen for auth state changes (login/logout)
        // Firebase automatically calls this when auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // User is logged in, try to get their profile
                try {
                    const response = await api.get('/auth/me');
                    setProfile(response.data.user);
                } catch (error) {
                    // Profile not found - user needs to complete registration
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        // Cleanup listener when component unmounts
        return () => unsubscribe();
    }, []); // Empty array = run once when app starts

    // ============================================
    // AUTH FUNCTIONS
    // ============================================

    // Sign up with email and password
    const signup = async (email, password) => {
        // Validate VIT email
        if (!email.endsWith('@vitstudent.ac.in')) {
            throw new Error('Only VIT student emails are allowed');
        }

        // Create user in Firebase
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Send verification email
        await sendEmailVerification(result.user);

        return result.user;
    };

    // Complete profile (after email verification)
    const completeProfile = async (profileData) => {
        const response = await api.post('/auth/register', profileData);
        setProfile(response.data.user);
        return response.data.user;
    };

    // Login with email and password
    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // Email verification disabled for easier testing
        return result.user;
    };

    // Logout
    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setProfile(null);
    };

    // Update user profile
    const updateProfile = async (profileData) => {
        const response = await api.put('/auth/profile', profileData);
        setProfile(response.data.user);
        return response.data.user;
    };

    // ============================================
    // CONTEXT VALUE - What we share with the app
    // ============================================

    const value = {
        user,           // Firebase user object
        profile,        // Our MongoDB user profile
        loading,        // Is auth state being checked?
        signup,         // Sign up function
        login,          // Login function
        logout,         // Logout function
        completeProfile, // Complete registration
        updateProfile,  // Update profile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
// Instead of: useContext(AuthContext)
// We use: useAuth()
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
