// Profile Page - Premium Design

import { useAuth } from '../contexts/AuthContext';

function Profile() {
    const { profile } = useAuth();

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="glass-card p-8 text-center mb-8">
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                </div>

                <h1 className="text-3xl font-bold text-white mb-1">{profile.name}</h1>
                <p className="text-gray-400 mb-4">{profile.email}</p>

                {/* Badges */}
                <div className="flex justify-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                        🎓 VIT Student
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
                        ✓ Verified
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard
                    icon="🚗"
                    value={profile.ridesCreated}
                    label="Created"
                    gradient="from-blue-500 to-cyan-500"
                />
                <StatCard
                    icon="🤝"
                    value={profile.ridesJoined}
                    label="Joined"
                    gradient="from-purple-500 to-pink-500"
                />
                <StatCard
                    icon="✅"
                    value={profile.ridesCompleted}
                    label="Completed"
                    gradient="from-green-500 to-emerald-500"
                />
            </div>

            {/* Info Cards */}
            <div className="space-y-4">
                <InfoCard label="Phone" value={profile.phone} icon="📱" />
                <InfoCard label="Hostel" value={profile.hostel} icon="🏠" />
                <InfoCard label="Department" value={profile.department || 'Not set'} icon="📚" />
                <InfoCard
                    label="Member Since"
                    value={new Date(profile.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                    icon="📅"
                />
            </div>
        </div>
    );
}

function StatCard({ icon, value, label, gradient }) {
    return (
        <div className="glass-card p-6 text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {value}
            </div>
            <div className="text-gray-400 text-sm">{label}</div>
        </div>
    );
}

function InfoCard({ label, value, icon }) {
    return (
        <div className="glass-card p-4 flex items-center gap-4">
            <div className="text-2xl">{icon}</div>
            <div className="flex-1">
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="text-white font-medium">{value}</p>
            </div>
        </div>
    );
}

export default Profile;
