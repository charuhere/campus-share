// Navbar - Clean Design (Trusted removed)

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-black border-b border-neutral-800">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <span className="text-2xl group-hover:animate-bounce">🚗</span>
                        <span className="text-xl font-bold text-white hidden sm:block">
                            RideShare
                        </span>
                    </Link>

                    {/* Nav Links */}
                    {user && profile && (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <NavLink to="/" active={isActive('/')}>
                                🏠 <span className="hidden sm:inline">Home</span>
                            </NavLink>
                            <NavLink to="/create-ride" active={isActive('/create-ride')}>
                                ➕ <span className="hidden sm:inline">Create</span>
                            </NavLink>
                            <NavLink to="/my-rides" active={isActive('/my-rides')}>
                                📋 <span className="hidden sm:inline">My Rides</span>
                            </NavLink>
                            <NavLink to="/profile" active={isActive('/profile')}>
                                👤 <span className="hidden sm:inline">Profile</span>
                            </NavLink>
                            <button
                                onClick={handleLogout}
                                className="ml-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    )}

                    {/* Auth Links */}
                    {!user && (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/login"
                                className="text-gray-300 hover:text-white transition"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

function NavLink({ to, active, children }) {
    return (
        <Link
            to={to}
            className={`px-3 py-2 rounded-lg transition text-sm ${active
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {children}
        </Link>
    );
}

export default Navbar;
