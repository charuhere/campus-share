// Complete Profile Page - Premium Design

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_LOCATIONS } from '../constants/locations';
import toast from 'react-hot-toast';

function CompleteProfile() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [hostel, setHostel] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);

    const { completeProfile } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !phone || !hostel) {
            toast.error('Please fill all required fields');
            return;
        }

        if (phone.length !== 10) {
            toast.error('Enter a valid 10-digit phone number');
            return;
        }

        try {
            setLoading(true);
            await completeProfile({ name, phone, hostel, department });
            toast.success('Profile completed!');
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
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

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit number"
                                className="input-modern text-white placeholder-gray-500 w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">
                                Hostel *
                            </label>
                            <select
                                value={hostel}
                                onChange={(e) => setHostel(e.target.value)}
                                className="input-modern text-white w-full"
                                required
                            >
                                <option value="" className="bg-gray-900">Select your hostel</option>
                                {CAMPUS_LOCATIONS.filter(loc => loc.id.includes('h-')).map((loc) => (
                                    <option key={loc.id} value={loc.name} className="bg-gray-900">
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
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
