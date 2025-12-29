// Ride Chat - Uber Style

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, Lock, Unlock, ArrowLeft, Send, MessageCircle, Info } from 'lucide-react';

function RideChat() {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    const messagesEndRef = useRef(null);

    const isCreator = ride && profile && ride.creator._id === profile._id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        async function initialize() {
            try {
                const response = await api.get(`/rides/${rideId}`);
                setRide(response.data.ride);
                setIsClosed(response.data.ride.isClosed || false);

                const socket = await connectSocket();
                socket.emit('join-ride', rideId);

                socket.on('previous-messages', (msgs) => {
                    setMessages(msgs);
                    setLoading(false);
                });

                socket.on('new-message', (message) => {
                    setMessages((prev) => {
                        // Prevent duplicates
                        if (prev.some(m => m._id === message._id)) {
                            return prev;
                        }
                        return [...prev, message];
                    });
                });

                socket.on('error', (error) => {
                    toast.error(error);
                });

                setConnected(true);
            } catch (error) {
                toast.error('Failed to load chat');
                navigate('/');
            }
        }

        initialize();

        return () => {
            const socket = getSocket();
            if (socket) {
                socket.emit('leave-ride', rideId);
                socket.off('previous-messages');
                socket.off('new-message');
                socket.off('error');
            }
        };
    }, [rideId, navigate]);

    const closeRoom = async () => {
        try {
            const response = await api.post(`/rides/${rideId}/close`);
            setIsClosed(response.data.isClosed);
            toast.success(response.data.message);
        } catch (error) {
            toast.error('Failed to close room');
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const socket = getSocket();
        if (socket) {
            socket.emit('send-message', { rideId, content: newMessage.trim() });
            setNewMessage('');
        }
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-black flex items-center gap-2">
                            {ride?.from.name} → {ride?.to.name}
                            {isClosed && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-600 font-medium flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Closed
                                </span>
                            )}
                        </h2>
                        <p className="text-gray-600 text-sm flex items-center gap-2">
                            <span>{ride?.participants.length}/{ride?.totalSeats} riders</span>
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isCreator && (
                            <button
                                onClick={closeRoom}
                                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${isClosed
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                    }`}
                            >
                                {isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {isClosed ? 'Reopen' : 'Close Room'}
                            </button>
                        )}
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-black transition p-2 rounded-lg hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">No messages yet</h3>
                            <p className="text-gray-500">Start the conversation with your co-riders!</p>
                        </div>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender === profile._id;

                        return (
                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1 w-full'}`}>
                                    {!isMe && (
                                        <p className="text-xs text-gray-500 mb-1 ml-3 font-medium">{msg.senderName}</p>
                                    )}
                                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${isMe
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-white text-black rounded-bl-none border border-gray-100'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                                            {formatTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 text-black rounded-full px-6 py-3 border-none focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-black text-white p-3 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors flex items-center justify-center"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RideChat;
