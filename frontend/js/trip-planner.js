// ===================================
// TRIP PLANNER LOGIC
// Travel Planner Application
// ===================================

import {
    initDB,
    getTrip,
    updateTrip,
    getStopsByTripId,
    createStop,
    updateStop,
    deleteStop,
    getActivitiesByTripId,
    getActivitiesByStopId,
    createActivity,
    deleteActivity
} from './db.js';
import {
    getCurrentUser,
    formatDate,
    formatCurrency,
    generateUUID,
    showToast,
    getDaysBetween,
    downloadJSON
} from './utils.js';

let currentUser = null;
let currentTrip = null;
let tripStops = [];
let tripActivities = [];
let tripId = null;

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

    // Get trip ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    tripId = urlParams.get('id');

    if (!tripId) {
        showToast('No trip specified', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return;
    }

    // Initialize database
    try {
        await initDB();
    } catch (error) {
        console.error('Failed to initialize database:', error);
        showToast('Failed to initialize application', 'error');
    }

    // Setup event listeners
    setupEventListeners();

    // Load trip data
    await loadTripData();
});

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // Add stop button
    document.getElementById('addStopBtn').addEventListener('click', openAddStopModal);

    // Add stop form
    document.getElementById('addStopForm').addEventListener('submit', handleAddStop);

    // Add activity form
    document.getElementById('addActivityForm').addEventListener('submit', handleAddActivity);

    // Share button
    document.getElementById('shareBtn').addEventListener('click', handleShare);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', handleExport);

    // Save button (placeholder)
    document.getElementById('saveTripBtn').addEventListener('click', () => {
        showToast('All changes are saved automatically!', 'success');
    });

    // Date validation for stop arrival
    document.getElementById('stopArrival').addEventListener('change', (e) => {
        document.getElementById('stopDeparture').min = e.target.value;
    });
}

// ===================================
// LOAD TRIP DATA
// ===================================

async function loadTripData() {
    try {
        // Load trip
        currentTrip = await getTrip(tripId);

        if (!currentTrip) {
            showToast('Trip not found', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
            return;
        }

        // Check if user owns this trip
        if (currentTrip.userId !== currentUser.id) {
            showToast('You do not have access to this trip', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
            return;
        }

        // Load stops and activities
        tripStops = await getStopsByTripId(tripId);
        tripActivities = await getActivitiesByTripId(tripId);

        // Update UI
        updateTripHeader();
        updateBudgetSummary();
        updateTripInfo();
        renderStops();

    } catch (error) {
        console.error('Error loading trip data:', error);
        showToast('Error loading trip data', 'error');
    }
}

// ===================================
// UPDATE TRIP HEADER
// ===================================

function updateTripHeader() {
    const startDate = new Date(currentTrip.startDate);
    const endDate = new Date(currentTrip.endDate);
    const duration = getDaysBetween(startDate, endDate) + 1;

    document.getElementById('tripTitle').textContent = currentTrip.title;
    document.getElementById('tripDates').textContent = `📅 ${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}`;
    document.getElementById('tripDuration').textContent = `${duration} days`;
}

// ===================================
// UPDATE BUDGET SUMMARY
// ===================================

function updateBudgetSummary() {
    const totalBudget = currentTrip.totalBudget;
    const spent = tripActivities.reduce((sum, activity) => sum + (activity.estimatedCost || 0), 0);
    const remaining = totalBudget - spent;
    const percentage = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;

    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('budgetSpent').textContent = formatCurrency(spent);
    document.getElementById('budgetRemaining').textContent = formatCurrency(remaining);
    document.getElementById('budgetPercentage').textContent = `${Math.round(percentage)}%`;
    document.getElementById('budgetProgressFill').style.width = `${percentage}%`;

    // Update trip's actual spent
    currentTrip.actualSpent = spent;
    updateTrip(currentTrip);
}

// ===================================
// UPDATE TRIP INFO
// ===================================

function updateTripInfo() {
    const startDate = new Date(currentTrip.startDate);
    const endDate = new Date(currentTrip.endDate);
    const duration = getDaysBetween(startDate, endDate) + 1;

    document.getElementById('totalStops').textContent = tripStops.length;
    document.getElementById('totalActivities').textContent = tripActivities.length;
    document.getElementById('tripDurationSidebar').textContent = `${duration} days`;
}

// ===================================
// RENDER STOPS
// ===================================

function renderStops() {
    const stopsList = document.getElementById('stopsList');
    const emptyState = document.getElementById('stopsEmptyState');

    if (tripStops.length === 0) {
        stopsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    stopsList.style.display = 'grid';
    emptyState.style.display = 'none';

    stopsList.innerHTML = tripStops.map((stop, index) => {
        const activities = tripActivities.filter(a => a.stopId === stop.id);
        return createStopHTML(stop, index + 1, activities);
    }).join('');

    // Add event listeners
    attachStopEventListeners();
}

// ===================================
// CREATE STOP HTML
// ===================================

function createStopHTML(stop, number, activities) {
    const arrivalDate = new Date(stop.arrivalDate);
    const departureDate = new Date(stop.departureDate);
    const duration = getDaysBetween(arrivalDate, departureDate) + 1;

    const activitiesHTML = activities.length > 0 ? `
    <div class="activities-list">
      ${activities.map(activity => `
        <div class="activity-item">
          <div class="activity-item-info">
            <div class="activity-item-title">${activity.title}</div>
            <div class="activity-item-meta">
              <span>${getCategoryIcon(activity.category)} ${activity.category}</span>
              ${activity.estimatedCost ? `<span class="activity-item-cost">${formatCurrency(activity.estimatedCost)}</span>` : ''}
            </div>
          </div>
          <button class="stop-item-action" onclick="handleDeleteActivity('${activity.id}')" title="Delete">
            🗑️
          </button>
        </div>
      `).join('')}
    </div>
  ` : '';

    return `
    <div class="stop-item" data-stop-id="${stop.id}">
      <div class="stop-item-header">
        <div class="stop-item-number">${number}</div>
        <div class="stop-item-info">
          <div class="stop-item-city">${stop.city}, ${stop.country}</div>
          <div class="stop-item-dates">
            ${formatDate(arrivalDate, 'short')} - ${formatDate(departureDate, 'short')} • ${duration} days
          </div>
          ${stop.notes ? `<p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--space-2);">${stop.notes}</p>` : ''}
        </div>
        <div class="stop-item-actions">
          <button class="stop-item-action" data-action="add-activity" title="Add Activity">
            ➕
          </button>
          <button class="stop-item-action" data-action="delete" title="Delete Stop">
            🗑️
          </button>
        </div>
      </div>
      ${activitiesHTML}
    </div>
  `;
}

function getCategoryIcon(category) {
    const icons = {
        sightseeing: '🏛️',
        food: '🍽️',
        adventure: '🏔️',
        shopping: '🛍️',
        entertainment: '🎭',
        relaxation: '🧘',
        other: '📌'
    };
    return icons[category] || '📌';
}

// ===================================
// ATTACH STOP EVENT LISTENERS
// ===================================

function attachStopEventListeners() {
    // Add activity buttons
    document.querySelectorAll('.stop-item-action[data-action="add-activity"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const stopId = btn.closest('.stop-item').dataset.stopId;
            openAddActivityModal(stopId);
        });
    });

    // Delete stop buttons
    document.querySelectorAll('.stop-item-action[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const stopId = btn.closest('.stop-item').dataset.stopId;
            await handleDeleteStop(stopId);
        });
    });
}

// ===================================
// ADD STOP MODAL
// ===================================

window.openAddStopModal = function () {
    const modal = document.getElementById('addStopModal');
    modal.classList.add('active');

    // Set date constraints based on trip dates
    const tripStart = formatDate(new Date(currentTrip.startDate), 'input');
    const tripEnd = formatDate(new Date(currentTrip.endDate), 'input');

    document.getElementById('stopArrival').min = tripStart;
    document.getElementById('stopArrival').max = tripEnd;
    document.getElementById('stopDeparture').min = tripStart;
    document.getElementById('stopDeparture').max = tripEnd;
};

window.closeAddStopModal = function () {
    const modal = document.getElementById('addStopModal');
    modal.classList.remove('active');
    document.getElementById('addStopForm').reset();
};

async function handleAddStop(e) {
    e.preventDefault();

    const city = document.getElementById('stopCity').value.trim();
    const country = document.getElementById('stopCountry').value.trim();
    const arrivalDate = new Date(document.getElementById('stopArrival').value).getTime();
    const departureDate = new Date(document.getElementById('stopDeparture').value).getTime();
    const notes = document.getElementById('stopNotes').value.trim();

    if (departureDate < arrivalDate) {
        showToast('Departure date must be after arrival date', 'error');
        return;
    }

    try {
        const newStop = {
            id: generateUUID(),
            tripId: tripId,
            city: city,
            country: country,
            arrivalDate: arrivalDate,
            departureDate: departureDate,
            order: tripStops.length + 1,
            notes: notes
        };

        await createStop(newStop);
        showToast('Stop added successfully!', 'success');

        closeAddStopModal();
        await loadTripData();

    } catch (error) {
        console.error('Error adding stop:', error);
        showToast('Error adding stop', 'error');
    }
}

// ===================================
// DELETE STOP
// ===================================

async function handleDeleteStop(stopId) {
    const stop = tripStops.find(s => s.id === stopId);
    if (!stop) return;

    const confirmed = confirm(`Delete ${stop.city}, ${stop.country}? This will also delete all activities in this stop.`);
    if (!confirmed) return;

    try {
        await deleteStop(stopId);
        showToast('Stop deleted successfully', 'success');
        await loadTripData();
    } catch (error) {
        console.error('Error deleting stop:', error);
        showToast('Error deleting stop', 'error');
    }
}

// ===================================
// ADD ACTIVITY MODAL
// ===================================

function openAddActivityModal(stopId) {
    const modal = document.getElementById('addActivityModal');
    const stop = tripStops.find(s => s.id === stopId);

    if (!stop) return;

    document.getElementById('activityStopId').value = stopId;

    // Set date constraints based on stop dates
    const stopStart = formatDate(new Date(stop.arrivalDate), 'input');
    const stopEnd = formatDate(new Date(stop.departureDate), 'input');

    document.getElementById('activityDate').min = stopStart;
    document.getElementById('activityDate').max = stopEnd;
    document.getElementById('activityDate').value = stopStart;

    modal.classList.add('active');
}

window.closeAddActivityModal = function () {
    const modal = document.getElementById('addActivityModal');
    modal.classList.remove('active');
    document.getElementById('addActivityForm').reset();
};

async function handleAddActivity(e) {
    e.preventDefault();

    const stopId = document.getElementById('activityStopId').value;
    const title = document.getElementById('activityTitle').value.trim();
    const category = document.getElementById('activityCategory').value;
    const date = new Date(document.getElementById('activityDate').value).getTime();
    const cost = parseFloat(document.getElementById('activityCost').value) || 0;
    const description = document.getElementById('activityDescription').value.trim();

    try {
        const newActivity = {
            id: generateUUID(),
            stopId: stopId,
            tripId: tripId,
            title: title,
            description: description,
            category: category,
            date: date,
            estimatedCost: cost,
            actualCost: 0,
            duration: 0,
            location: '',
            isBooked: false
        };

        await createActivity(newActivity);
        showToast('Activity added successfully!', 'success');

        closeAddActivityModal();
        await loadTripData();

    } catch (error) {
        console.error('Error adding activity:', error);
        showToast('Error adding activity', 'error');
    }
}

// ===================================
// DELETE ACTIVITY
// ===================================

window.handleDeleteActivity = async function (activityId) {
    const confirmed = confirm('Delete this activity?');
    if (!confirmed) return;

    try {
        await deleteActivity(activityId);
        showToast('Activity deleted successfully', 'success');
        await loadTripData();
    } catch (error) {
        console.error('Error deleting activity:', error);
        showToast('Error deleting activity', 'error');
    }
};

// ===================================
// SHARE TRIP
// ===================================

function handleShare() {
    const shareUrl = `${window.location.origin}/trip-planner.html?share=${currentTrip.shareId}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        showToast('Share link copied to clipboard!', 'success');
    } else {
        prompt('Copy this link to share:', shareUrl);
    }
}

// ===================================
// EXPORT TRIP
// ===================================

async function handleExport() {
    try {
        const exportData = {
            trip: currentTrip,
            stops: tripStops,
            activities: tripActivities
        };

        const filename = `${currentTrip.title.replace(/\s+/g, '-')}-${Date.now()}.json`;
        downloadJSON(exportData, filename);

        showToast('Trip exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting trip:', error);
        showToast('Error exporting trip', 'error');
    }
}
