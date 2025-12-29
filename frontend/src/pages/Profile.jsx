// Profile Page - Premium Design with Edit Feature

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_LOCATIONS } from '../constants/locations';
import toast from 'react-hot-toast';

function Profile() {
    const { profile, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editHostel, setEditHostel] = useState('');
    const [editDepartment, setEditDepartment] = useState('');
    const [showHostelDropdown, setShowHostelDropdown] = useState(false);
    const [saving, setSaving] = useState(false);

    // Get hostel options from campus locations
    const hostelOptions = CAMPUS_LOCATIONS.filter(loc =>
        loc.id.includes('h-') || loc.id.includes('lh-')
    );

    // Filter hostels based on input
    const filteredHostels = hostelOptions.filter(h =>
        h.name.toLowerCase().includes(editHostel.toLowerCase())
    );

    const openEditModal = () => {
        setEditName(profile.name);
        setEditHostel(profile.hostel || '');
        setEditDepartment(profile.department || '');
        setIsEditing(true);
    };

    const closeEditModal = () => {
        setIsEditing(false);
        setShowHostelDropdown(false);
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            toast.error('Name is required');
            return;
        }

        try {
            setSaving(true);
            await updateProfile({
                name: editName.trim(),
                hostel: editHostel,
                department: editDepartment,
            });
            toast.success('Profile updated!');
            closeEditModal();
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="glass-card p-8 text-center mb-8">
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-black">
                    {profile.name.charAt(0).toUpperCase()}
                </div>

                <h1 className="text-3xl font-bold text-black mb-1">{profile.name}</h1>
                <p className="text-gray-600 mb-4">{profile.email}</p>

                {/* Badges */}
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
                        🎓 VIT Student
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
                        ✓ Verified
                    </span>
                </div>

                {/* Edit Button */}
                <button
                    onClick={openEditModal}
                    className="px-6 py-2 rounded-xl font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                >
                    ✏️ Edit Profile
                </button>
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
                    gradient="from-emerald-500 to-pink-500"
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
                <InfoCard label="Hostel" value={profile.hostel || 'Not set'} icon="🏠" />
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

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-black mb-6">Edit Profile</h2>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-gray-700 text-sm mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Your full name"
                                    className="input-modern text-black placeholder-gray-500 w-full"
                                />
                            </div>

                            {/* Hostel Combobox */}
                            <div className="relative">
                                <label className="block text-gray-700 text-sm mb-2">
                                    Hostel
                                </label>
                                <input
                                    type="text"
                                    value={editHostel}
                                    onChange={(e) => {
                                        setEditHostel(e.target.value);
                                        setShowHostelDropdown(true);
                                    }}
                                    onFocus={() => setShowHostelDropdown(true)}
                                    placeholder="Type or select your hostel"
                                    className="input-modern text-black placeholder-gray-500 w-full"
                                />

                                {/* Dropdown */}
                                {showHostelDropdown && filteredHostels.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-lg">
                                        {filteredHostels.slice(0, 5).map((h) => (
                                            <button
                                                key={h.id}
                                                type="button"
                                                onClick={() => {
                                                    setEditHostel(h.name);
                                                    setShowHostelDropdown(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-black text-sm hover:bg-emerald-500/20 transition-colors"
                                            >
                                                {h.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-gray-700 text-sm mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={editDepartment}
                                    onChange={(e) => setEditDepartment(e.target.value)}
                                    placeholder="e.g., CSE, ECE, MECH"
                                    className="input-modern text-black placeholder-gray-500 w-full"
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 text-black hover:bg-slate-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl font-semibold btn-gradient text-black disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
            <div className="text-gray-600 text-sm">{label}</div>
        </div>
    );
}

function InfoCard({ label, value, icon }) {
    return (
        <div className="glass-card p-4 flex items-center gap-4">
            <div className="text-2xl">{icon}</div>
            <div className="flex-1">
                <p className="text-gray-600 text-sm">{label}</p>
                <p className="text-black font-medium">{value}</p>
            </div>
        </div>
    );
}

export default Profile;
