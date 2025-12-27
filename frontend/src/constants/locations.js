// Predefined locations and constants

export const CAMPUS_LOCATIONS = [
    // Men's Hostels
    { id: 'mh-a', name: "Men's Hostel A Block" },
    { id: 'mh-b', name: "Men's Hostel B Block" },
    { id: 'mh-c', name: "Men's Hostel C Block" },
    { id: 'mh-d', name: "Men's Hostel D Block" },
    { id: 'mh-e', name: "Men's Hostel E Block" },
    { id: 'mh-f', name: "Men's Hostel F Block" },
    { id: 'mh-g', name: "Men's Hostel G Block" },
    { id: 'mh-h', name: "Men's Hostel H Block" },
    { id: 'mh-j', name: "Men's Hostel J Block" },
    { id: 'mh-k', name: "Men's Hostel K Block" },
    { id: 'mh-l', name: "Men's Hostel L Block" },
    { id: 'mh-m', name: "Men's Hostel M Block" },
    { id: 'mh-n', name: "Men's Hostel N Block" },
    { id: 'mh-p', name: "Men's Hostel P Block" },
    { id: 'mh-q', name: "Men's Hostel Q Block" },
    { id: 'mh-r', name: "Men's Hostel R Block" },

    // Ladies Hostels
    { id: 'lh-a', name: "Ladies Hostel A Block" },
    { id: 'lh-b', name: "Ladies Hostel B Block" },
    { id: 'lh-c', name: "Ladies Hostel C Block" },
    { id: 'lh-d', name: "Ladies Hostel D Block" },
    { id: 'lh-e', name: "Ladies Hostel E Block" },
    { id: 'lh-f', name: "Ladies Hostel F Block" },

    // Campus Points
    { id: 'main-gate', name: "Main Gate" },
    { id: 'katpadi-gate', name: "Katpadi Gate" },
    { id: 'anna-audi', name: "Anna Auditorium" },
    { id: 'tech-tower', name: "Technology Tower" },
    { id: 'sjt', name: "SJT" },
    { id: 'tt', name: "TT" },
    { id: 'cdmm', name: "CDMM" },
];

export const DESTINATIONS = [
    { id: 'katpadi-rs', name: "Katpadi Railway Station", estimatedCost: 150 },
    { id: 'vellore-bus', name: "Vellore Bus Stand", estimatedCost: 250 },
    { id: 'chennai-airport', name: "Chennai Airport", estimatedCost: 3500 },
    { id: 'chennai-central', name: "Chennai Central Railway Station", estimatedCost: 3600 },
    { id: 'bangalore-airport', name: "Bangalore Airport", estimatedCost: 5000 },
];

// On-the-way stops for each destination
export const ON_THE_WAY_STOPS = {
    'chennai-airport': [
        { id: 'katpadi-rs', name: "Katpadi Railway Station", estimatedCost: 150 },
        { id: 'ranipet', name: "Ranipet", estimatedCost: 500 },
        { id: 'sriperumbudur', name: "Sriperumbudur", estimatedCost: 2500 },
        { id: 'poonamallee', name: "Poonamallee", estimatedCost: 2800 },
    ],
    'chennai-central': [
        { id: 'katpadi-rs', name: "Katpadi Railway Station", estimatedCost: 150 },
        { id: 'ranipet', name: "Ranipet", estimatedCost: 500 },
        { id: 'vellore-bus', name: "Vellore Bus Stand", estimatedCost: 250 },
        { id: 'koyambedu', name: "Koyambedu", estimatedCost: 3000 },
    ],
    'bangalore-airport': [
        { id: 'krishnagiri', name: "Krishnagiri", estimatedCost: 1500 },
        { id: 'hosur', name: "Hosur", estimatedCost: 2500 },
        { id: 'electronic-city', name: "Electronic City", estimatedCost: 3500 },
    ],
};

export const CAB_TYPES = [
    { id: 'sedan', name: 'Sedan (Ola/Uber)', maxSeats: 4, icon: '🚗' },
    { id: 'suv', name: 'SUV', maxSeats: 6, icon: '🚙' },
];
