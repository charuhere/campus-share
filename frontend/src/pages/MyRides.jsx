// My Rides Page - Premium Design with Tabs

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

function MyRides() {
    const [activeTab, setActiveTab] = useState('created');
    const [createdRides, setCreatedRides] = useState([]);
    const [joinedRides, setJoinedRides] = useState([]);
    const [loading, setLoading] = useState(true);

    const { profile } = useAuth();

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            const [createdRes, joinedRes] = await Promise.all([
                api.get('/rides/my/created'),
                api.get('/rides/my/joined'),
            ]);
            setCreatedRides(createdRes.data.rides);
            setJoinedRides(joinedRes.data.rides);
        } catch (error) {
            toast.error('Failed to load rides');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (rideId) => {
        if (!confirm('Cancel this ride?')) return;
        try {
            await api.put(`/rides/${rideId}/cancel`);
            toast.success('Ride cancelled');
            fetchRides();
        } catch (error) {
            toast.error('Failed to cancel');
        }
    };

    const rides = activeTab === 'created' ? createdRides : joinedRides;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold gradient-text mb-2">My Rides</h1>
                <p className="text-gray-600">Track your journey history</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
                <div className="glass-card p-1 flex gap-1">
                    <TabButton
                        active={activeTab === 'created'}
                        onClick={() => setActiveTab('created')}
                        count={createdRides.length}
                    >
                        🚗 Created
                    </TabButton>
                    <TabButton
                        active={activeTab === 'joined'}
                        onClick={() => setActiveTab('joined')}
                        count={joinedRides.length}
                    >
                        🤝 Joined
                    </TabButton>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Rides List */}
            {!loading && rides.length > 0 && (
                <div className="space-y-4">
                    {rides.map((ride) => (
                        <RideItem
                            key={ride._id}
                            ride={ride}
                            isOwner={activeTab === 'created'}
                            onCancel={handleCancel}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && rides.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">
                        {activeTab === 'created' ? '🚗' : '🤝'}
                    </div>
                    <h3 className="text-2xl font-semibold text-black mb-2">
                        No {activeTab} rides yet
                    </h3>
                    <p className="text-gray-600 mb-8">
                        {activeTab === 'created'
                            ? 'Create your first ride and find co-travelers!'
                            : 'Browse available rides and join one!'
                        }
                    </p>
                    <Link
                        to={activeTab === 'created' ? '/create-ride' : '/'}
                        className="btn-gradient px-8 py-4 rounded-xl text-black font-semibold inline-block"
                    >
                        {activeTab === 'created' ? 'Create Ride' : 'Find Rides'}
                    </Link>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, count, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${active
                ? 'bg-gradient-to-r from-emerald-500 to-pink-500 text-black'
                : 'text-gray-600 hover:text-black'
                }`}
        >
            {children}
            <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                {count}
            </span>
        </button>
    );
}

function RideItem({ ride, isOwner, onCancel }) {
    const rideDate = new Date(ride.dateTime);
    const isPast = rideDate < new Date();
    const isCancelled = ride.status === 'cancelled';

    return (
        <div className={`glass-card p-6 ${isCancelled ? 'opacity-50' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Route & Time */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        {ride.cabType.icon}
                        <span>{rideDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span>•</span>
                        <span>{rideDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-black">
                        {ride.from.name} → {ride.to.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="text-gray-600">
                            {ride.participants.length}/{ride.totalSeats} riders
                        </span>
                        <span className="gradient-text font-semibold">
                            ₹{Math.ceil(ride.estimatedCost / ride.participants.length)}/person
                        </span>
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                    {isCancelled && (
                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                            Cancelled
                        </span>
                    )}
                    {isPast && !isCancelled && (
                        <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-600 text-sm">
                            Completed
                        </span>
                    )}
                    {!isPast && !isCancelled && (
                        <>
                            <Link
                                to={`/ride/${ride._id}/chat`}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-black hover:bg-white/20 transition text-sm"
                            >
                                💬 Chat
                            </Link>
                            {isOwner && (
                                <button
                                    onClick={() => onCancel(ride._id)}
                                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm"
                                >
                                    Cancel
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MyRides;
