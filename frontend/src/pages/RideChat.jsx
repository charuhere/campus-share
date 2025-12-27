// Ride Chat - Premium Design

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';

function RideChat() {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    const messagesEndRef = useRef(null);

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
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="glass-card rounded-none border-0 border-b border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {ride?.from.name} → {ride?.to.name}
                        </h2>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                            <span>{ride?.participants.length} riders</span>
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-xs">{connected ? 'Connected' : 'Disconnected'}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-white transition px-4 py-2 rounded-lg bg-white/5"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">💬</div>
                            <p className="text-gray-400">No messages yet. Say hi!</p>
                        </div>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender === profile._id;

                        return (
                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                                    {!isMe && (
                                        <p className="text-xs text-gray-500 mb-1 ml-3">{msg.senderName}</p>
                                    )}
                                    <div className={`px-4 py-3 rounded-2xl ${isMe
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-none'
                                        : 'glass-card text-white rounded-bl-none'
                                        }`}>
                                        <p>{msg.content}</p>
                                        <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
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
            <div className="glass-card rounded-none border-0 border-t border-white/10 p-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 input-modern text-white rounded-full px-6"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="btn-gradient px-6 py-3 rounded-full text-white font-semibold disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RideChat;
