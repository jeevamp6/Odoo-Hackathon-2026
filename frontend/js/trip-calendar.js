// ===================================
// TRIP CALENDAR
// Travel Planner Application
// ===================================

import { initDB, getTripsByUserId } from './db.js';
import {
    getCurrentUser,
    clearCurrentUser,
    formatDate,
    showToast,
    getDaysBetween
} from './utils.js';

let currentUser = null;
let userTrips = [];
let currentDate = new Date();
let currentView = 'calendar';

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
    await loadUserTrips();

    // Render initial view
    renderCalendar();
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

    updateMonthDisplay();
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

    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateMonthDisplay();
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateMonthDisplay();
        renderCalendar();
    });

    // View toggle
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

// ===================================
// LOAD USER TRIPS
// ===================================

async function loadUserTrips() {
    try {
        userTrips = await getTripsByUserId(currentUser.id);
    } catch (error) {
        console.error('Error loading trips:', error);
        showToast('Error loading trips', 'error');
    }
}

// ===================================
// UPDATE MONTH DISPLAY
// ===================================

function updateMonthDisplay() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    document.getElementById('currentMonth').textContent = monthYear;
}

// ===================================
// SWITCH VIEW
// ===================================

function switchView(view) {
    currentView = view;

    // Update buttons
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Show/hide views
    if (view === 'calendar') {
        document.getElementById('calendarView').style.display = 'block';
        document.getElementById('timelineView').style.display = 'none';
        renderCalendar();
    } else {
        document.getElementById('calendarView').style.display = 'none';
        document.getElementById('timelineView').style.display = 'block';
        renderTimeline();
    }
}

// ===================================
// RENDER CALENDAR
// ===================================

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayIndex = firstDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Previous month days
    for (let i = firstDayIndex; i > 0; i--) {
        const day = createCalendarDay(prevLastDayDate - i + 1, true);
        calendarDays.appendChild(day);
    }

    // Current month days
    for (let i = 1; i <= lastDayDate; i++) {
        const day = createCalendarDay(i, false);
        calendarDays.appendChild(day);
    }

    // Next month days
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days

    for (let i = 1; i <= remainingCells; i++) {
        const day = createCalendarDay(i, true);
        calendarDays.appendChild(day);
    }
}

// ===================================
// CREATE CALENDAR DAY
// ===================================

function createCalendarDay(dayNumber, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';

    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dayDate = new Date(year, month, dayNumber);

    // Check if today
    const today = new Date();
    if (!isOtherMonth &&
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear()) {
        dayDiv.classList.add('today');
    }

    // Get trips for this day
    const tripsOnDay = getTripsForDay(dayDate);

    if (tripsOnDay.length > 0) {
        dayDiv.classList.add('has-trips');
    }

    // Day number
    const numberDiv = document.createElement('div');
    numberDiv.className = 'calendar-day-number';
    numberDiv.textContent = dayNumber;
    dayDiv.appendChild(numberDiv);

    // Trip dots
    const tripsDiv = document.createElement('div');
    tripsDiv.className = 'calendar-day-trips';

    tripsOnDay.slice(0, 3).forEach(trip => {
        const dot = document.createElement('div');
        dot.className = `calendar-trip-dot ${getTripStatus(trip)}`;
        dot.title = trip.title;
        tripsDiv.appendChild(dot);
    });

    dayDiv.appendChild(tripsDiv);

    // Count
    if (tripsOnDay.length > 3) {
        const countDiv = document.createElement('div');
        countDiv.className = 'calendar-day-count';
        countDiv.textContent = `+${tripsOnDay.length - 3}`;
        dayDiv.appendChild(countDiv);
    }

    // Click handler
    if (!isOtherMonth && tripsOnDay.length > 0) {
        dayDiv.addEventListener('click', () => {
            showDayDetails(dayDate, tripsOnDay);
        });
    }

    return dayDiv;
}

// ===================================
// GET TRIPS FOR DAY
// ===================================

function getTripsForDay(date) {
    return userTrips.filter(trip => {
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        date.setHours(12, 0, 0, 0);

        return date >= startDate && date <= endDate;
    });
}

// ===================================
// GET TRIP STATUS
// ===================================

function getTripStatus(trip) {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (now < startDate) {
        return 'upcoming';
    } else if (now >= startDate && now <= endDate) {
        return 'ongoing';
    } else {
        return 'past';
    }
}

// ===================================
// SHOW DAY DETAILS
// ===================================

function showDayDetails(date, trips) {
    const modal = document.getElementById('dayDetailsModal');
    const title = document.getElementById('modalDayTitle');
    const container = document.getElementById('dayTripsContainer');

    title.textContent = formatDate(date, 'long');

    container.innerHTML = trips.map(trip => `
    <div class="day-trip-item" onclick="window.location.href='trip-planner.html?id=${trip.id}'">
      <div class="day-trip-title">${trip.title}</div>
      <div class="day-trip-info">
        <span>📅 ${formatDate(new Date(trip.startDate), 'short')} - ${formatDate(new Date(trip.endDate), 'short')}</span>
        <span>•</span>
        <span>💰 ${trip.totalBudget ? '$' + trip.totalBudget : 'No budget'}</span>
      </div>
    </div>
  `).join('');

    modal.classList.add('active');
}

window.closeDayDetailsModal = function () {
    document.getElementById('dayDetailsModal').classList.remove('active');
};

// ===================================
// RENDER TIMELINE
// ===================================

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    const emptyState = document.getElementById('timelineEmptyState');

    if (userTrips.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    // Group trips by month
    const tripsByMonth = {};

    userTrips.forEach(trip => {
        const startDate = new Date(trip.startDate);
        const monthKey = `${startDate.getFullYear()}-${startDate.getMonth()}`;

        if (!tripsByMonth[monthKey]) {
            tripsByMonth[monthKey] = {
                month: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                trips: []
            };
        }

        tripsByMonth[monthKey].trips.push(trip);
    });

    // Sort by date
    const sortedMonths = Object.keys(tripsByMonth).sort();

    container.innerHTML = sortedMonths.map(monthKey => {
        const group = tripsByMonth[monthKey];

        return `
      <div class="timeline-month-group">
        <h3 class="timeline-month-header">${group.month}</h3>
        ${group.trips.map(trip => createTimelineTripCard(trip)).join('')}
      </div>
    `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.timeline-trip-card').forEach(card => {
        card.addEventListener('click', () => {
            const tripId = card.dataset.tripId;
            window.location.href = `trip-planner.html?id=${tripId}`;
        });
    });
}

// ===================================
// CREATE TIMELINE TRIP CARD
// ===================================

function createTimelineTripCard(trip) {
    const status = getTripStatus(trip);
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const duration = getDaysBetween(startDate, endDate) + 1;

    // Calculate progress for ongoing trips
    let progress = 0;
    if (status === 'ongoing') {
        const now = new Date();
        const totalDays = getDaysBetween(startDate, endDate);
        const daysPassed = getDaysBetween(startDate, now);
        progress = Math.min(100, Math.round((daysPassed / totalDays) * 100));
    } else if (status === 'past') {
        progress = 100;
    }

    const statusLabels = {
        upcoming: 'Upcoming',
        ongoing: 'Ongoing',
        past: 'Completed'
    };

    return `
    <div class="timeline-trip">
      <div class="timeline-trip-marker ${status}"></div>
      <div class="timeline-trip-card" data-trip-id="${trip.id}">
        <div class="timeline-trip-header">
          <div>
            <h4 class="timeline-trip-title">${trip.title}</h4>
            <div class="timeline-trip-dates">
              <span>📅</span>
              <span>${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}</span>
              <span>•</span>
              <span>${duration} days</span>
            </div>
          </div>
          <span class="timeline-trip-badge ${status}">${statusLabels[status]}</span>
        </div>
        
        <div class="timeline-trip-meta">
          <div class="timeline-trip-meta-item">
            <span>💰</span>
            <span>Budget: $${trip.totalBudget || 0}</span>
          </div>
          ${trip.origin && trip.destination ? `
            <div class="timeline-trip-meta-item">
              <span>📍</span>
              <span>${trip.origin} → ${trip.destination}</span>
            </div>
          ` : ''}
        </div>
        
        ${status === 'ongoing' ? `
          <div class="timeline-trip-progress">
            <div class="timeline-trip-progress-label">
              <span>Trip Progress</span>
              <span>${progress}%</span>
            </div>
            <div class="timeline-trip-progress-bar">
              <div class="timeline-trip-progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
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
