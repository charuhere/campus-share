// Create Ride - Premium Design

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPUS_LOCATIONS, DESTINATIONS, CAB_TYPES, ON_THE_WAY_STOPS } from '../constants/locations';
import api from '../services/api';
import toast from 'react-hot-toast';

function CreateRide() {
    const [step, setStep] = useState(1);
    const [fromId, setFromId] = useState('');
    const [toId, setToId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [cabTypeId, setCabTypeId] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedDropPoints, setSelectedDropPoints] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const selectedFrom = CAMPUS_LOCATIONS.find(loc => loc.id === fromId);
    const selectedTo = DESTINATIONS.find(dest => dest.id === toId);
    const selectedCab = CAB_TYPES.find(cab => cab.id === cabTypeId);
    const availableDropPoints = toId ? (ON_THE_WAY_STOPS[toId] || []) : [];

    useEffect(() => {
        if (selectedTo) {
            setEstimatedCost(selectedTo.estimatedCost.toString());
        }
    }, [toId]);

    const toggleDropPoint = (dp) => {
        setSelectedDropPoints(prev => {
            const exists = prev.find(d => d.id === dp.id);
            return exists ? prev.filter(d => d.id !== dp.id) : [...prev, dp];
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fromId || !toId || !date || !time || !cabTypeId || !estimatedCost) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            const dateTime = new Date(`${date}T${time}`);

            await api.post('/rides', {
                from: { id: fromId, name: selectedFrom.name },
                to: { id: toId, name: selectedTo.name },
                dropPoints: selectedDropPoints,
                dateTime: dateTime.toISOString(),
                cabType: { id: cabTypeId, name: selectedCab.name, maxSeats: selectedCab.maxSeats },
                totalSeats: selectedCab.maxSeats,
                estimatedCost: parseInt(estimatedCost),
                notes,
            });

            toast.success('Ride created!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create ride');
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold gradient-text mb-2">Create a Ride</h1>
                <p className="text-gray-400">Share your journey with others</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`w-12 h-1 rounded-full transition-all ${step >= s ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
                            }`}
                    />
                ))}
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-8">
                {/* Step 1: Route */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-4">📍 Where are you going?</h2>

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">Pickup Location</label>
                            <select
                                value={fromId}
                                onChange={(e) => setFromId(e.target.value)}
                                className="input-modern text-white w-full"
                                required
                            >
                                <option value="" className="bg-gray-900">Select pickup</option>
                                {CAMPUS_LOCATIONS.map((loc) => (
                                    <option key={loc.id} value={loc.id} className="bg-gray-900">{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">Final Destination</label>
                            <select
                                value={toId}
                                onChange={(e) => { setToId(e.target.value); setSelectedDropPoints([]); }}
                                className="input-modern text-white w-full"
                                required
                            >
                                <option value="" className="bg-gray-900">Select destination</option>
                                {DESTINATIONS.map((dest) => (
                                    <option key={dest.id} value={dest.id} className="bg-gray-900">
                                        {dest.name} (≈₹{dest.estimatedCost})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {availableDropPoints.length > 0 && (
                            <div>
                                <label className="block text-gray-300 text-sm mb-2">Allow On-the-Way Drops</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableDropPoints.map((dp) => {
                                        const isSelected = selectedDropPoints.find(s => s.id === dp.id);
                                        return (
                                            <button
                                                key={dp.id}
                                                type="button"
                                                onClick={() => toggleDropPoint(dp)}
                                                className={`p-3 rounded-xl text-left text-sm transition ${isSelected
                                                        ? 'bg-purple-500/20 ring-1 ring-purple-500'
                                                        : 'bg-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="text-white">{dp.name}</div>
                                                <div className="text-gray-500">₹{dp.estimatedCost}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            disabled={!fromId || !toId}
                            className="w-full btn-gradient text-white py-4 rounded-xl font-semibold disabled:opacity-50"
                        >
                            Continue →
                        </button>
                    </div>
                )}

                {/* Step 2: When & How */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-4">🕐 When & How?</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-2">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    min={today}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="input-modern text-white w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-2">Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="input-modern text-white w-full"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">Cab Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CAB_TYPES.map((cab) => (
                                    <button
                                        key={cab.id}
                                        type="button"
                                        onClick={() => setCabTypeId(cab.id)}
                                        className={`p-4 rounded-xl text-left transition ${cabTypeId === cab.id
                                                ? 'bg-purple-500/20 ring-1 ring-purple-500'
                                                : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{cab.icon}</div>
                                        <div className="text-white font-medium">{cab.name}</div>
                                        <div className="text-gray-500 text-sm">{cab.maxSeats} seats</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                disabled={!date || !time || !cabTypeId}
                                className="flex-1 btn-gradient text-white py-4 rounded-xl font-semibold disabled:opacity-50"
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Cost & Notes */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-4">💰 Final Details</h2>

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">Estimated Cost (₹)</label>
                            <input
                                type="number"
                                value={estimatedCost}
                                onChange={(e) => setEstimatedCost(e.target.value)}
                                className="input-modern text-white w-full text-2xl font-bold"
                                required
                                min="0"
                            />
                            <p className="text-gray-500 text-sm mt-1">Total cab cost, will be split among riders</p>
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm mb-2">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Meeting point, luggage info, etc."
                                rows={3}
                                className="input-modern text-white w-full resize-none"
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-white/5 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Route</span>
                                <span className="text-white">{selectedFrom?.name} → {selectedTo?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">When</span>
                                <span className="text-white">{date} at {time}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Cab</span>
                                <span className="text-white">{selectedCab?.icon} {selectedCab?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Drop Points</span>
                                <span className="text-white">{selectedDropPoints.length} stops</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10"
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-gradient text-white py-4 rounded-xl font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Ride ✨'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}

export default CreateRide;
