// Home Page - Shows all available rides directly

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DESTINATIONS } from '../constants/locations';
import RideCard from '../components/RideCard';
import api from '../services/api';
import toast from 'react-hot-toast';

function Home() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [destination, setDestination] = useState('');

    const { profile } = useAuth();

    useEffect(() => {
        fetchData();
    }, [destination]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = destination ? { destination } : {};
            const response = await api.get('/rides', { params });
            setRides(response.data.rides);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load rides');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (rideId, dropPoint = null) => {
        try {
            await api.post(`/rides/${rideId}/join`, { dropPoint });
            toast.success('Joined ride!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to join');
        }
    };

    const handleLeave = async (rideId) => {
        try {
            await api.delete(`/rides/${rideId}/leave`);
            toast.success('Left ride');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to leave');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Available Rides</h1>
                    <p className="text-gray-400 text-sm">Find rides posted by fellow students</p>
                </div>
                <Link
                    to="/create-ride"
                    className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold text-center"
                >
                    ➕ Create Ride
                </Link>
            </div>

            {/* Destination Filter */}
            <div className="mb-6">
                <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="input-modern text-white bg-transparent py-2 px-4 min-w-[200px]"
                >
                    <option value="" className="bg-slate-900">All Destinations</option>
                    {DESTINATIONS.map((dest) => (
                        <option key={dest.id} value={dest.id} className="bg-slate-900">
                            {dest.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Rides Grid */}
            {!loading && rides.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rides.map((ride) => (
                        <RideCard
                            key={ride._id}
                            ride={ride}
                            currentUserId={profile?._id}
                            onJoin={handleJoin}
                            onLeave={handleLeave}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && rides.length === 0 && (
                <div className="text-center py-16 glass-card">
                    <div className="text-5xl mb-4">🚗</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No rides available</h3>
                    <p className="text-gray-400 mb-6">Be the first to create a ride!</p>
                    <Link
                        to="/create-ride"
                        className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold inline-block"
                    >
                        Create a Ride
                    </Link>
                </div>
            )}
        </div>
    );
}

export default Home;
