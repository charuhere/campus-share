// Create Ride - Premium Design with Combobox Inputs

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPUS_LOCATIONS, DESTINATIONS, CAB_TYPES, ON_THE_WAY_STOPS } from '../constants/locations';
import api from '../services/api';
import toast from 'react-hot-toast';

function CreateRide() {
    const [step, setStep] = useState(1);

    // Location inputs (can be typed or selected)
    const [fromText, setFromText] = useState('');
    const [fromId, setFromId] = useState('');
    const [showFromDropdown, setShowFromDropdown] = useState(false);

    const [toText, setToText] = useState('');
    const [toId, setToId] = useState('');
    const [showToDropdown, setShowToDropdown] = useState(false);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [cabTypeId, setCabTypeId] = useState('');
    const [maxPeople, setMaxPeople] = useState(4);
    const [estimatedCost, setEstimatedCost] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedDropPoints, setSelectedDropPoints] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Filter locations based on input
    const filteredFromLocations = CAMPUS_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(fromText.toLowerCase())
    );

    // Combine destinations and campus locations for "to" field
    const allToLocations = [...DESTINATIONS, ...CAMPUS_LOCATIONS];
    const filteredToLocations = allToLocations.filter(loc =>
        loc.name.toLowerCase().includes(toText.toLowerCase())
    );

    const selectedFrom = CAMPUS_LOCATIONS.find(loc => loc.id === fromId) ||
        (fromText ? { id: 'custom', name: fromText } : null);
    const selectedTo = DESTINATIONS.find(dest => dest.id === toId) ||
        CAMPUS_LOCATIONS.find(loc => loc.id === toId) ||
        (toText ? { id: 'custom', name: toText, estimatedCost: 0 } : null);
    const selectedCab = CAB_TYPES.find(cab => cab.id === cabTypeId);
    const availableDropPoints = toId ? (ON_THE_WAY_STOPS[toId] || []) : [];

    useEffect(() => {
        if (selectedTo?.estimatedCost) {
            setEstimatedCost(selectedTo.estimatedCost.toString());
        }
    }, [toId]);

    const selectFrom = (loc) => {
        setFromId(loc.id);
        setFromText(loc.name);
        setShowFromDropdown(false);
    };

    const selectTo = (loc) => {
        setToId(loc.id);
        setToText(loc.name);
        setShowToDropdown(false);
        setSelectedDropPoints([]);
    };

    const toggleDropPoint = (dp) => {
        setSelectedDropPoints(prev => {
            const exists = prev.find(d => d.id === dp.id);
            return exists ? prev.filter(d => d.id !== dp.id) : [...prev, dp];
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fromText || !toText || !date || !time || !cabTypeId || !estimatedCost) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            const dateTime = new Date(`${date}T${time}`);

            await api.post('/rides', {
                from: { id: fromId || 'custom', name: fromText },
                to: { id: toId || 'custom', name: toText },
                dropPoints: selectedDropPoints,
                dateTime: dateTime.toISOString(),
                cabType: { id: cabTypeId, name: selectedCab.name, maxSeats: selectedCab.maxSeats },
                totalSeats: maxPeople,
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

                        {/* From - Combobox */}
                        <div className="relative">
                            <label className="block text-gray-300 text-sm mb-2">Pickup Location</label>
                            <input
                                type="text"
                                value={fromText}
                                onChange={(e) => {
                                    setFromText(e.target.value);
                                    setFromId('');
                                    setShowFromDropdown(true);
                                }}
                                onFocus={() => setShowFromDropdown(true)}
                                placeholder="Type or select pickup location"
                                className="input-modern text-white w-full"
                                required
                            />
                            {showFromDropdown && filteredFromLocations.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-lg">
                                    {filteredFromLocations.slice(0, 8).map((loc) => (
                                        <button
                                            key={loc.id}
                                            type="button"
                                            onClick={() => selectFrom(loc)}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 transition-colors"
                                        >
                                            {loc.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* To - Combobox */}
                        <div className="relative">
                            <label className="block text-gray-300 text-sm mb-2">Final Destination</label>
                            <input
                                type="text"
                                value={toText}
                                onChange={(e) => {
                                    setToText(e.target.value);
                                    setToId('');
                                    setShowToDropdown(true);
                                }}
                                onFocus={() => setShowToDropdown(true)}
                                placeholder="Type or select destination"
                                className="input-modern text-white w-full"
                                required
                            />
                            {showToDropdown && filteredToLocations.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-lg">
                                    {filteredToLocations.slice(0, 8).map((loc) => (
                                        <button
                                            key={loc.id}
                                            type="button"
                                            onClick={() => selectTo(loc)}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 transition-colors"
                                        >
                                            {loc.name} {loc.estimatedCost ? `(≈₹${loc.estimatedCost})` : ''}
                                        </button>
                                    ))}
                                </div>
                            )}
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
                            disabled={!fromText || !toText}
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

                        {/* Max People Setting */}
                        <div>
                            <label className="block text-gray-300 text-sm mb-2">Max People Can Join</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="2"
                                    max={selectedCab?.maxSeats || 6}
                                    value={maxPeople}
                                    onChange={(e) => setMaxPeople(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <span className="text-2xl font-bold text-purple-400 w-10 text-center">{maxPeople}</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">You can close the ride anytime after creating</p>
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
                                <span className="text-white">{fromText} → {toText}</span>
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
                                <span className="text-gray-400">Max People</span>
                                <span className="text-purple-400 font-semibold">{maxPeople}</span>
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
