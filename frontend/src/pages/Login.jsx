// Login Page - Compact No-Scroll Design

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
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
                    <div className="text-5xl mb-2">🚗</div>
                    <h1 className="text-2xl font-bold gradient-text">Campus RideShare</h1>
                    <p className="text-gray-500 text-sm">Split rides. Save money.</p>
                </div>

                {/* Card */}
                <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 text-center">Welcome Back</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">VIT Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="yourname@vitstudent.ac.in"
                                className="input-modern text-white placeholder-gray-500 text-sm py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-modern text-white placeholder-gray-500 text-sm py-2"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gradient text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <p className="text-center text-gray-400 text-sm mt-4">
                        New here?{' '}
                        <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
