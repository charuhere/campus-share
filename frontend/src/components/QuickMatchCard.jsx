// QuickMatchCard Component - Displays nearby Quick Match sessions

import { useState } from 'react';

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
        <div className="glass-card p-4 hover:border-emerald-500/50 transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <p className="text-sm text-gray-400">Going to</p>
                        <h3 className="font-semibold text-white">{session.destination.name}</h3>
                    </div>
                </div>

                {/* Time remaining badge */}
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${isExpiringSoon ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    ⏱️ {formatTimeRemaining(session.timeRemaining)}
                </div>
            </div>

            {/* Info row */}
            <div className="flex items-center gap-4 text-sm mb-4">
                {/* Distance */}
                <div className="flex items-center gap-1 text-gray-300">
                    <span>📍</span>
                    <span className="text-green-400 font-medium">{formatDistance(session.distance)}</span>
                </div>

                {/* People */}
                <div className="flex items-center gap-1 text-gray-300">
                    <span>👥</span>
                    <span className={isAlmostFull ? 'text-orange-400 font-medium' : ''}>
                        {session.participantCount}/{session.maxParticipants}
                    </span>
                </div>

                {/* Status */}
                <div className={`px-2 py-0.5 rounded-full text-xs ${session.status === 'matched'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {session.status === 'matched' ? '✓ Matched' : '🔍 Searching'}
                </div>
            </div>

            {/* Meetup point if available */}
            {session.meetupPoint?.name && (
                <div className="text-sm text-gray-400 mb-3">
                    <span className="text-yellow-400">📌</span> Meet at: {session.meetupPoint.name}
                </div>
            )}

            {/* Join button */}
            <button
                onClick={() => onJoin(session._id)}
                disabled={joining || session.availableSpots <= 0}
                className={`w-full py-2 rounded-xl font-semibold transition-all duration-300 ${session.availableSpots <= 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'btn-gradient text-white hover:scale-[1.02]'
                    }`}
            >
                {joining ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Joining...
                    </span>
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
