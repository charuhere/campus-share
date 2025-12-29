// Complete Profile Page - Premium Design

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_LOCATIONS } from '../constants/locations';
import toast from 'react-hot-toast';

function CompleteProfile() {
    const [name, setName] = useState('');
    const [hostel, setHostel] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHostelDropdown, setShowHostelDropdown] = useState(false);

    const { completeProfile } = useAuth();
    const navigate = useNavigate();

    // Get hostel options from campus locations
    const hostelOptions = CAMPUS_LOCATIONS.filter(loc =>
        loc.id.includes('h-') || loc.id.includes('lh-')
    );

    // Filter hostels based on input
    const filteredHostels = hostelOptions.filter(h =>
        h.name.toLowerCase().includes(hostel.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        try {
            setLoading(true);
            await completeProfile({ name: name.trim(), hostel, department });
            toast.success('Profile completed!');
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
    };

    const selectHostel = (hostelName) => {
        setHostel(hostelName);
        setShowHostelDropdown(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="text-6xl mb-4">👋</div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                        Almost There!
                    </h1>
                    <p className="text-gray-400">
                        Complete your profile to start sharing rides
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-300 text-sm mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                className="input-modern text-white placeholder-gray-500 w-full"
                                required
                            />
                        </div>

                        {/* Hostel Combobox - Optional */}
                        <div className="relative">
                            <label className="block text-gray-300 text-sm mb-2">
                                Hostel (Optional)
                            </label>
                            <input
                                type="text"
                                value={hostel}
                                onChange={(e) => {
                                    setHostel(e.target.value);
                                    setShowHostelDropdown(true);
                                }}
                                onFocus={() => setShowHostelDropdown(true)}
                                placeholder="Type or select your hostel"
                                className="input-modern text-white placeholder-gray-500 w-full"
                            />

                            {/* Dropdown */}
                            {showHostelDropdown && filteredHostels.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-lg">
                                    {filteredHostels.map((h) => (
                                        <button
                                            key={h.id}
                                            type="button"
                                            onClick={() => selectHostel(h.name)}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        >
                                            {h.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">
                                Department (Optional)
                            </label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="e.g., CSE, ECE, MECH"
                                className="input-modern text-white placeholder-gray-500 w-full"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gradient text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Complete Profile ✨'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CompleteProfile;
