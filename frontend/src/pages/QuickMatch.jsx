// QuickMatch Page - Uber Style

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DESTINATIONS } from '../constants/locations';
import QuickMatchCard from '../components/QuickMatchCard';
import api from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import toast from 'react-hot-toast';
import { Zap, MapPin, Search, Navigation, Users, Loader2, MessageCircle, Lock, Unlock, X, Clock, Send, AlertTriangle } from 'lucide-react';

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
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-black">Quick Match Active</h2>
                                <p className="text-sm text-gray-600">Going to {activeSession.destination.name}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg font-mono font-bold flex items-center gap-1 ${timeRemaining < 60 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}>
                            <Clock className="w-4 h-4" />
                            {formatTime(timeRemaining)}
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm mb-4 bg-gray-50 p-3 rounded-lg">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                            {activeSession.participantCount} people • You are
                            <span className="text-black font-semibold"> {activeSession.myNickname}</span>
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="flex-1 py-2 rounded-xl font-semibold bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {showChat ? 'Hide Chat' : 'Open Chat'}
                        </button>
                        {activeSession.isCreator && (
                            <button
                                onClick={closeRoom}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${roomClosed
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    }`}
                            >
                                {roomClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {roomClosed ? 'Reopen' : 'Close Room'}
                            </button>
                        )}
                        <button
                            onClick={leaveSession}
                            className="px-4 py-2 rounded-xl font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            {activeSession.isCreator ? 'Cancel' : 'Leave'}
                        </button>
                    </div>
                </div>

                {/* Chat */}
                {showChat && (
                    <div className="flex-1 glass-card p-4 flex flex-col min-h-0 bg-gray-50">
                        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Group Chat
                        </h3>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0 p-2">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm">No messages yet. Say hi! 👋</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`flex flex-col ${msg.senderNickname === activeSession.myNickname
                                        ? 'items-end'
                                        : 'items-start'
                                        }`}
                                >
                                    <span className="text-xs text-gray-500 mb-1 px-1">
                                        {msg.senderNickname === activeSession.myNickname ? 'You' : msg.senderNickname}
                                    </span>
                                    <div
                                        className={`px-3 py-2 rounded-xl max-w-[85%] ${msg.senderNickname === activeSession.myNickname
                                            ? 'bg-black text-white rounded-tr-none'
                                            : 'bg-white text-black border border-gray-200 rounded-tl-none'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
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
                                className="flex-1 input-modern text-black bg-white py-2 px-4 rounded-full border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none"
                                maxLength={500}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim()}
                                className="p-2 rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center w-10 h-10"
                            >
                                <Send className="w-5 h-5 ml-0.5" />
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
                <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-black mb-2">Quick Match</h1>
                <p className="text-gray-600">Find riders nearby going your way — right now!</p>
            </div>

            {/* Location Status */}
            <div className="glass-card p-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${location ? 'bg-green-100 text-green-600' : locationError ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                        {gettingLocation ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : location ? (
                            <MapPin className="w-5 h-5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5" />
                        )}
                    </div>
                    <div className="flex-1">
                        {gettingLocation ? (
                            <p className="text-gray-600 font-medium">Getting your location...</p>
                        ) : location ? (
                            <div>
                                <p className="text-green-600 font-medium flex items-center gap-1">
                                    Location detected <CheckCircle className="w-3 h-3" />
                                </p>
                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-red-500 font-medium">{locationError}</p>
                                <button
                                    onClick={getCurrentLocation}
                                    className="text-black text-sm underline mt-1 font-medium hover:text-gray-700"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Where are you going?</label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
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
                        className="w-full input-modern text-black bg-white pl-10 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none"
                        disabled={!location}
                    />
                </div>
                {showDestDropdown && filteredDestinations.length > 0 && (
                    <div className="absolute z-10 left-4 right-4 mt-1 max-h-48 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-xl">
                        {filteredDestinations.map((dest) => (
                            <button
                                key={dest.id}
                                type="button"
                                onClick={() => {
                                    setSelectedDestination(dest.id);
                                    setDestinationText(dest.name);
                                    setShowDestDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-black hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 flex items-center gap-2"
                            >
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {dest.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Max Participants */}
            <div className="glass-card p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Max people can join</label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="2"
                        max="6"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-black">{maxParticipants}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={findNearby}
                    disabled={!location || loading}
                    className="flex-1 py-4 rounded-xl font-semibold bg-white border border-gray-200 text-black hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Find Matches
                </button>
                <button
                    onClick={createSession}
                    disabled={!location || !destinationText || loading}
                    className="flex-1 py-4 rounded-xl font-semibold bg-black text-white hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    Start Quick Match
                </button>
            </div>

            {/* Nearby Sessions */}
            {nearbySessions.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-black mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5" />
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
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">No one nearby going to this destination</p>
                    <p className="text-sm text-gray-500">Start a Quick Match and others will find you!</p>
                </div>
            )}
        </div>
    );
}

// Helper component for CheckCircle
function CheckCircle({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
            />
        </svg>
    );
}

export default QuickMatch;
