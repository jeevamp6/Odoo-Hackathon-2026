// ===================================
// MY TRIPS PAGE LOGIC
// Travel Planner Application
// ===================================

import { initDB, getTripsByUserId, deleteTrip, getStopsByTripId } from './db.js';
import {
    getCurrentUser,
    clearCurrentUser,
    formatDate,
    formatCurrency,
    showToast,
    getDaysBetween
} from './utils.js';

let currentUser = null;
let allTrips = [];
let filteredTrips = [];
let tripToDelete = null;

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

    // Load trips
    await loadTrips();
});

// ===================================
// USER INTERFACE SETUP
// ===================================

function setupUserInterface() {
    // Update user info
    const firstName = currentUser.name.split(' ')[0];
    document.getElementById('userName').textContent = currentUser.name;

    // Set user avatar initial
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
    // User menu dropdown
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

    // New trip button
    document.getElementById('newTripBtn').addEventListener('click', () => {
        window.location.href = 'create-trip.html';
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Filters
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);

    // Profile and settings (placeholder)
    document.getElementById('profileLink').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Profile page coming soon!', 'info');
    });

    document.getElementById('settingsLink').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Settings page coming soon!', 'info');
    });
}

// ===================================
// LOAD TRIPS
// ===================================

async function loadTrips() {
    const loadingState = document.getElementById('loadingState');
    loadingState.style.display = 'block';

    try {
        allTrips = await getTripsByUserId(currentUser.id);

        // Load stops for each trip
        for (const trip of allTrips) {
            trip.stops = await getStopsByTripId(trip.id);
        }

        filteredTrips = [...allTrips];

        updateStats();
        applyFilters();

    } catch (error) {
        console.error('Error loading trips:', error);
        showToast('Error loading trips', 'error');
    } finally {
        loadingState.style.display = 'none';
    }
}

// ===================================
// UPDATE STATS
// ===================================

function updateStats() {
    const now = new Date();

    const upcoming = allTrips.filter(t => new Date(t.startDate) > now).length;
    const past = allTrips.filter(t => new Date(t.endDate) < now).length;
    const totalBudget = allTrips.reduce((sum, t) => sum + t.totalBudget, 0);

    document.getElementById('totalTripsCount').textContent = allTrips.length;
    document.getElementById('upcomingCount').textContent = upcoming;
    document.getElementById('completedCount').textContent = past;
    document.getElementById('totalBudgetSum').textContent = formatCurrency(totalBudget);
}

// ===================================
// SEARCH
// ===================================

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
        filteredTrips = [...allTrips];
    } else {
        filteredTrips = allTrips.filter(trip => {
            const titleMatch = trip.title.toLowerCase().includes(query);
            const descMatch = trip.description?.toLowerCase().includes(query);
            const destMatch = trip.destination?.toLowerCase().includes(query);
            const originMatch = trip.origin?.toLowerCase().includes(query);
            const stopsMatch = trip.stops?.some(s =>
                s.city.toLowerCase().includes(query) ||
                s.country.toLowerCase().includes(query)
            );

            return titleMatch || descMatch || destMatch || originMatch || stopsMatch;
        });
    }

    applyFilters();
}

// ===================================
// APPLY FILTERS
// ===================================

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    const now = new Date();

    // Filter by status
    let filtered = [...filteredTrips];

    if (statusFilter === 'upcoming') {
        filtered = filtered.filter(t => new Date(t.startDate) > now);
    } else if (statusFilter === 'ongoing') {
        filtered = filtered.filter(t =>
            new Date(t.startDate) <= now && new Date(t.endDate) >= now
        );
    } else if (statusFilter === 'past') {
        filtered = filtered.filter(t => new Date(t.endDate) < now);
    }

    // Sort
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return b.startDate - a.startDate;
            case 'date-asc':
                return a.startDate - b.startDate;
            case 'name-asc':
                return a.title.localeCompare(b.title);
            case 'name-desc':
                return b.title.localeCompare(a.title);
            case 'budget-desc':
                return b.totalBudget - a.totalBudget;
            case 'budget-asc':
                return a.totalBudget - b.totalBudget;
            default:
                return 0;
        }
    });

    displayTrips(filtered);
}

// ===================================
// DISPLAY TRIPS
// ===================================

function displayTrips(trips) {
    const tripsList = document.getElementById('tripsList');
    const emptyState = document.getElementById('emptyState');
    const emptyStateText = document.getElementById('emptyStateText');

    if (trips.length === 0) {
        tripsList.style.display = 'none';
        emptyState.style.display = 'block';

        const searchQuery = document.getElementById('searchInput').value;
        if (searchQuery) {
            emptyStateText.textContent = `No trips found matching "${searchQuery}"`;
        } else if (allTrips.length === 0) {
            emptyStateText.textContent = 'Start planning your dream vacation! Create your first trip and add destinations, activities, and budgets.';
        } else {
            emptyStateText.textContent = 'No trips match the selected filters.';
        }
        return;
    }

    tripsList.style.display = 'grid';
    emptyState.style.display = 'none';

    tripsList.innerHTML = trips.map(trip => createTripCard(trip)).join('');

    // Add event listeners
    attachTripEventListeners();
}

// ===================================
// CREATE TRIP CARD
// ===================================

function createTripCard(trip) {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    // Determine status
    let status = 'upcoming';
    let statusText = 'Upcoming';
    if (now >= startDate && now <= endDate) {
        status = 'ongoing';
        statusText = 'Ongoing';
    } else if (now > endDate) {
        status = 'past';
        statusText = 'Completed';
    }

    const duration = getDaysBetween(startDate, endDate) + 1;
    const stopsCount = trip.stops?.length || 0;

    // Get cover photo or default
    const coverPhoto = trip.coverPhoto || 'assets/images/default-trip-cover.jpg';

    // Get destination tags
    const destinations = trip.stops?.slice(0, 3).map(s => s.city) || [];
    if (trip.destination && !destinations.includes(trip.destination)) {
        destinations.unshift(trip.destination);
    }

    const destinationTags = destinations.slice(0, 3).map(dest =>
        `<span class="destination-tag">${dest}</span>`
    ).join('');

    const moreDestinations = stopsCount > 3 ?
        `<span class="destination-tag">+${stopsCount - 3} more</span>` : '';

    return `
    <div class="trip-list-card" data-trip-id="${trip.id}">
      <img src="${coverPhoto}" alt="${trip.title}" class="trip-cover-thumb" onerror="this.src='assets/images/default-trip-cover.jpg'">
      
      <div class="trip-list-info">
        <div class="trip-list-header">
          <div>
            <h3 class="trip-list-title">${trip.title}</h3>
            <div class="trip-list-meta">
              <span class="trip-meta-item">
                <span>📅</span>
                <span>${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}</span>
              </span>
              <span class="trip-meta-item">
                <span>⏱️</span>
                <span>${duration} days</span>
              </span>
              <span class="trip-meta-item">
                <span>📍</span>
                <span>${stopsCount} ${stopsCount === 1 ? 'stop' : 'stops'}</span>
              </span>
              ${trip.travelMode ? `
                <span class="trip-meta-item">
                  <span>${getTravelModeIcon(trip.travelMode)}</span>
                  <span>${capitalize(trip.travelMode)}</span>
                </span>
              ` : ''}
            </div>
          </div>
          <span class="trip-status-badge ${status}">${statusText}</span>
        </div>
        
        ${trip.description ? `
          <p class="trip-list-description">${trip.description}</p>
        ` : ''}
        
        <div class="trip-list-footer">
          <div class="trip-destinations">
            ${destinationTags}
            ${moreDestinations}
          </div>
          <div class="trip-budget-info">
            <span class="trip-budget-label">Budget</span>
            <span class="trip-budget-value">${formatCurrency(trip.totalBudget)}</span>
          </div>
        </div>
      </div>
      
      <div class="trip-list-actions">
        <button class="trip-action-btn" data-action="view">
          <span>👁️</span>
          <span>View</span>
        </button>
        <button class="trip-action-btn" data-action="edit">
          <span>✏️</span>
          <span>Edit</span>
        </button>
        <button class="trip-action-btn danger" data-action="delete">
          <span>🗑️</span>
          <span>Delete</span>
        </button>
      </div>
    </div>
  `;
}

function getTravelModeIcon(mode) {
    const icons = {
        bike: '🏍️',
        car: '🚗',
        train: '🚂',
        flight: '✈️',
        bus: '🚌',
        mixed: '🔀'
    };
    return icons[mode] || '🚗';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===================================
// ATTACH EVENT LISTENERS
// ===================================

function attachTripEventListeners() {
    // View buttons
    document.querySelectorAll('.trip-action-btn[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tripId = btn.closest('.trip-list-card').dataset.tripId;
            window.location.href = `trip-planner.html?id=${tripId}`;
        });
    });

    // Edit buttons
    document.querySelectorAll('.trip-action-btn[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tripId = btn.closest('.trip-list-card').dataset.tripId;
            window.location.href = `trip-planner.html?id=${tripId}`;
        });
    });

    // Delete buttons
    document.querySelectorAll('.trip-action-btn[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tripId = btn.closest('.trip-list-card').dataset.tripId;
            const trip = allTrips.find(t => t.id === tripId);
            openDeleteModal(trip);
        });
    });

    // Card click (view trip)
    document.querySelectorAll('.trip-list-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.trip-action-btn')) return;
            const tripId = card.dataset.tripId;
            window.location.href = `trip-planner.html?id=${tripId}`;
        });
    });
}

// ===================================
// DELETE MODAL
// ===================================

window.openDeleteModal = function (trip) {
    tripToDelete = trip;
    document.getElementById('deleteTripName').textContent = trip.title;
    document.getElementById('deleteModal').classList.add('active');
};

window.closeDeleteModal = function () {
    tripToDelete = null;
    document.getElementById('deleteModal').classList.remove('active');
};

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!tripToDelete) return;

    try {
        await deleteTrip(tripToDelete.id);
        showToast('Trip deleted successfully', 'success');
        closeDeleteModal();
        await loadTrips();
    } catch (error) {
        console.error('Error deleting trip:', error);
        showToast('Error deleting trip', 'error');
    }
});

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
