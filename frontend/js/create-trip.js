// ===================================
// CREATE TRIP WITH ROUTE SUGGESTIONS
// Travel Planner Application
// ===================================

import { initDB, createTrip } from './db.js';
import {
    getCurrentUser,
    generateUUID,
    showToast,
    formatDate
} from './utils.js';

let currentUser = null;
let selectedAttractions = [];
let coverPhotoDataUrl = null;

// ===================================
// ATTRACTIONS DATABASE
// Famous places across India
// ===================================

const ATTRACTIONS_DATABASE = [
    // Karnataka
    { id: 1, name: 'Mysore Palace', location: 'Mysore, Karnataka', state: 'Karnataka', lat: 12.3052, lon: 76.6551, icon: '🏰', category: 'Historical', description: 'Magnificent royal palace with Indo-Saracenic architecture', estimatedTime: '2-3 hours' },
    { id: 2, name: 'Hampi Ruins', location: 'Hampi, Karnataka', state: 'Karnataka', lat: 15.3350, lon: 76.4600, icon: '🏛️', category: 'Historical', description: 'UNESCO World Heritage Site with ancient temples', estimatedTime: '1-2 days' },

    // Maharashtra
    { id: 3, name: 'Gateway of India', location: 'Mumbai, Maharashtra', state: 'Maharashtra', lat: 18.9220, lon: 72.8347, icon: '🚪', category: 'Monument', description: 'Iconic arch monument overlooking Arabian Sea', estimatedTime: '1-2 hours' },
    { id: 4, name: 'Ajanta Caves', location: 'Aurangabad, Maharashtra', state: 'Maharashtra', lat: 20.5519, lon: 75.7033, icon: '🗿', category: 'Historical', description: 'Ancient Buddhist cave monuments with paintings', estimatedTime: '3-4 hours' },
    { id: 5, name: 'Ellora Caves', location: 'Aurangabad, Maharashtra', state: 'Maharashtra', lat: 20.0269, lon: 75.1793, icon: '⛰️', category: 'Historical', description: 'Rock-cut temples of Hindu, Buddhist, and Jain faiths', estimatedTime: '3-4 hours' },

    // Rajasthan
    { id: 6, name: 'Taj Mahal', location: 'Agra, Uttar Pradesh', state: 'Uttar Pradesh', lat: 27.1751, lon: 78.0421, icon: '🕌', category: 'Monument', description: 'Iconic white marble mausoleum, Wonder of the World', estimatedTime: '2-3 hours' },
    { id: 7, name: 'Amber Fort', location: 'Jaipur, Rajasthan', state: 'Rajasthan', lat: 26.9855, lon: 75.8513, icon: '🏰', category: 'Fort', description: 'Majestic fort with stunning architecture and views', estimatedTime: '2-3 hours' },
    { id: 8, name: 'Hawa Mahal', location: 'Jaipur, Rajasthan', state: 'Rajasthan', lat: 26.9239, lon: 75.8267, icon: '🏛️', category: 'Palace', description: 'Palace of Winds with unique honeycomb design', estimatedTime: '1 hour' },
    { id: 9, name: 'City Palace Jaipur', location: 'Jaipur, Rajasthan', state: 'Rajasthan', lat: 26.9258, lon: 75.8237, icon: '👑', category: 'Palace', description: 'Royal residence with museums and courtyards', estimatedTime: '2-3 hours' },
    { id: 10, name: 'Mehrangarh Fort', location: 'Jodhpur, Rajasthan', state: 'Rajasthan', lat: 26.2989, lon: 73.0189, icon: '🏰', category: 'Fort', description: 'One of the largest forts in India with panoramic views', estimatedTime: '2-3 hours' },
    { id: 11, name: 'Lake Palace', location: 'Udaipur, Rajasthan', state: 'Rajasthan', lat: 24.5760, lon: 73.6819, icon: '🏰', category: 'Palace', description: 'Floating palace on Lake Pichola', estimatedTime: '1-2 hours' },
    { id: 12, name: 'Jaisalmer Fort', location: 'Jaisalmer, Rajasthan', state: 'Rajasthan', lat: 26.9157, lon: 70.9083, icon: '🏜️', category: 'Fort', description: 'Golden fort in the Thar Desert', estimatedTime: '2-3 hours' },

    // Delhi
    { id: 13, name: 'Red Fort', location: 'Delhi', state: 'Delhi', lat: 28.6562, lon: 77.2410, icon: '🏰', category: 'Fort', description: 'Historic Mughal fort and UNESCO World Heritage Site', estimatedTime: '2 hours' },
    { id: 14, name: 'Qutub Minar', location: 'Delhi', state: 'Delhi', lat: 28.5244, lon: 77.1855, icon: '🗼', category: 'Monument', description: 'Tallest brick minaret in the world', estimatedTime: '1-2 hours' },
    { id: 15, name: 'India Gate', location: 'Delhi', state: 'Delhi', lat: 28.6129, lon: 77.2295, icon: '🚪', category: 'Monument', description: 'War memorial and iconic landmark', estimatedTime: '1 hour' },
    { id: 16, name: 'Lotus Temple', location: 'Delhi', state: 'Delhi', lat: 28.5535, lon: 77.2588, icon: '🌸', category: 'Temple', description: 'Baháʼí House of Worship shaped like a lotus', estimatedTime: '1 hour' },

    // Uttar Pradesh
    { id: 17, name: 'Agra Fort', location: 'Agra, Uttar Pradesh', state: 'Uttar Pradesh', lat: 27.1795, lon: 78.0211, icon: '🏰', category: 'Fort', description: 'UNESCO World Heritage Site, Mughal fort', estimatedTime: '2 hours' },
    { id: 18, name: 'Fatehpur Sikri', location: 'Agra, Uttar Pradesh', state: 'Uttar Pradesh', lat: 27.0945, lon: 77.6661, icon: '🕌', category: 'Historical', description: 'Abandoned Mughal city with stunning architecture', estimatedTime: '2-3 hours' },
    { id: 19, name: 'Varanasi Ghats', location: 'Varanasi, Uttar Pradesh', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, icon: '🛕', category: 'Religious', description: 'Sacred ghats on the Ganges River', estimatedTime: '3-4 hours' },

    // Madhya Pradesh
    { id: 20, name: 'Khajuraho Temples', location: 'Khajuraho, Madhya Pradesh', state: 'Madhya Pradesh', lat: 24.8318, lon: 79.9199, icon: '🛕', category: 'Temple', description: 'UNESCO site famous for erotic sculptures', estimatedTime: '3-4 hours' },
    { id: 21, name: 'Sanchi Stupa', location: 'Sanchi, Madhya Pradesh', state: 'Madhya Pradesh', lat: 23.4793, lon: 77.7398, icon: '⛩️', category: 'Buddhist', description: 'Ancient Buddhist monument', estimatedTime: '2 hours' },

    // Gujarat
    { id: 22, name: 'Somnath Temple', location: 'Somnath, Gujarat', state: 'Gujarat', lat: 20.8880, lon: 70.4013, icon: '🛕', category: 'Temple', description: 'One of the twelve Jyotirlinga shrines', estimatedTime: '1-2 hours' },
    { id: 23, name: 'Rann of Kutch', location: 'Kutch, Gujarat', state: 'Gujarat', lat: 23.8340, lon: 69.6669, icon: '🏜️', category: 'Natural', description: 'White salt desert, stunning during full moon', estimatedTime: '4-5 hours' },

    // Himachal Pradesh & Jammu Kashmir
    { id: 24, name: 'Rohtang Pass', location: 'Manali, Himachal Pradesh', state: 'Himachal Pradesh', lat: 32.3726, lon: 77.2493, icon: '⛰️', category: 'Natural', description: 'High mountain pass with snow-capped peaks', estimatedTime: '3-4 hours' },
    { id: 25, name: 'Solang Valley', location: 'Manali, Himachal Pradesh', state: 'Himachal Pradesh', lat: 32.3082, lon: 77.1537, icon: '🏔️', category: 'Adventure', description: 'Adventure sports and skiing destination', estimatedTime: '4-5 hours' },
    { id: 26, name: 'Dal Lake', location: 'Srinagar, Kashmir', state: 'Jammu and Kashmir', lat: 34.1205, lon: 74.8370, icon: '🚣', category: 'Natural', description: 'Iconic lake with houseboats and shikaras', estimatedTime: '2-3 hours' },
    { id: 27, name: 'Gulmarg', location: 'Gulmarg, Kashmir', state: 'Jammu and Kashmir', lat: 34.0484, lon: 74.3805, icon: '⛷️', category: 'Adventure', description: 'Ski resort and meadow of flowers', estimatedTime: '1 day' },
    { id: 28, name: 'Pahalgam', location: 'Pahalgam, Kashmir', state: 'Jammu and Kashmir', lat: 34.0161, lon: 75.3150, icon: '🏞️', category: 'Natural', description: 'Valley with rivers, lakes, and mountains', estimatedTime: '1 day' },
    { id: 29, name: 'Vaishno Devi Temple', location: 'Katra, Jammu', state: 'Jammu and Kashmir', lat: 33.0308, lon: 74.9489, icon: '🛕', category: 'Religious', description: 'Sacred Hindu temple in the mountains', estimatedTime: '1 day' },

    // Punjab & Haryana
    { id: 30, name: 'Golden Temple', location: 'Amritsar, Punjab', state: 'Punjab', lat: 31.6200, lon: 74.8765, icon: '🕌', category: 'Religious', description: 'Holiest Sikh gurdwara with golden dome', estimatedTime: '2-3 hours' },
    { id: 31, name: 'Wagah Border', location: 'Amritsar, Punjab', state: 'Punjab', lat: 31.6044, lon: 74.5726, icon: '🚧', category: 'Cultural', description: 'India-Pakistan border ceremony', estimatedTime: '2 hours' },
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

    // Setup event listeners
    setupEventListeners();

    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
});

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // Cover photo upload
    document.getElementById('uploadCoverBtn').addEventListener('click', () => {
        document.getElementById('coverPhotoInput').click();
    });

    document.getElementById('coverPhotoInput').addEventListener('change', handleCoverPhotoUpload);

    // Cover photo preview click
    document.getElementById('coverPhotoPreview').addEventListener('click', () => {
        document.getElementById('coverPhotoInput').click();
    });

    // Date validation
    document.getElementById('startDate').addEventListener('change', (e) => {
        document.getElementById('endDate').min = e.target.value;
    });

    // Find attractions button
    document.getElementById('findAttractionsBtn').addEventListener('click', findAttractions);

    // Form submission
    document.getElementById('createTripForm').addEventListener('submit', handleCreateTrip);
}

// ===================================
// COVER PHOTO UPLOAD
// ===================================

function handleCoverPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }

    // Read and preview image
    const reader = new FileReader();
    reader.onload = (event) => {
        coverPhotoDataUrl = event.target.result;
        document.getElementById('coverPhotoImg').src = coverPhotoDataUrl;
        showToast('Cover photo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

// ===================================
// FIND ATTRACTIONS ALONG ROUTE
// ===================================

function findAttractions() {
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const travelMode = document.getElementById('travelMode').value;

    if (!origin || !destination) {
        showToast('Please enter origin and destination', 'warning');
        return;
    }

    if (!travelMode) {
        showToast('Please select travel mode', 'warning');
        return;
    }

    // Show loading
    const attractionsSection = document.getElementById('attractionsSection');
    attractionsSection.style.display = 'block';

    const grid = document.getElementById('attractionsGrid');
    grid.innerHTML = '<div class="attractions-loading"><div class="spinner"></div><p>Finding amazing places along your route...</p></div>';

    // Simulate API call with timeout
    setTimeout(() => {
        const attractions = getAttractionsAlongRoute(origin, destination, travelMode);
        displayAttractions(attractions);
    }, 1500);
}

// ===================================
// GET ATTRACTIONS ALONG ROUTE
// Algorithm to find attractions between origin and destination
// ===================================

function getAttractionsAlongRoute(origin, destination, travelMode) {
    // Normalize input
    const originLower = origin.toLowerCase();
    const destLower = destination.toLowerCase();

    // Define major routes (simplified)
    const routeAttractions = [];

    // Bangalore to Kashmir route
    if ((originLower.includes('bangalore') || originLower.includes('bengaluru')) &&
        (destLower.includes('kashmir') || destLower.includes('srinagar'))) {
        // Route: Bangalore → Mumbai → Rajasthan → Delhi → Punjab → Kashmir
        routeAttractions.push(...ATTRACTIONS_DATABASE.filter(a =>
            a.state === 'Maharashtra' ||
            a.state === 'Rajasthan' ||
            a.state === 'Delhi' ||
            a.state === 'Uttar Pradesh' ||
            a.state === 'Punjab' ||
            a.state === 'Himachal Pradesh' ||
            a.state === 'Jammu and Kashmir'
        ));
    }
    // Mumbai to Kashmir
    else if (originLower.includes('mumbai') && destLower.includes('kashmir')) {
        routeAttractions.push(...ATTRACTIONS_DATABASE.filter(a =>
            a.state === 'Rajasthan' ||
            a.state === 'Delhi' ||
            a.state === 'Punjab' ||
            a.state === 'Jammu and Kashmir'
        ));
    }
    // Delhi to Kashmir
    else if (originLower.includes('delhi') && destLower.includes('kashmir')) {
        routeAttractions.push(...ATTRACTIONS_DATABASE.filter(a =>
            a.state === 'Punjab' ||
            a.state === 'Himachal Pradesh' ||
            a.state === 'Jammu and Kashmir'
        ));
    }
    // Any route through Rajasthan
    else if (originLower.includes('rajasthan') || destLower.includes('rajasthan') ||
        originLower.includes('jaipur') || destLower.includes('jaipur')) {
        routeAttractions.push(...ATTRACTIONS_DATABASE.filter(a =>
            a.state === 'Rajasthan' || a.state === 'Delhi' || a.state === 'Uttar Pradesh'
        ));
    }
    // Default: show popular attractions
    else {
        routeAttractions.push(...ATTRACTIONS_DATABASE.filter(a =>
            a.category === 'Monument' || a.category === 'Fort' || a.category === 'Palace'
        ));
    }

    // Filter based on travel mode
    if (travelMode === 'flight') {
        // For flights, only show attractions at destination
        return routeAttractions.filter(a =>
            a.location.toLowerCase().includes(destLower)
        ).slice(0, 6);
    }

    // For road travel (bike, car, bus), show more attractions
    return routeAttractions.slice(0, 12);
}

// ===================================
// DISPLAY ATTRACTIONS
// ===================================

function displayAttractions(attractions) {
    const grid = document.getElementById('attractionsGrid');
    const emptyState = document.getElementById('attractionsEmpty');
    const countSpan = document.getElementById('attractionsCount');

    if (attractions.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        countSpan.textContent = '0';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    countSpan.textContent = attractions.length;

    grid.innerHTML = attractions.map(attraction => `
    <div class="attraction-card" data-id="${attraction.id}">
      <input 
        type="checkbox" 
        class="attraction-checkbox" 
        data-id="${attraction.id}"
        title="Add to trip"
      >
      <div class="attraction-card-header">
        <div class="attraction-icon">${attraction.icon}</div>
        <div class="attraction-info">
          <div class="attraction-name">${attraction.name}</div>
          <div class="attraction-location">📍 ${attraction.location}</div>
        </div>
      </div>
      <p class="attraction-description">${attraction.description}</p>
      <div class="attraction-meta">
        <span class="attraction-meta-item">
          <span>🏷️</span>
          <span>${attraction.category}</span>
        </span>
        <span class="attraction-meta-item">
          <span>⏱️</span>
          <span>${attraction.estimatedTime}</span>
        </span>
      </div>
    </div>
  `).join('');

    // Add event listeners to checkboxes
    document.querySelectorAll('.attraction-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const attractionId = parseInt(e.target.dataset.id);
            const card = e.target.closest('.attraction-card');

            if (e.target.checked) {
                card.classList.add('selected');
                const attraction = attractions.find(a => a.id === attractionId);
                if (attraction && !selectedAttractions.find(a => a.id === attractionId)) {
                    selectedAttractions.push(attraction);
                }
            } else {
                card.classList.remove('selected');
                selectedAttractions = selectedAttractions.filter(a => a.id !== attractionId);
            }
        });
    });

    // Add click handler to cards
    document.querySelectorAll('.attraction-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('attraction-checkbox')) return;
            const checkbox = card.querySelector('.attraction-checkbox');
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    showToast(`Found ${attractions.length} amazing places along your route!`, 'success');
}

// ===================================
// CREATE TRIP
// ===================================

async function handleCreateTrip(e) {
    e.preventDefault();

    const tripName = document.getElementById('tripName').value.trim();
    const description = document.getElementById('tripDescription').value.trim();
    const startDate = new Date(document.getElementById('startDate').value).getTime();
    const endDate = new Date(document.getElementById('endDate').value).getTime();
    const budget = parseFloat(document.getElementById('budget').value);
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const travelMode = document.getElementById('travelMode').value;

    // Validate dates
    if (endDate < startDate) {
        showToast('End date must be after start date', 'error');
        return;
    }

    try {
        const newTrip = {
            id: generateUUID(),
            userId: currentUser.id,
            title: tripName,
            description: description,
            startDate: startDate,
            endDate: endDate,
            totalBudget: budget,
            actualSpent: 0,
            isPublic: false,
            shareId: generateUUID(),
            origin: origin,
            destination: destination,
            travelMode: travelMode,
            coverPhoto: coverPhotoDataUrl,
            selectedAttractions: selectedAttractions,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await createTrip(newTrip);

        showToast('Trip created successfully!', 'success');

        // Show summary
        if (selectedAttractions.length > 0) {
            showToast(`Added ${selectedAttractions.length} bonus attractions to your trip!`, 'info', 4000);
        }

        // Redirect to accommodations booking page
        setTimeout(() => {
            window.location.href = `accommodations.html?id=${newTrip.id}`;
        }, 1500);

    } catch (error) {
        console.error('Error creating trip:', error);
        showToast('Error creating trip', 'error');
    }
}
