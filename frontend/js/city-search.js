// ===================================
// CITY SEARCH
// Travel Planner Application
// ===================================

import { initDB, getTripsByUserId, createStop } from './db.js';
import {
    getCurrentUser,
    clearCurrentUser,
    generateUUID,
    showToast,
    formatDate
} from './utils.js';

let currentUser = null;
let allCities = [];
let filteredCities = [];
let selectedCity = null;
let userTrips = [];

// ===================================
// CITIES DATABASE
// ===================================

const CITIES_DATABASE = [
    // India
    { id: 1, name: 'Mumbai', country: 'India', region: 'Asia', cost: 'moderate', popularity: 'popular', costIndex: '$$', description: 'Financial capital with vibrant culture and Bollywood', highlights: ['Gateway of India', 'Marine Drive', 'Bollywood'], image: 'mumbai.jpg' },
    { id: 2, name: 'Delhi', country: 'India', region: 'Asia', cost: 'moderate', popularity: 'popular', costIndex: '$$', description: 'Historic capital with Mughal architecture', highlights: ['Red Fort', 'India Gate', 'Qutub Minar'], image: 'delhi.jpg' },
    { id: 3, name: 'Bangalore', country: 'India', region: 'Asia', cost: 'moderate', popularity: 'trending', costIndex: '$$', description: 'Silicon Valley of India with pleasant weather', highlights: ['Lalbagh', 'Cubbon Park', 'Tech Hub'], image: 'bangalore.jpg' },
    { id: 4, name: 'Jaipur', country: 'India', region: 'Asia', cost: 'budget', popularity: 'popular', costIndex: '$', description: 'Pink City with royal palaces and forts', highlights: ['Amber Fort', 'Hawa Mahal', 'City Palace'], image: 'jaipur.jpg' },
    { id: 5, name: 'Goa', country: 'India', region: 'Asia', cost: 'moderate', popularity: 'popular', costIndex: '$$', description: 'Beach paradise with Portuguese heritage', highlights: ['Beaches', 'Churches', 'Nightlife'], image: 'goa.jpg' },
    { id: 6, name: 'Varanasi', country: 'India', region: 'Asia', cost: 'budget', popularity: 'hidden', costIndex: '$', description: 'Spiritual capital on the Ganges River', highlights: ['Ghats', 'Temples', 'Spirituality'], image: 'varanasi.jpg' },
    { id: 7, name: 'Udaipur', country: 'India', region: 'Asia', cost: 'moderate', popularity: 'trending', costIndex: '$$', description: 'City of Lakes with romantic palaces', highlights: ['Lake Palace', 'City Palace', 'Lakes'], image: 'udaipur.jpg' },

    // Asia
    { id: 8, name: 'Tokyo', country: 'Japan', region: 'Asia', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Modern metropolis blending tradition and innovation', highlights: ['Shibuya', 'Temples', 'Technology'], image: 'tokyo.jpg' },
    { id: 9, name: 'Bangkok', country: 'Thailand', region: 'Asia', cost: 'budget', popularity: 'popular', costIndex: '$', description: 'Vibrant city with temples and street food', highlights: ['Grand Palace', 'Street Food', 'Markets'], image: 'bangkok.jpg' },
    { id: 10, name: 'Singapore', country: 'Singapore', region: 'Asia', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Garden city with futuristic architecture', highlights: ['Marina Bay', 'Gardens', 'Food'], image: 'singapore.jpg' },
    { id: 11, name: 'Bali', country: 'Indonesia', region: 'Asia', cost: 'budget', popularity: 'popular', costIndex: '$', description: 'Tropical paradise with temples and beaches', highlights: ['Beaches', 'Temples', 'Rice Terraces'], image: 'bali.jpg' },
    { id: 12, name: 'Dubai', country: 'UAE', region: 'Asia', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Luxury destination with modern wonders', highlights: ['Burj Khalifa', 'Shopping', 'Desert'], image: 'dubai.jpg' },
    { id: 13, name: 'Seoul', country: 'South Korea', region: 'Asia', cost: 'moderate', popularity: 'trending', costIndex: '$$', description: 'K-pop capital with ancient palaces', highlights: ['Palaces', 'K-pop', 'Food'], image: 'seoul.jpg' },
    { id: 14, name: 'Kyoto', country: 'Japan', region: 'Asia', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Ancient capital with temples and gardens', highlights: ['Temples', 'Gardens', 'Geishas'], image: 'kyoto.jpg' },

    // Europe
    { id: 15, name: 'Paris', country: 'France', region: 'Europe', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'City of Light with iconic landmarks', highlights: ['Eiffel Tower', 'Louvre', 'Cuisine'], image: 'paris.jpg' },
    { id: 16, name: 'London', country: 'UK', region: 'Europe', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Historic capital with royal heritage', highlights: ['Big Ben', 'Museums', 'Culture'], image: 'london.jpg' },
    { id: 17, name: 'Rome', country: 'Italy', region: 'Europe', cost: 'moderate', popularity: 'popular', costIndex: '$$', description: 'Eternal City with ancient ruins', highlights: ['Colosseum', 'Vatican', 'History'], image: 'rome.jpg' },
    { id: 18, name: 'Barcelona', country: 'Spain', region: 'Europe', cost: 'moderate', popularity: 'popular', costIndex: '$$', description: 'Artistic city with Gaudí architecture', highlights: ['Sagrada Familia', 'Beaches', 'Art'], image: 'barcelona.jpg' },
    { id: 19, name: 'Amsterdam', country: 'Netherlands', region: 'Europe', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Canal city with liberal culture', highlights: ['Canals', 'Museums', 'Bikes'], image: 'amsterdam.jpg' },
    { id: 20, name: 'Prague', country: 'Czech Republic', region: 'Europe', cost: 'budget', popularity: 'trending', costIndex: '$', description: 'Fairy-tale city with medieval charm', highlights: ['Castle', 'Old Town', 'Beer'], image: 'prague.jpg' },
    { id: 21, name: 'Santorini', country: 'Greece', region: 'Europe', cost: 'expensive', popularity: 'trending', costIndex: '$$$', description: 'Island paradise with white-washed buildings', highlights: ['Sunsets', 'Beaches', 'Architecture'], image: 'santorini.jpg' },

    // North America
    { id: 22, name: 'New York', country: 'USA', region: 'North America', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'The city that never sleeps', highlights: ['Statue of Liberty', 'Times Square', 'Broadway'], image: 'newyork.jpg' },
    { id: 23, name: 'Los Angeles', country: 'USA', region: 'North America', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Entertainment capital with beaches', highlights: ['Hollywood', 'Beaches', 'Entertainment'], image: 'losangeles.jpg' },
    { id: 24, name: 'San Francisco', country: 'USA', region: 'North America', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Tech hub with iconic Golden Gate Bridge', highlights: ['Golden Gate', 'Tech', 'Hills'], image: 'sanfrancisco.jpg' },
    { id: 25, name: 'Cancun', country: 'Mexico', region: 'North America', cost: 'moderate', popularity: 'popular', costIndex: '$$', description: 'Beach resort with Mayan ruins', highlights: ['Beaches', 'Ruins', 'Nightlife'], image: 'cancun.jpg' },
    { id: 26, name: 'Toronto', country: 'Canada', region: 'North America', cost: 'moderate', popularity: 'trending', costIndex: '$$', description: 'Multicultural city with CN Tower', highlights: ['CN Tower', 'Culture', 'Food'], image: 'toronto.jpg' },

    // South America
    { id: 27, name: 'Rio de Janeiro', country: 'Brazil', region: 'South America', cost: 'moderate', popularity: 'popular', costIndex: '$$', description: 'Carnival city with stunning beaches', highlights: ['Christ Redeemer', 'Beaches', 'Carnival'], image: 'rio.jpg' },
    { id: 28, name: 'Buenos Aires', country: 'Argentina', region: 'South America', cost: 'budget', popularity: 'trending', costIndex: '$', description: 'Paris of South America with tango', highlights: ['Tango', 'Steak', 'Culture'], image: 'buenosaires.jpg' },
    { id: 29, name: 'Lima', country: 'Peru', region: 'South America', cost: 'budget', popularity: 'hidden', costIndex: '$', description: 'Gateway to Machu Picchu with cuisine', highlights: ['Cuisine', 'History', 'Coast'], image: 'lima.jpg' },

    // Africa
    { id: 30, name: 'Cape Town', country: 'South Africa', region: 'Africa', cost: 'moderate', popularity: 'trending', costIndex: '$$', description: 'Coastal city with Table Mountain', highlights: ['Table Mountain', 'Beaches', 'Wine'], image: 'capetown.jpg' },
    { id: 31, name: 'Marrakech', country: 'Morocco', region: 'Africa', cost: 'budget', popularity: 'popular', costIndex: '$', description: 'Red City with souks and palaces', highlights: ['Souks', 'Palaces', 'Desert'], image: 'marrakech.jpg' },
    { id: 32, name: 'Cairo', country: 'Egypt', region: 'Africa', cost: 'budget', popularity: 'popular', costIndex: '$', description: 'Ancient city with pyramids', highlights: ['Pyramids', 'Sphinx', 'History'], image: 'cairo.jpg' },

    // Oceania
    { id: 33, name: 'Sydney', country: 'Australia', region: 'Oceania', cost: 'expensive', popularity: 'popular', costIndex: '$$$', description: 'Harbor city with Opera House', highlights: ['Opera House', 'Beaches', 'Harbor'], image: 'sydney.jpg' },
    { id: 34, name: 'Melbourne', country: 'Australia', region: 'Oceania', cost: 'expensive', popularity: 'trending', costIndex: '$$$', description: 'Cultural capital with coffee culture', highlights: ['Coffee', 'Art', 'Sports'], image: 'melbourne.jpg' },
    { id: 35, name: 'Auckland', country: 'New Zealand', region: 'Oceania', cost: 'expensive', popularity: 'hidden', costIndex: '$$$', description: 'City of Sails with natural beauty', highlights: ['Nature', 'Sailing', 'Volcanoes'], image: 'auckland.jpg' },
];

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize database
    try {
        await initDB();
    } catch (error) {
        console.error('Failed to initialize database:', error);
        showToast('Failed to initialize application', 'error');
    }

    // Setup UI
    setupUserInterface();
    setupEventListeners();

    // Load cities
    allCities = [...CITIES_DATABASE];
    filteredCities = [...allCities];
    displayCities(filteredCities);

    // Load user trips
    await loadUserTrips();
});

// ===================================
// USER INTERFACE SETUP
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

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // User menu
    const userMenuToggle = document.getElementById('userMenuToggle');
    userMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuToggle.parentElement.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        userMenuToggle.parentElement.classList.remove('active');
    });

    // Logout
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    // Profile and settings
    document.getElementById('profileLink').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Profile page coming soon!', 'info');
    });

    document.getElementById('settingsLink').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Settings page coming soon!', 'info');
    });

    // Search
    document.getElementById('citySearchInput').addEventListener('input', handleSearch);

    // Filters
    document.getElementById('regionFilter').addEventListener('change', applyFilters);
    document.getElementById('costFilter').addEventListener('change', applyFilters);
    document.getElementById('popularityFilter').addEventListener('change', applyFilters);

    // Sort
    document.getElementById('sortBy').addEventListener('change', applyFilters);

    // Clear filters
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    document.getElementById('resetSearchBtn').addEventListener('click', clearFilters);
}

// ===================================
// SEARCH
// ===================================

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
        filteredCities = [...allCities];
    } else {
        filteredCities = allCities.filter(city => {
            return city.name.toLowerCase().includes(query) ||
                city.country.toLowerCase().includes(query) ||
                city.region.toLowerCase().includes(query) ||
                city.description.toLowerCase().includes(query) ||
                city.highlights.some(h => h.toLowerCase().includes(query));
        });
    }

    applyFilters();
}

// ===================================
// APPLY FILTERS
// ===================================

function applyFilters() {
    const region = document.getElementById('regionFilter').value;
    const cost = document.getElementById('costFilter').value;
    const popularity = document.getElementById('popularityFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = [...filteredCities];

    // Apply filters
    if (region) {
        filtered = filtered.filter(c => c.region === region);
    }

    if (cost) {
        filtered = filtered.filter(c => c.cost === cost);
    }

    if (popularity) {
        filtered = filtered.filter(c => c.popularity === popularity);
    }

    // Sort
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'popularity':
                const popOrder = { popular: 1, trending: 2, hidden: 3 };
                return popOrder[a.popularity] - popOrder[b.popularity];
            case 'cost-low':
                const costOrderLow = { budget: 1, moderate: 2, expensive: 3 };
                return costOrderLow[a.cost] - costOrderLow[b.cost];
            case 'cost-high':
                const costOrderHigh = { expensive: 1, moderate: 2, budget: 3 };
                return costOrderHigh[a.cost] - costOrderHigh[b.cost];
            default:
                return 0;
        }
    });

    displayCities(filtered);
}

// ===================================
// DISPLAY CITIES
// ===================================

function displayCities(cities) {
    const grid = document.getElementById('citiesGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');

    resultsCount.textContent = cities.length;

    if (cities.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = cities.map(city => createCityCard(city)).join('');

    // Add event listeners
    document.querySelectorAll('.add-to-trip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cityId = parseInt(btn.dataset.cityId);
            const city = cities.find(c => c.id === cityId);
            openAddToTripModal(city);
        });
    });
}

// ===================================
// CREATE CITY CARD
// ===================================

function createCityCard(city) {
    const popularityBadge = city.popularity === 'popular' ? '<span class="city-badge popular">⭐ Popular</span>' :
        city.popularity === 'trending' ? '<span class="city-badge trending">🔥 Trending</span>' :
            '<span class="city-badge hidden-gem">💎 Hidden Gem</span>';

    const highlightTags = city.highlights.slice(0, 3).map(h =>
        `<span class="highlight-tag">${h}</span>`
    ).join('');

    return `
    <div class="city-card">
      <img src="assets/images/${city.image}" alt="${city.name}" class="city-card-image" onerror="this.src='assets/images/default-city.jpg'">
      <div class="city-card-content">
        <div class="city-card-header">
          <div>
            <h3 class="city-card-title">${city.name}</h3>
            <p class="city-card-country">📍 ${city.country}</p>
          </div>
          <div class="city-card-badges">
            ${popularityBadge}
          </div>
        </div>
        
        <p class="city-card-description">${city.description}</p>
        
        <div class="city-card-meta">
          <div class="city-meta-item">
            <span class="city-meta-label">Cost Index</span>
            <span class="city-meta-value cost-indicator">${city.costIndex}</span>
          </div>
          <div class="city-meta-item">
            <span class="city-meta-label">Region</span>
            <span class="city-meta-value">${city.region}</span>
          </div>
        </div>
        
        <div class="city-card-footer">
          <div class="city-highlights">
            ${highlightTags}
          </div>
          <button class="add-to-trip-btn" data-city-id="${city.id}">
            + Add to Trip
          </button>
        </div>
      </div>
    </div>
  `;
}

// ===================================
// ADD TO TRIP MODAL
// ===================================

async function loadUserTrips() {
    try {
        userTrips = await getTripsByUserId(currentUser.id);
    } catch (error) {
        console.error('Error loading trips:', error);
    }
}

function openAddToTripModal(city) {
    selectedCity = city;
    document.getElementById('selectedCityName').textContent = city.name;

    const tripsList = document.getElementById('tripsList');
    const noTripsState = document.getElementById('noTripsState');

    if (userTrips.length === 0) {
        tripsList.style.display = 'none';
        noTripsState.style.display = 'block';
    } else {
        tripsList.style.display = 'grid';
        noTripsState.style.display = 'none';

        tripsList.innerHTML = userTrips.map(trip => `
      <div class="trip-select-item" onclick="addCityToTrip('${trip.id}')">
        <div class="trip-select-title">${trip.title}</div>
        <div class="trip-select-dates">
          📅 ${formatDate(new Date(trip.startDate), 'short')} - ${formatDate(new Date(trip.endDate), 'short')}
        </div>
      </div>
    `).join('');
    }

    document.getElementById('addToTripModal').classList.add('active');
}

window.closeAddToTripModal = function () {
    document.getElementById('addToTripModal').classList.remove('active');
    selectedCity = null;
};

window.addCityToTrip = async function (tripId) {
    if (!selectedCity) return;

    try {
        const trip = userTrips.find(t => t.id === tripId);

        // Create a new stop for this city
        const newStop = {
            id: generateUUID(),
            tripId: tripId,
            city: selectedCity.name,
            country: selectedCity.country,
            arrivalDate: trip.startDate,
            departureDate: trip.startDate + (24 * 60 * 60 * 1000), // +1 day
            notes: selectedCity.description,
            order: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await createStop(newStop);

        showToast(`${selectedCity.name} added to ${trip.title}!`, 'success');
        closeAddToTripModal();

    } catch (error) {
        console.error('Error adding city to trip:', error);
        showToast('Error adding city to trip', 'error');
    }
};

// ===================================
// CLEAR FILTERS
// ===================================

function clearFilters() {
    document.getElementById('citySearchInput').value = '';
    document.getElementById('regionFilter').value = '';
    document.getElementById('costFilter').value = '';
    document.getElementById('popularityFilter').value = '';
    document.getElementById('sortBy').value = 'name';

    filteredCities = [...allCities];
    applyFilters();
}

// ===================================
// LOGOUT
// ===================================

function handleLogout() {
    const confirmed = confirm('Are you sure you want to logout?');

    if (confirmed) {
        clearCurrentUser();
        showToast('Logged out successfully', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}
