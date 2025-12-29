// RideCard - Uber Style with Lucide Icons

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, MessageCircle, ArrowRight, Star, ArrowDown } from 'lucide-react';

function RideCard({ ride, onJoin, onLeave, currentUserId }) {
    const [showDropOptions, setShowDropOptions] = useState(false);

    const isCreator = ride.creator._id === currentUserId;
    const hasJoined = ride.participants.some(p => p.user._id === currentUserId);
    const isFull = ride.participants.length >= ride.totalSeats;
    const isParticipant = isCreator || hasJoined;
    const hasDropPoints = ride.dropPoints && ride.dropPoints.length > 0;

    // Format date
    const rideDate = new Date(ride.dateTime);
    const dateStr = rideDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
    const timeStr = rideDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Cost calculations
    const costPerPerson = Math.ceil(ride.estimatedCost / ride.participants.length);
    const savings = ride.estimatedCost - costPerPerson;
    const savingsPercent = Math.round((savings / ride.estimatedCost) * 100);

    const handleJoinWithDrop = (dropPoint = null) => {
        onJoin(ride._id, dropPoint);
        setShowDropOptions(false);
    };

    return (
        <div className="glass-card p-6 hover:shadow-md transition-all duration-300">
            {/* Top Row: Route & Seats */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">
                        {ride.from.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <ArrowDown className="w-4 h-4" />
                        <span>{ride.to.name}</span>
                    </div>
                </div>

                {/* Seats Badge */}
                <div className={`text-center px-3 py-2 rounded-xl ${isFull
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
                    }`}>
                    <div className="text-xl font-bold">
                        {ride.totalSeats - ride.participants.length}
                    </div>
                    <div className="text-xs">seats left</div>
                </div>
            </div>

            {/* Drop Points */}
            {hasDropPoints && (
                <div className="flex flex-wrap gap-1 mb-4">
                    {ride.dropPoints.map((dp) => (
                        <span
                            key={dp.id}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1"
                        >
                            <MapPin className="w-3 h-3" />
                            {dp.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Date/Time */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{timeStr}</span>
                </div>
            </div>

            {/* Cost Section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Your Cost</p>
                    <p className="text-2xl font-bold text-black">₹{costPerPerson}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-xs uppercase tracking-wider">You Save</p>
                    <p className="text-xl font-semibold text-green-600">
                        {savingsPercent}%
                    </p>
                </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-2 mb-4 text-sm">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold">
                    {ride.creator.name.charAt(0)}
                </div>
                <div>
                    <p className="text-black font-medium">{ride.creator.name}</p>
                    <p className="text-gray-500 text-xs">{ride.creator.hostel}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                {isParticipant && (
                    <Link
                        to={`/ride/${ride._id}/chat`}
                        className="w-full text-center py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-black transition flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Open Chat
                    </Link>
                )}

                {!isCreator && !hasJoined && !isFull && (
                    showDropOptions ? (
                        <div className="space-y-2">
                            <button
                                onClick={() => handleJoinWithDrop(null)}
                                className="w-full bg-black text-white py-2 rounded-xl text-sm font-medium"
                            >
                                {ride.to.name} (Final)
                            </button>
                            {ride.dropPoints?.map((dp) => (
                                <button
                                    key={dp.id}
                                    onClick={() => handleJoinWithDrop(dp)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-black py-2 rounded-xl text-sm transition flex items-center justify-center gap-1"
                                >
                                    <MapPin className="w-3 h-3" />
                                    {dp.name}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowDropOptions(false)}
                                className="w-full text-gray-500 py-2 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => hasDropPoints ? setShowDropOptions(true) : handleJoinWithDrop(null)}
                            className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        >
                            Join Ride
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )
                )}

                {hasJoined && !isCreator && (
                    <button
                        onClick={() => onLeave(ride._id)}
                        className="w-full py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                        Leave Ride
                    </button>
                )}

                {isCreator && (
                    <div className="text-center py-3 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center gap-2">
                        <Star className="w-4 h-4" />
                        Your Ride
                    </div>
                )}

                {isFull && !hasJoined && !isCreator && (
                    <div className="text-center py-3 rounded-xl bg-gray-50 text-gray-500">
                        Ride Full
                    </div>
                )}
            </div>
        </div>
    );
}

export default RideCard;
