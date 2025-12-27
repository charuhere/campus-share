// Trusted Users Page - Premium Design

import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function TrustedUsers() {
    const [trustedUsers, setTrustedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrustedUsers();
    }, []);

    const fetchTrustedUsers = async () => {
        try {
            const response = await api.get('/trust');
            setTrustedUsers(response.data.trustedUsers);
        } catch (error) {
            toast.error('Failed to load trusted users');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (userId, name) => {
        if (!confirm(`Remove ${name} from trusted list?`)) return;

        try {
            await api.delete(`/trust/${userId}`);
            toast.success(`Removed ${name}`);
            fetchTrustedUsers();
        } catch (error) {
            toast.error('Failed to remove');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="text-6xl mb-4 animate-float">⭐</div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Trusted People</h1>
                <p className="text-gray-400">
                    People you trust for ride sharing
                </p>
            </div>

            {/* Stats */}
            <div className="glass-card p-6 text-center mb-8">
                <div className="text-4xl font-bold gradient-text mb-1">{trustedUsers.length}</div>
                <div className="text-gray-400">Trusted Contacts</div>
            </div>

            {/* Empty State */}
            {trustedUsers.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">
                        No trusted users yet. Complete rides with people and add them to your trusted list!
                    </p>
                </div>
            )}

            {/* Users List */}
            {trustedUsers.length > 0 && (
                <div className="space-y-4">
                    {trustedUsers.map((user) => (
                        <div key={user._id} className="glass-card p-5 flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-white truncate">{user.name}</h3>
                                    <span className="text-green-400 text-sm">⭐</span>
                                </div>
                                <p className="text-gray-400 text-sm">{user.hostel}</p>
                                <p className="text-gray-500 text-xs">{user.ridesCompleted} rides completed</p>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => handleRemove(user._id, user.name)}
                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm flex-shrink-0"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Tip */}
            <div className="mt-8 glass-card p-4 text-center">
                <p className="text-gray-400 text-sm">
                    💡 Tip: Filter rides by "Trusted Only" on the home page to see rides from people you trust!
                </p>
            </div>
        </div>
    );
}

export default TrustedUsers;
