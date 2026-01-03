// ===================================
// DASHBOARD LOGIC
// Travel Planner Application
// ===================================

import { initDB, getTripsByUserId, createTrip, deleteTrip, getUserStatistics } from './db.js';
import {
    getCurrentUser,
    clearCurrentUser,
    formatDate,
    formatCurrency,
    generateUUID,
    showToast,
    getDaysBetween
} from './utils.js';

let currentUser = null;
let userTrips = [];

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
        console.log('Database initialized');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        showToast('Failed to initialize application', 'error');
    }

    // Setup UI
    setupUserInterface();
    setupEventListeners();

    // Load data
    await loadDashboardData();
});

// ===================================
// USER INTERFACE SETUP
// ===================================

function setupUserInterface() {
    // Update user name in welcome message and navbar
    const firstName = currentUser.name.split(' ')[0];
    document.getElementById('welcomeMessage').textContent = `Welcome back, ${firstName}!`;
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

    // Close dropdown when clicking outside
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

    // Explore button
    document.getElementById('exploreBtn').addEventListener('click', () => {
        window.location.href = 'city-search.html';
    });

    // Destination cards
    document.querySelectorAll('.destination-card').forEach(card => {
        card.addEventListener('click', () => {
            const destination = card.dataset.destination;
            showToast(`Explore ${destination} coming soon!`, 'info');
        });
    });

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
// LOAD DASHBOARD DATA
// ===================================

async function loadDashboardData() {
    try {
        // Load user statistics
        const stats = await getUserStatistics(currentUser.id);
        updateStatistics(stats);

        // Load user trips
        userTrips = await getTripsByUserId(currentUser.id);

        // Sort trips by start date
        userTrips.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        // Display upcoming trips
        displayUpcomingTrips();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// ===================================
// UPDATE STATISTICS
// ===================================

function updateStatistics(stats) {
    document.getElementById('totalTrips').textContent = stats.totalTrips;
    document.getElementById('totalCountries').textContent = stats.totalCountries;
    document.getElementById('totalCities').textContent = stats.totalCities;
    document.getElementById('totalSpent').textContent = formatCurrency(stats.totalSpent);
}

// ===================================
// DISPLAY UPCOMING TRIPS
// ===================================

function displayUpcomingTrips() {
    const grid = document.getElementById('upcomingTripsGrid');
    const emptyState = document.getElementById('emptyState');

    // Filter upcoming and ongoing trips
    const now = new Date();
    const relevantTrips = userTrips.filter(trip => {
        const endDate = new Date(trip.endDate);
        return endDate >= now;
    }).slice(0, 6); // Show max 6 trips

    if (relevantTrips.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = relevantTrips.map(trip => createTripCard(trip)).join('');

    // Add event listeners to trip cards
    document.querySelectorAll('.trip-card').forEach(card => {
        const tripId = card.dataset.tripId;

        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.trip-card-action')) {
                window.location.href = `trip-planner.html?id=${tripId}`;
            }
        });
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.trip-card-action[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tripId = btn.closest('.trip-card').dataset.tripId;
            window.location.href = `trip-planner.html?id=${tripId}`;
        });
    });

    document.querySelectorAll('.trip-card-action[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const tripId = btn.closest('.trip-card').dataset.tripId;
            await handleDeleteTrip(tripId);
        });
    });
}

// ===================================
// CREATE TRIP CARD HTML
// ===================================

function createTripCard(trip) {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    // Determine trip status
    let status = 'upcoming';
    let statusText = 'Upcoming';
    if (now >= startDate && now <= endDate) {
        status = 'ongoing';
        statusText = 'Ongoing';
    } else if (now > endDate) {
        status = 'past';
        statusText = 'Past';
    }

    // Calculate days
    const duration = getDaysBetween(startDate, endDate) + 1;

    // Get random destination image (placeholder)
    const images = ['paris.jpg', 'tokyo.jpg', 'bali.jpg'];
    const randomImage = images[Math.floor(Math.random() * images.length)];

    return `
    <div class="trip-card" data-trip-id="${trip.id}">
      <div style="position: relative;">
        <img src="assets/images/${randomImage}" alt="${trip.title}" class="trip-card-image">
        <div class="trip-card-badge ${status}">${statusText}</div>
      </div>
      <div class="trip-card-content">
        <h3 class="trip-card-title">${trip.title}</h3>
        <div class="trip-card-dates">
          <span>📅</span>
          <span>${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}</span>
          <span>•</span>
          <span>${duration} days</span>
        </div>
        ${trip.description ? `<p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-4);">${trip.description}</p>` : ''}
        <div class="trip-card-footer">
          <div class="trip-card-budget">
            <div class="trip-card-budget-label">Budget</div>
            <div class="trip-card-budget-value">${formatCurrency(trip.totalBudget)}</div>
          </div>
          <div class="trip-card-actions">
            <button class="trip-card-action" data-action="edit" title="Edit Trip">
              ✏️
            </button>
            <button class="trip-card-action" data-action="delete" title="Delete Trip">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===================================
// DELETE TRIP HANDLER
// ===================================

async function handleDeleteTrip(tripId) {
    const trip = userTrips.find(t => t.id === tripId);
    if (!trip) return;

    const confirmed = confirm(`Are you sure you want to delete "${trip.title}"? This action cannot be undone.`);

    if (!confirmed) return;

    try {
        await deleteTrip(tripId);
        showToast('Trip deleted successfully', 'success');

        // Reload dashboard data
        await loadDashboardData();

    } catch (error) {
        console.error('Error deleting trip:', error);
        showToast('Failed to delete trip', 'error');
    }
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
