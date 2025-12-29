// QuickMatch Page - Instant ride matching with GPS
// Ultra-fast, zero-planning ride sharing

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DESTINATIONS } from '../constants/locations';
import QuickMatchCard from '../components/QuickMatchCard';
import api from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import toast from 'react-hot-toast';

function QuickMatch() {
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Location state
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(true);

    // Session state
    const [activeSession, setActiveSession] = useState(null);
    const [nearbySessions, setNearbySessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [joining, setJoining] = useState(false);

    // Destination selection (combobox)
    const [destinationText, setDestinationText] = useState('');
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [showDestDropdown, setShowDestDropdown] = useState(false);

    // Max participants setting
    const [maxParticipants, setMaxParticipants] = useState(4);

    // Room closed state
    const [roomClosed, setRoomClosed] = useState(false);

    // Chat state
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    // Timer for session countdown
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Filter destinations based on input
    const filteredDestinations = DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(destinationText.toLowerCase())
    );

    // Get user's GPS location on mount
    useEffect(() => {
        getCurrentLocation();
    }, []);

    // Check for active session on mount
    useEffect(() => {
        checkActiveSession();
    }, []);

    // Timer countdown effect
    useEffect(() => {
        if (activeSession && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSessionExpired();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [activeSession]);

    // Socket connection for chat
    useEffect(() => {
        if (activeSession && showChat) {
            const socket = getSocket();

            // Safety check - socket might not be connected yet
            if (!socket) {
                console.log('Socket not connected yet');
                return;
            }

            socket.emit('join-quick-match', activeSession._id);

            socket.on('qm-previous-messages', (msgs) => {
                setMessages(msgs);
            });

            socket.on('qm-new-message', (msg) => {
                setMessages(prev => [...prev, msg]);
            });

            socket.on('qm-user-joined', ({ nickname }) => {
                toast.success(`${nickname} joined!`);
            });

            socket.on('qm-user-left', ({ nickname }) => {
                toast(`${nickname} left`, { icon: '👋' });
            });

            socket.on('qm-error', (error) => {
                toast.error(error);
            });

            return () => {
                socket.emit('leave-quick-match', activeSession._id);
                socket.off('qm-previous-messages');
                socket.off('qm-new-message');
                socket.off('qm-user-joined');
                socket.off('qm-user-left');
                socket.off('qm-error');
            };
        }
    }, [activeSession, showChat]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getCurrentLocation = () => {
        setGettingLocation(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setGettingLocation(false);
            return;
        }


        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setGettingLocation(false);
            },
            (error) => {
                let errorMsg = 'Unable to get your location';
                if (error.code === 1) errorMsg = 'Location access denied. Please enable location.';
                if (error.code === 2) errorMsg = 'Location unavailable';
                if (error.code === 3) errorMsg = 'Location request timed out';
                setLocationError(errorMsg);
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const checkActiveSession = async () => {
        try {
            const response = await api.get('/quick-match/active');
            if (response.data.session) {
                setActiveSession(response.data.session);
                setTimeRemaining(response.data.session.timeRemaining);
            }
        } catch (error) {
            console.error('Check active session error:', error);
        }
    };

    const findNearby = async () => {
        if (!location) {
            toast.error('Location not available');
            return;
        }

        setLoading(true);
        try {
            const params = {
                latitude: location.latitude,
                longitude: location.longitude,
                radius: 100,
            };
            if (selectedDestination) {
                params.destination = selectedDestination;
            }

            const response = await api.get('/quick-match/nearby', { params });
            setNearbySessions(response.data.sessions);

            if (response.data.sessions.length === 0) {
                toast('No matches nearby. Create a session!', { icon: '🔍' });
            }
        } catch (error) {
            toast.error('Failed to find nearby matches');
        } finally {
            setLoading(false);
        }
    };

    const createSession = async () => {
        if (!location) {
            toast.error('Location not available');
            return;
        }
        if (!destinationText) {
            toast.error('Please enter a destination');
            return;
        }

        setLoading(true);
        try {
            const dest = DESTINATIONS.find(d => d.id === selectedDestination) ||
                { id: 'custom', name: destinationText };
            const response = await api.post('/quick-match', {
                latitude: location.latitude,
                longitude: location.longitude,
                destination: {
                    id: dest.id,
                    name: dest.name,
                },
                maxParticipants: maxParticipants,
            });

            setActiveSession(response.data.session);
            setTimeRemaining(response.data.session.timeRemaining);
            toast.success('Quick Match started! Looking for riders...');

            // Connect to socket for real-time updates
            await connectSocket();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const joinSession = async (sessionId) => {
        setJoining(true);
        try {
            const response = await api.post(`/quick-match/${sessionId}/join`, {
                latitude: location?.latitude,
                longitude: location?.longitude,
            });

            setActiveSession(response.data.session);
            setTimeRemaining(response.data.session.timeRemaining);
            setNearbySessions([]);
            toast.success('Joined! Opening chat...');
            setShowChat(true);

            // Connect to socket for real-time chat
            await connectSocket();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to join');
        } finally {
            setJoining(false);
        }
    };

    const leaveSession = async () => {
        if (!activeSession) return;

        try {
            if (activeSession.isCreator) {
                await api.delete(`/quick-match/${activeSession._id}`);
                toast.success('Session cancelled');
            } else {
                await api.delete(`/quick-match/${activeSession._id}/leave`);
                toast.success('Left session');
            }
            setActiveSession(null);
            setShowChat(false);
            setMessages([]);
        } catch (error) {
            toast.error('Failed to leave session');
        }
    };

    const closeRoom = async () => {
        if (!activeSession || !activeSession.isCreator) return;

        try {
            const response = await api.post(`/quick-match/${activeSession._id}/close`);
            setRoomClosed(response.data.isClosed);
            toast.success(response.data.message);
        } catch (error) {
            toast.error('Failed to close room');
        }
    };

    const handleSessionExpired = () => {
        toast('Session expired', { icon: '⏰' });
        setActiveSession(null);
        setShowChat(false);
        setMessages([]);
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !activeSession) return;

        const socket = getSocket();
        if (!socket) {
            toast.error('Not connected to chat server');
            return;
        }
        socket.emit('send-qm-message', {
            sessionId: activeSession._id,
            content: newMessage.trim(),
        });
        setNewMessage('');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render active session view
    if (activeSession) {
        return (
            <div className="max-w-lg mx-auto px-4 py-6 h-full flex flex-col">
                {/* Header */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <h2 className="font-bold text-white">Quick Match Active</h2>
                                <p className="text-sm text-gray-400">Going to {activeSession.destination.name}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg font-mono font-bold ${timeRemaining < 60 ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
                            }`}>
                            {formatTime(timeRemaining)}
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm mb-3">
                        <span>👥</span>
                        <span className="text-gray-300">
                            {activeSession.participantCount} people • You are
                            <span className="text-purple-400 font-medium"> {activeSession.myNickname}</span>
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="flex-1 py-2 rounded-xl font-semibold bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                        >
                            💬 {showChat ? 'Hide Chat' : 'Open Chat'}
                        </button>
                        {activeSession.isCreator && (
                            <button
                                onClick={closeRoom}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all ${roomClosed
                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                    }`}
                            >
                                {roomClosed ? '🔓 Reopen' : '🔒 Close Room'}
                            </button>
                        )}
                        <button
                            onClick={leaveSession}
                            className="px-4 py-2 rounded-xl font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                        >
                            {activeSession.isCreator ? 'Cancel' : 'Leave'}
                        </button>
                    </div>
                </div>

                {/* Chat */}
                {showChat && (
                    <div className="flex-1 glass-card p-4 flex flex-col min-h-0">
                        <h3 className="font-semibold text-white mb-3">Group Chat</h3>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                            {messages.length === 0 && (
                                <p className="text-gray-500 text-center text-sm py-4">
                                    No messages yet. Say hi! 👋
                                </p>
                            )}
                            {messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`p-2 rounded-lg ${msg.senderNickname === activeSession.myNickname
                                        ? 'bg-purple-500/20 ml-8'
                                        : 'bg-slate-700/50 mr-8'
                                        }`}
                                >
                                    <p className="text-xs text-purple-400 font-medium mb-1">
                                        {msg.senderNickname === activeSession.myNickname ? 'You' : msg.senderNickname}
                                    </p>
                                    <p className="text-white text-sm">{msg.content}</p>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 input-modern text-white bg-transparent py-2 px-3"
                                maxLength={500}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim()}
                                className="px-4 py-2 rounded-xl btn-gradient text-white font-semibold disabled:opacity-50"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Render main Quick Match view
    return (
        <div className="max-w-lg mx-auto px-4 py-6">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="text-5xl mb-3">⚡</div>
                <h1 className="text-3xl font-bold gradient-text mb-2">Quick Match</h1>
                <p className="text-gray-400">Find riders nearby going your way — right now!</p>
            </div>

            {/* Location Status */}
            <div className="glass-card p-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${location ? 'bg-green-500/20' : locationError ? 'bg-red-500/20' : 'bg-yellow-500/20'
                        }`}>
                        {gettingLocation ? (
                            <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                        ) : location ? (
                            <span className="text-green-400">📍</span>
                        ) : (
                            <span className="text-red-400">⚠️</span>
                        )}
                    </div>
                    <div className="flex-1">
                        {gettingLocation ? (
                            <p className="text-yellow-400">Getting your location...</p>
                        ) : location ? (
                            <div>
                                <p className="text-green-400">Location detected ✓</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    📍 Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-red-400">{locationError}</p>
                                <button
                                    onClick={getCurrentLocation}
                                    className="text-purple-400 text-sm underline mt-1"
                                >
                                    Try again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Destination Selection - Combobox */}
            <div className="glass-card p-4 mb-4 relative">
                <label className="block text-sm text-gray-400 mb-2">Where are you going?</label>
                <input
                    type="text"
                    value={destinationText}
                    onChange={(e) => {
                        setDestinationText(e.target.value);
                        setSelectedDestination(null);
                        setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    placeholder="Type or select destination"
                    className="w-full input-modern text-white bg-transparent py-3 px-4"
                    disabled={!location}
                />
                {showDestDropdown && filteredDestinations.length > 0 && (
                    <div className="absolute z-10 left-4 right-4 mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-lg">
                        {filteredDestinations.map((dest) => (
                            <button
                                key={dest.id}
                                type="button"
                                onClick={() => {
                                    setSelectedDestination(dest.id);
                                    setDestinationText(dest.name);
                                    setShowDestDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 transition-colors"
                            >
                                {dest.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Max Participants */}
            <div className="glass-card p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">Max people can join</label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="2"
                        max="6"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-2xl font-bold text-purple-400 w-10 text-center">{maxParticipants}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={findNearby}
                    disabled={!location || loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                    {loading ? '🔍 Searching...' : '🔍 Find Matches'}
                </button>
                <button
                    onClick={createSession}
                    disabled={!location || !destinationText || loading}
                    className="flex-1 py-3 rounded-xl font-semibold btn-gradient text-white disabled:opacity-50"
                >
                    ⚡ Start Quick Match
                </button>
            </div>

            {/* Nearby Sessions */}
            {nearbySessions.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-3">
                        {nearbySessions.length} Nearby {nearbySessions.length === 1 ? 'Match' : 'Matches'}
                    </h2>
                    <div className="space-y-3">
                        {nearbySessions.map((session) => (
                            <QuickMatchCard
                                key={session._id}
                                session={session}
                                onJoin={joinSession}
                                joining={joining}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state after search */}
            {!loading && nearbySessions.length === 0 && selectedDestination && (
                <div className="text-center py-8 glass-card">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-400 mb-2">No one nearby going to this destination</p>
                    <p className="text-sm text-gray-500">Start a Quick Match and others will find you!</p>
                </div>
            )}
        </div>
    );
}

export default QuickMatch;
