// QuickMatchCard Component - Uber Style

import { Zap, Clock, MapPin, Users, CheckCircle, Search, Loader2 } from 'lucide-react';

function QuickMatchCard({ session, onJoin, joining }) {
    // Format time remaining
    const formatTimeRemaining = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format distance
    const formatDistance = (meters) => {
        if (meters < 1000) {
            return `${meters}m away`;
        }
        return `${(meters / 1000).toFixed(1)}km away`;
    };

    const isAlmostFull = session.availableSpots <= 1;
    const isExpiringSoon = session.timeRemaining < 180; // Less than 3 mins

    return (
        <div className="glass-card p-4 hover:border-black/10 transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Going to</p>
                        <h3 className="font-bold text-black text-lg leading-tight">{session.destination.name}</h3>
                    </div>
                </div>

                {/* Time remaining badge */}
                <div className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${isExpiringSoon ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(session.timeRemaining)}
                </div>
            </div>

            {/* Info row */}
            <div className="flex items-center gap-4 text-sm mb-4 text-gray-600">
                {/* Distance */}
                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{formatDistance(session.distance)}</span>
                </div>

                {/* People */}
                <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className={isAlmostFull ? 'text-orange-600 font-semibold' : ''}>
                        {session.participantCount}/{session.maxParticipants}
                    </span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1">
                    {session.status === 'matched' ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Matched
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Search className="w-4 h-4" />
                            Searching
                        </span>
                    )}
                </div>
            </div>

            {/* Meetup point if available */}
            {session.meetupPoint?.name && (
                <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-black" />
                    <span>Meet at: <span className="font-semibold text-black">{session.meetupPoint.name}</span></span>
                </div>
            )}

            {/* Join button */}
            <button
                onClick={() => onJoin(session._id)}
                disabled={joining || session.availableSpots <= 0}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${session.availableSpots <= 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                    }`}
            >
                {joining ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                    </>
                ) : session.availableSpots <= 0 ? (
                    'Session Full'
                ) : (
                    `Join Group (${session.availableSpots} spots left)`
                )}
            </button>
        </div>
    );
}

export default QuickMatchCard;
