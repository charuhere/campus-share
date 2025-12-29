// My Rides Page - Uber Style with Lucide Icons

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Car, Users, MessageCircle, X, Plus, Search, Loader2, Calendar, Clock } from 'lucide-react';

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
                <h1 className="text-4xl font-bold text-black mb-2">My Rides</h1>
                <p className="text-gray-600">Track your journey history</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                    <TabButton
                        active={activeTab === 'created'}
                        onClick={() => setActiveTab('created')}
                        count={createdRides.length}
                        icon={<Car className="w-4 h-4" />}
                    >
                        Created
                    </TabButton>
                    <TabButton
                        active={activeTab === 'joined'}
                        onClick={() => setActiveTab('joined')}
                        count={joinedRides.length}
                        icon={<Users className="w-4 h-4" />}
                    >
                        Joined
                    </TabButton>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
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
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        {activeTab === 'created' ? (
                            <Car className="w-8 h-8 text-gray-400" />
                        ) : (
                            <Users className="w-8 h-8 text-gray-400" />
                        )}
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
                        className="bg-black hover:bg-gray-800 px-8 py-4 rounded-xl text-white font-semibold inline-flex items-center gap-2"
                    >
                        {activeTab === 'created' ? (
                            <>
                                <Plus className="w-4 h-4" />
                                Create Ride
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Find Rides
                            </>
                        )}
                    </Link>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, count, icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${active
                ? 'bg-black text-white'
                : 'text-gray-600 hover:text-black'
                }`}
        >
            {icon}
            {children}
            <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-gray-200'
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
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{rideDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{rideDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-black">
                        {ride.from.name} → {ride.to.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {ride.participants.length}/{ride.totalSeats} riders
                        </span>
                        <span className="text-black font-semibold">
                            ₹{Math.ceil(ride.estimatedCost / ride.participants.length)}/person
                        </span>
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                    {isCancelled && (
                        <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm">
                            Cancelled
                        </span>
                    )}
                    {isPast && !isCancelled && (
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                            Completed
                        </span>
                    )}
                    {!isPast && !isCancelled && (
                        <>
                            <Link
                                to={`/ride/${ride._id}/chat`}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-black hover:bg-gray-200 transition text-sm flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Chat
                            </Link>
                            {isOwner && (
                                <button
                                    onClick={() => onCancel(ride._id)}
                                    className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
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
