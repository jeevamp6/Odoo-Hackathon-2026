// ===================================
// ACCOMMODATIONS BOOKING
// Travel Planner Application
// ===================================

import { initDB, getTripById, updateTrip, createExpense } from './db.js';
import {
    getCurrentUser,
    clearCurrentUser,
    formatCurrency,
    showToast,
    generateUUID
} from './utils.js';

let currentUser = null;
let currentTrip = null;
let bookedAccommodations = [];

// Hotels database with locations along popular routes
const HOTELS_DATABASE = [
    // Maharashtra (Mumbai-Pune route)
    {
        id: 'hotel-001',
        name: 'Grand Plaza Hotel',
        location: 'Mumbai, Maharashtra',
        state: 'Maharashtra',
        category: 'luxury',
        rating: 4.5,
        price: 150,
        image: 'assets/images/hotel-luxury.jpg',
        description: 'Luxurious hotel in the heart of Mumbai with stunning city views.',
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa', 'Parking'],
        rooms: [
            { type: 'Standard Room', capacity: 2, price: 150 },
            { type: 'Deluxe Suite', capacity: 3, price: 250 },
            { type: 'Presidential Suite', capacity: 4, price: 400 }
        ]
    },
    {
        id: 'hotel-002',
        name: 'Budget Inn Express',
        location: 'Pune, Maharashtra',
        state: 'Maharashtra',
        category: 'budget',
        rating: 3.8,
        price: 40,
        image: 'assets/images/hotel-budget.jpg',
        description: 'Affordable and comfortable stay for budget travelers.',
        amenities: ['WiFi', 'AC', 'Breakfast', 'Parking'],
        rooms: [
            { type: 'Single Room', capacity: 1, price: 30 },
            { type: 'Double Room', capacity: 2, price: 40 },
            { type: 'Family Room', capacity: 4, price: 60 }
        ]
    },

    // Rajasthan
    {
        id: 'hotel-003',
        name: 'Heritage Palace Hotel',
        location: 'Jaipur, Rajasthan',
        state: 'Rajasthan',
        category: 'luxury',
        rating: 4.7,
        price: 180,
        image: 'assets/images/hotel-luxury.jpg',
        description: 'Experience royal hospitality in a heritage property.',
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Cultural Shows', 'Spa', 'Parking'],
        rooms: [
            { type: 'Royal Room', capacity: 2, price: 180 },
            { type: 'Maharaja Suite', capacity: 3, price: 300 },
            { type: 'Palace Suite', capacity: 4, price: 500 }
        ]
    },
    {
        id: 'hotel-004',
        name: 'Desert Comfort Inn',
        location: 'Udaipur, Rajasthan',
        state: 'Rajasthan',
        category: 'mid-range',
        rating: 4.0,
        price: 80,
        image: 'assets/images/hotel-midrange.jpg',
        description: 'Comfortable accommodation with lake views.',
        amenities: ['WiFi', 'Restaurant', 'Rooftop Terrace', 'Parking'],
        rooms: [
            { type: 'Standard Room', capacity: 2, price: 80 },
            { type: 'Lake View Room', capacity: 2, price: 120 }
        ]
    },

    // Delhi
    {
        id: 'hotel-005',
        name: 'Capital Grand Hotel',
        location: 'New Delhi, Delhi',
        state: 'Delhi',
        category: 'luxury',
        rating: 4.6,
        price: 200,
        image: 'assets/images/hotel-luxury.jpg',
        description: 'Premium hotel near major attractions in Delhi.',
        amenities: ['WiFi', 'Pool', 'Gym', 'Multiple Restaurants', 'Spa', 'Concierge'],
        rooms: [
            { type: 'Deluxe Room', capacity: 2, price: 200 },
            { type: 'Executive Suite', capacity: 3, price: 350 }
        ]
    },
    {
        id: 'hotel-006',
        name: 'Delhi Budget Stay',
        location: 'New Delhi, Delhi',
        state: 'Delhi',
        category: 'budget',
        rating: 3.5,
        price: 35,
        image: 'assets/images/hotel-budget.jpg',
        description: 'Clean and affordable rooms in central Delhi.',
        amenities: ['WiFi', 'AC', 'Breakfast'],
        rooms: [
            { type: 'Standard Room', capacity: 2, price: 35 },
            { type: 'Triple Room', capacity: 3, price: 50 }
        ]
    },

    // Punjab
    {
        id: 'hotel-007',
        name: 'Punjab Heritage Hotel',
        location: 'Amritsar, Punjab',
        state: 'Punjab',
        category: 'mid-range',
        rating: 4.2,
        price: 90,
        image: 'assets/images/hotel-midrange.jpg',
        description: 'Traditional Punjabi hospitality near Golden Temple.',
        amenities: ['WiFi', 'Restaurant', 'Cultural Programs', 'Parking'],
        rooms: [
            { type: 'Standard Room', capacity: 2, price: 90 },
            { type: 'Family Suite', capacity: 4, price: 140 }
        ]
    },

    // Himachal Pradesh
    {
        id: 'hotel-008',
        name: 'Mountain View Resort',
        location: 'Shimla, Himachal Pradesh',
        state: 'Himachal Pradesh',
        category: 'mid-range',
        rating: 4.3,
        price: 100,
        image: 'assets/images/hotel-midrange.jpg',
        description: 'Scenic mountain resort with breathtaking views.',
        amenities: ['WiFi', 'Restaurant', 'Bonfire', 'Trekking', 'Parking'],
        rooms: [
            { type: 'Valley View Room', capacity: 2, price: 100 },
            { type: 'Mountain Suite', capacity: 3, price: 150 }
        ]
    },

    // Jammu & Kashmir
    {
        id: 'hotel-009',
        name: 'Kashmir Paradise Hotel',
        location: 'Srinagar, Jammu & Kashmir',
        state: 'Jammu & Kashmir',
        category: 'luxury',
        rating: 4.8,
        price: 160,
        image: 'assets/images/hotel-luxury.jpg',
        description: 'Luxury accommodation with Dal Lake views.',
        amenities: ['WiFi', 'Restaurant', 'Shikara Rides', 'Garden', 'Spa'],
        rooms: [
            { type: 'Lake View Room', capacity: 2, price: 160 },
            { type: 'Houseboat Suite', capacity: 3, price: 250 }
        ]
    },
    {
        id: 'hotel-010',
        name: 'Valley Budget Inn',
        location: 'Srinagar, Jammu & Kashmir',
        state: 'Jammu & Kashmir',
        category: 'budget',
        rating: 3.9,
        price: 45,
        image: 'assets/images/hotel-budget.jpg',
        description: 'Affordable stay in the beautiful Kashmir valley.',
        amenities: ['WiFi', 'Heating', 'Breakfast', 'Parking'],
        rooms: [
            { type: 'Standard Room', capacity: 2, price: 45 },
            { type: 'Family Room', capacity: 4, price: 70 }
        ]
    },

    // Karnataka
    {
        id: 'hotel-011',
        name: 'Tech City Hotel',
        location: 'Bangalore, Karnataka',
        state: 'Karnataka',
        category: 'mid-range',
        rating: 4.1,
        price: 85,
        image: 'assets/images/hotel-midrange.jpg',
        description: 'Modern hotel in the IT capital of India.',
        amenities: ['WiFi', 'Gym', 'Restaurant', 'Business Center', 'Parking'],
        rooms: [
            { type: 'Standard Room', capacity: 2, price: 85 },
            { type: 'Business Suite', capacity: 2, price: 130 }
        ]
    },

    // Goa
    {
        id: 'hotel-012',
        name: 'Beach Paradise Resort',
        location: 'Goa',
        state: 'Goa',
        category: 'luxury',
        rating: 4.6,
        price: 170,
        image: 'assets/images/hotel-luxury.jpg',
        description: 'Beachfront resort with water sports and nightlife.',
        amenities: ['WiFi', 'Pool', 'Beach Access', 'Water Sports', 'Restaurant', 'Bar'],
        rooms: [
            { type: 'Sea View Room', capacity: 2, price: 170 },
            { type: 'Beach Villa', capacity: 4, price: 300 }
        ]
    }
];

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    try {
        await initDB();
    } catch (error) {
        console.error('Failed to initialize database:', error);
        showToast('Failed to initialize application', 'error');
    }

    setupUserInterface();
    setupEventListeners();
    await loadTripData();
});

// ===================================
// SETUP
// ===================================

function setupUserInterface() {
    document.getElementById('userName').textContent = currentUser.name;
    const initials = currentUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    document.getElementById('userAvatar').textContent = initials;
}

function setupEventListeners() {
    // User menu
    document.getElementById('userMenuToggle').addEventListener('click', (e) => {
        e.stopPropagation();
        e.currentTarget.parentElement.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        document.querySelector('.dropdown').classList.remove('active');
    });

    // Logout
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        clearCurrentUser();
        window.location.href = 'index.html';
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterHotels(btn.dataset.filter);
        });
    });
}

// ===================================
// LOAD TRIP DATA
// ===================================

async function loadTripData() {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('id');

    if (!tripId) {
        showToast('No trip selected', 'error');
        setTimeout(() => window.location.href = 'my-trips.html', 1500);
        return;
    }

    try {
        currentTrip = await getTripById(tripId);

        if (!currentTrip) {
            showToast('Trip not found', 'error');
            setTimeout(() => window.location.href = 'my-trips.html', 1500);
            return;
        }

        displayTripInfo();
        calculateJourneyDetails();
        displayAccommodations();

    } catch (error) {
        console.error('Error loading trip:', error);
        showToast('Error loading trip data', 'error');
    }
}

// ===================================
// DISPLAY TRIP INFO
// ===================================

function displayTripInfo() {
    document.getElementById('tripTitle').textContent = `Book Accommodations - ${currentTrip.title}`;

    if (currentTrip.origin && currentTrip.destination) {
        document.getElementById('tripRoute').textContent = `${currentTrip.origin} → ${currentTrip.destination}`;
        document.getElementById('originCity').textContent = currentTrip.origin;
        document.getElementById('destinationCity').textContent = currentTrip.destination;
    }
}

// ===================================
// CALCULATE JOURNEY DETAILS
// ===================================

function calculateJourneyDetails() {
    // Estimate travel time based on travel mode
    const travelModes = {
        'bike': 50, // km/h average
        'car': 70,
        'train': 80,
        'flight': 500,
        'bus': 60,
        'mixed': 70
    };

    const mode = currentTrip.travelMode || 'car';
    const speed = travelModes[mode.toLowerCase()] || 70;

    // Rough distance estimation (this would ideally use a real API)
    const estimatedDistance = 1500; // km (placeholder)
    const travelHours = Math.ceil(estimatedDistance / speed);

    document.getElementById('travelTime').textContent = `${travelHours} hours`;

    // Calculate stops needed (one stop every 8-10 hours of travel)
    const stopsNeeded = Math.max(0, Math.floor(travelHours / 8));
    document.getElementById('stopsNeeded').textContent = stopsNeeded;

    // Add waypoints to journey path
    const journeyPath = document.getElementById('journeyPath');
    journeyPath.innerHTML = '';

    if (currentTrip.selectedAttractions && currentTrip.selectedAttractions.length > 0) {
        const waypoints = currentTrip.selectedAttractions.slice(0, 3);
        waypoints.forEach((attraction, index) => {
            const waypoint = document.createElement('div');
            waypoint.className = 'journey-waypoint';
            waypoint.textContent = '🏛️';
            waypoint.title = attraction.name;
            waypoint.style.marginLeft = `${(index + 1) * (100 / (waypoints.length + 1))}%`;
            journeyPath.appendChild(waypoint);
        });
    }
}

// ===================================
// DISPLAY ACCOMMODATIONS
// ===================================

function displayAccommodations() {
    const container = document.getElementById('accommodationsContainer');
    const emptyState = document.getElementById('emptyState');

    // Get relevant locations based on selected attractions
    const locations = getRelevantLocations();

    if (locations.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    container.innerHTML = locations.map(location => createLocationSection(location)).join('');

    // Add event listeners to hotel cards
    addHotelCardListeners();
}

// ===================================
// GET RELEVANT LOCATIONS
// Shows ALL hotels along the route, not just at selected attractions
// ===================================

function getRelevantLocations() {
    const locations = new Set();

    // Get origin and destination from trip
    const origin = currentTrip.origin ? currentTrip.origin.toLowerCase() : '';
    const destination = currentTrip.destination ? currentTrip.destination.toLowerCase() : '';

    // Define route-based hotel locations
    // This shows ALL hotels along the route

    // Bangalore to Kashmir route
    if ((origin.includes('bangalore') || origin.includes('bengaluru')) &&
        (destination.includes('kashmir') || destination.includes('srinagar'))) {
        locations.add('Maharashtra');
        locations.add('Rajasthan');
        locations.add('Delhi');
        locations.add('Punjab');
        locations.add('Himachal Pradesh');
        locations.add('Jammu & Kashmir');
    }
    // Mumbai to Kashmir
    else if (origin.includes('mumbai') && destination.includes('kashmir')) {
        locations.add('Maharashtra');
        locations.add('Rajasthan');
        locations.add('Delhi');
        locations.add('Punjab');
        locations.add('Jammu & Kashmir');
    }
    // Delhi to Kashmir
    else if (origin.includes('delhi') && destination.includes('kashmir')) {
        locations.add('Delhi');
        locations.add('Punjab');
        locations.add('Himachal Pradesh');
        locations.add('Jammu & Kashmir');
    }
    // Any route through Rajasthan
    else if (origin.includes('rajasthan') || destination.includes('rajasthan') ||
        origin.includes('jaipur') || destination.includes('jaipur')) {
        locations.add('Rajasthan');
        locations.add('Delhi');
    }
    // Bangalore/Karnataka routes
    else if (origin.includes('bangalore') || origin.includes('bengaluru') || origin.includes('karnataka')) {
        locations.add('Karnataka');
        locations.add('Maharashtra');
        locations.add('Goa');
    }
    // Default: show hotels in major cities
    else {
        locations.add('Maharashtra');
        locations.add('Delhi');
        locations.add('Karnataka');
        locations.add('Rajasthan');
    }

    // Also add states from selected attractions if any
    if (currentTrip.selectedAttractions && currentTrip.selectedAttractions.length > 0) {
        currentTrip.selectedAttractions.forEach(attraction => {
            if (attraction.state) {
                locations.add(attraction.state);
            }
        });
    }

    // Group hotels by location
    const locationGroups = [];
    locations.forEach(state => {
        const hotels = HOTELS_DATABASE.filter(h => h.state === state);
        if (hotels.length > 0) {
            locationGroups.push({
                name: state,
                hotels: hotels,
                distance: calculateDistance(state, origin)
            });
        }
    });

    // Sort by distance from origin
    locationGroups.sort((a, b) => a.distance - b.distance);

    return locationGroups;
}

// Helper function to calculate approximate distance
function calculateDistance(state, origin) {
    // Simplified distance calculation
    const distances = {
        'Karnataka': origin.includes('bangalore') ? 0 : 500,
        'Maharashtra': 400,
        'Goa': 300,
        'Rajasthan': 800,
        'Delhi': 1000,
        'Punjab': 1200,
        'Himachal Pradesh': 1300,
        'Jammu & Kashmir': 1500
    };
    return distances[state] || 500;
}

// ===================================
// CREATE LOCATION SECTION
// ===================================

function createLocationSection(location) {
    return `
    <div class="accommodation-location" data-location="${location.name}">
      <div class="location-header">
        <div class="location-icon">🏨</div>
        <div class="location-info">
          <h3>${location.name}</h3>
          <div class="location-distance">~${location.distance} km from origin</div>
        </div>
      </div>
      <div class="hotels-grid">
        ${location.hotels.map(hotel => createHotelCard(hotel)).join('')}
      </div>
    </div>
  `;
}

// ===================================
// CREATE HOTEL CARD
// ===================================

function createHotelCard(hotel) {
    const isBooked = bookedAccommodations.some(b => b.id === hotel.id);
    const stars = '⭐'.repeat(Math.floor(hotel.rating));

    return `
    <div class="hotel-card ${isBooked ? 'booked' : ''}" data-hotel-id="${hotel.id}">
      <img src="${hotel.image}" alt="${hotel.name}" class="hotel-image" onerror="this.src='assets/images/hotel-placeholder.jpg'">
      <div class="hotel-content">
        <div class="hotel-header">
          <div>
            <div class="hotel-name">${hotel.name}</div>
            <div class="hotel-rating">${stars} ${hotel.rating}</div>
          </div>
          <span class="hotel-category ${hotel.category}">${hotel.category}</span>
        </div>
        <div class="hotel-amenities">
          ${hotel.amenities.slice(0, 3).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>
        <div class="hotel-footer">
          <div class="hotel-price">
            <div class="price-amount">${formatCurrency(hotel.price)}</div>
            <div class="price-label">per night</div>
          </div>
          <button class="book-btn ${isBooked ? 'booked' : ''}" onclick="toggleBooking('${hotel.id}')">
            ${isBooked ? '✓ Booked' : '🛏️ Book'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ===================================
// TOGGLE BOOKING
// ===================================

window.toggleBooking = function (hotelId) {
    const hotel = HOTELS_DATABASE.find(h => h.id === hotelId);
    if (!hotel) return;

    const index = bookedAccommodations.findIndex(b => b.id === hotelId);

    if (index > -1) {
        // Remove booking
        bookedAccommodations.splice(index, 1);
        showToast(`Removed ${hotel.name} from bookings`, 'info');
    } else {
        // Add booking
        bookedAccommodations.push({
            id: hotel.id,
            name: hotel.name,
            location: hotel.location,
            price: hotel.price,
            roomType: hotel.rooms[0].type
        });
        showToast(`Added ${hotel.name} to bookings`, 'success');
    }

    updateBookingSummary();
    displayAccommodations();
};

// ===================================
// UPDATE BOOKING SUMMARY
// ===================================

function updateBookingSummary() {
    const summary = document.getElementById('bookingSummary');
    const container = document.getElementById('bookedAccommodations');

    if (bookedAccommodations.length === 0) {
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'block';

    container.innerHTML = bookedAccommodations.map(booking => `
    <div class="booked-item">
      <div class="booked-item-info">
        <div class="booked-item-name">${booking.name}</div>
        <div class="booked-item-location">${booking.location}</div>
      </div>
      <div class="booked-item-price">${formatCurrency(booking.price)}</div>
      <button class="remove-booking" onclick="toggleBooking('${booking.id}')">×</button>
    </div>
  `).join('');

    const total = bookedAccommodations.reduce((sum, b) => sum + b.price, 0);
    document.getElementById('totalCost').textContent = formatCurrency(total);
}

// ===================================
// FILTER HOTELS
// ===================================

function filterHotels(category) {
    const cards = document.querySelectorAll('.hotel-card');

    cards.forEach(card => {
        const hotelId = card.dataset.hotelId;
        const hotel = HOTELS_DATABASE.find(h => h.id === hotelId);

        if (category === 'all' || hotel.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===================================
// CLEAR ALL BOOKINGS
// ===================================

window.clearAllBookings = function () {
    if (confirm('Are you sure you want to clear all bookings?')) {
        bookedAccommodations = [];
        updateBookingSummary();
        displayAccommodations();
        showToast('All bookings cleared', 'info');
    }
};

// ===================================
// CONFIRM BOOKINGS
// ===================================

window.confirmBookings = async function () {
    if (bookedAccommodations.length === 0) {
        showToast('No accommodations booked', 'error');
        return;
    }

    try {
        // Add accommodation costs to trip expenses
        const total = bookedAccommodations.reduce((sum, b) => sum + b.price, 0);

        for (const booking of bookedAccommodations) {
            await createExpense({
                id: generateUUID(),
                tripId: currentTrip.id,
                category: 'Accommodation',
                amount: booking.price,
                description: `${booking.name} - ${booking.location}`,
                date: new Date().getTime()
            });
        }

        // Update trip budget
        currentTrip.actualSpent = (currentTrip.actualSpent || 0) + total;
        await updateTrip(currentTrip);

        showToast(`Successfully booked ${bookedAccommodations.length} accommodations!`, 'success');

        setTimeout(() => {
            window.location.href = `trip-planner.html?id=${currentTrip.id}`;
        }, 1500);

    } catch (error) {
        console.error('Error confirming bookings:', error);
        showToast('Failed to confirm bookings', 'error');
    }
};

// ===================================
// HOTEL MODAL
// ===================================

function addHotelCardListeners() {
    document.querySelectorAll('.hotel-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.book-btn')) {
                const hotelId = card.dataset.hotelId;
                showHotelDetails(hotelId);
            }
        });
    });
}

function showHotelDetails(hotelId) {
    const hotel = HOTELS_DATABASE.find(h => h.id === hotelId);
    if (!hotel) return;

    document.getElementById('modalHotelName').textContent = hotel.name;
    document.getElementById('modalHotelImage').src = hotel.image;
    document.getElementById('modalHotelRating').textContent = `${'⭐'.repeat(Math.floor(hotel.rating))} ${hotel.rating}`;
    document.getElementById('modalHotelDescription').textContent = hotel.description;

    // Amenities
    document.getElementById('modalAmenities').innerHTML = hotel.amenities.map(a => `
    <div class="amenity-item">✓ ${a}</div>
  `).join('');

    // Room options
    document.getElementById('modalRoomOptions').innerHTML = hotel.rooms.map(room => `
    <div class="room-option">
      <div class="room-name">${room.type}</div>
      <div class="room-details">
        <span>Capacity: ${room.capacity} guests</span>
        <span class="room-price">${formatCurrency(room.price)}/night</span>
      </div>
    </div>
  `).join('');

    document.getElementById('modalBookButton').onclick = () => {
        closeHotelModal();
        toggleBooking(hotelId);
    };

    document.getElementById('hotelDetailsModal').classList.add('active');
}

window.closeHotelModal = function () {
    document.getElementById('hotelDetailsModal').classList.remove('active');
};
