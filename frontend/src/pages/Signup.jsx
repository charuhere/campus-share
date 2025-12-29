// Signup Page - Compact No-Scroll Design

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.endsWith('@vitstudent.ac.in')) {
            toast.error('Only VIT student emails are allowed');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await signup(email, password);
            toast.success('Check your email for verification!');
            navigate('/verify-email');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center px-4 overflow-hidden">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="text-5xl mb-2">🎓</div>
                    <h1 className="text-2xl font-bold gradient-text">Join RideShare</h1>
                    <p className="text-gray-500 text-sm">Share rides with VITians</p>
                </div>

                {/* Card */}
                <div className="glass-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-gray-600 text-xs mb-1">VIT Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="yourname@vitstudent.ac.in"
                                className="input-modern text-black placeholder-gray-500 text-sm py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 text-xs mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="input-modern text-black placeholder-gray-500 text-sm py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 text-xs mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                className="input-modern text-black placeholder-gray-500 text-sm py-2"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gradient text-black py-3 rounded-xl font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-gray-600 text-sm mt-4">
                        Have an account?{' '}
                        <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
