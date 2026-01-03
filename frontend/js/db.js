// ===================================
// INDEXEDDB DATABASE WRAPPER
// Travel Planner Application
// ===================================

const DB_NAME = 'TravelPlannerDB';
const DB_VERSION = 1;

let db = null;

// ===================================
// DATABASE INITIALIZATION
// ===================================

export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database failed to open');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Create Users object store
            if (!db.objectStoreNames.contains('users')) {
                const usersStore = db.createObjectStore('users', { keyPath: 'id' });
                usersStore.createIndex('email', 'email', { unique: true });
            }

            // Create Trips object store
            if (!db.objectStoreNames.contains('trips')) {
                const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
                tripsStore.createIndex('userId', 'userId', { unique: false });
                tripsStore.createIndex('shareId', 'shareId', { unique: true });
            }

            // Create Stops object store
            if (!db.objectStoreNames.contains('stops')) {
                const stopsStore = db.createObjectStore('stops', { keyPath: 'id' });
                stopsStore.createIndex('tripId', 'tripId', { unique: false });
            }

            // Create Activities object store
            if (!db.objectStoreNames.contains('activities')) {
                const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' });
                activitiesStore.createIndex('tripId', 'tripId', { unique: false });
                activitiesStore.createIndex('stopId', 'stopId', { unique: false });
            }

            // Create Expenses object store
            if (!db.objectStoreNames.contains('expenses')) {
                const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
                expensesStore.createIndex('tripId', 'tripId', { unique: false });
                expensesStore.createIndex('stopId', 'stopId', { unique: false });
                expensesStore.createIndex('activityId', 'activityId', { unique: false });
            }

            console.log('Database setup complete');
        };
    });
}

// ===================================
// GENERIC CRUD OPERATIONS
// ===================================

export async function add(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function get(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getAll(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function update(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function remove(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

export async function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ===================================
// USER OPERATIONS
// ===================================

export async function createUser(userData) {
    try {
        const id = await add('users', userData);
        return await get('users', id);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

export async function getUserByEmail(email) {
    try {
        const users = await getByIndex('users', 'email', email);
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('Error getting user by email:', error);
        throw error;
    }
}

export async function updateUser(user) {
    try {
        await update('users', user);
        return user;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

// ===================================
// TRIP OPERATIONS
// ===================================

export async function createTrip(tripData) {
    try {
        const id = await add('trips', tripData);
        return await get('trips', id);
    } catch (error) {
        console.error('Error creating trip:', error);
        throw error;
    }
}

export async function getTrip(id) {
    try {
        return await get('trips', id);
    } catch (error) {
        console.error('Error getting trip:', error);
        throw error;
    }
}

export async function getTripsByUserId(userId) {
    try {
        return await getByIndex('trips', 'userId', userId);
    } catch (error) {
        console.error('Error getting trips by user:', error);
        throw error;
    }
}

export async function updateTrip(trip) {
    try {
        await update('trips', trip);
        return trip;
    } catch (error) {
        console.error('Error updating trip:', error);
        throw error;
    }
}

export async function deleteTrip(id) {
    try {
        // Delete all related stops
        const stops = await getByIndex('stops', 'tripId', id);
        for (const stop of stops) {
            await remove('stops', stop.id);
        }

        // Delete all related activities
        const activities = await getByIndex('activities', 'tripId', id);
        for (const activity of activities) {
            await remove('activities', activity.id);
        }

        // Delete all related expenses
        const expenses = await getByIndex('expenses', 'tripId', id);
        for (const expense of expenses) {
            await remove('expenses', expense.id);
        }

        // Delete the trip
        await remove('trips', id);
        return true;
    } catch (error) {
        console.error('Error deleting trip:', error);
        throw error;
    }
}

export async function getTripByShareId(shareId) {
    try {
        const trips = await getByIndex('trips', 'shareId', shareId);
        return trips.length > 0 ? trips[0] : null;
    } catch (error) {
        console.error('Error getting trip by share ID:', error);
        throw error;
    }
}

// ===================================
// STOP OPERATIONS
// ===================================

export async function createStop(stopData) {
    try {
        const id = await add('stops', stopData);
        return await get('stops', id);
    } catch (error) {
        console.error('Error creating stop:', error);
        throw error;
    }
}

export async function getStopsByTripId(tripId) {
    try {
        const stops = await getByIndex('stops', 'tripId', tripId);
        return stops.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error('Error getting stops:', error);
        throw error;
    }
}

export async function updateStop(stop) {
    try {
        await update('stops', stop);
        return stop;
    } catch (error) {
        console.error('Error updating stop:', error);
        throw error;
    }
}

export async function deleteStop(id) {
    try {
        // Delete all related activities
        const activities = await getByIndex('activities', 'stopId', id);
        for (const activity of activities) {
            await remove('activities', activity.id);
        }

        await remove('stops', id);
        return true;
    } catch (error) {
        console.error('Error deleting stop:', error);
        throw error;
    }
}

// ===================================
// ACTIVITY OPERATIONS
// ===================================

export async function createActivity(activityData) {
    try {
        const id = await add('activities', activityData);
        return await get('activities', id);
    } catch (error) {
        console.error('Error creating activity:', error);
        throw error;
    }
}

export async function getActivitiesByTripId(tripId) {
    try {
        return await getByIndex('activities', 'tripId', tripId);
    } catch (error) {
        console.error('Error getting activities:', error);
        throw error;
    }
}

export async function getActivitiesByStopId(stopId) {
    try {
        return await getByIndex('activities', 'stopId', stopId);
    } catch (error) {
        console.error('Error getting activities by stop:', error);
        throw error;
    }
}

export async function updateActivity(activity) {
    try {
        await update('activities', activity);
        return activity;
    } catch (error) {
        console.error('Error updating activity:', error);
        throw error;
    }
}

export async function deleteActivity(id) {
    try {
        await remove('activities', id);
        return true;
    } catch (error) {
        console.error('Error deleting activity:', error);
        throw error;
    }
}

// ===================================
// EXPENSE OPERATIONS
// ===================================

export async function createExpense(expenseData) {
    try {
        const id = await add('expenses', expenseData);
        return await get('expenses', id);
    } catch (error) {
        console.error('Error creating expense:', error);
        throw error;
    }
}

export async function getExpensesByTripId(tripId) {
    try {
        return await getByIndex('expenses', 'tripId', tripId);
    } catch (error) {
        console.error('Error getting expenses:', error);
        throw error;
    }
}

export async function updateExpense(expense) {
    try {
        await update('expenses', expense);
        return expense;
    } catch (error) {
        console.error('Error updating expense:', error);
        throw error;
    }
}

export async function deleteExpense(id) {
    try {
        await remove('expenses', id);
        return true;
    } catch (error) {
        console.error('Error deleting expense:', error);
        throw error;
    }
}

// ===================================
// STATISTICS & ANALYTICS
// ===================================

export async function getTripStatistics(tripId) {
    try {
        const [trip, stops, activities, expenses] = await Promise.all([
            getTrip(tripId),
            getStopsByTripId(tripId),
            getActivitiesByTripId(tripId),
            getExpensesByTripId(tripId)
        ]);

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalActivities = activities.length;
        const totalStops = stops.length;

        const expensesByCategory = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});

        return {
            trip,
            totalStops,
            totalActivities,
            totalExpenses,
            budget: trip.totalBudget,
            remaining: trip.totalBudget - totalExpenses,
            expensesByCategory
        };
    } catch (error) {
        console.error('Error getting trip statistics:', error);
        throw error;
    }
}

export async function getUserStatistics(userId) {
    try {
        const trips = await getTripsByUserId(userId);
        const totalTrips = trips.length;

        let totalCountries = new Set();
        let totalCities = new Set();
        let totalSpent = 0;

        for (const trip of trips) {
            const stops = await getStopsByTripId(trip.id);
            const expenses = await getExpensesByTripId(trip.id);

            stops.forEach(stop => {
                totalCountries.add(stop.country);
                totalCities.add(stop.city);
            });

            totalSpent += expenses.reduce((sum, exp) => sum + exp.amount, 0);
        }

        return {
            totalTrips,
            totalCountries: totalCountries.size,
            totalCities: totalCities.size,
            totalSpent,
            upcomingTrips: trips.filter(t => new Date(t.startDate) > new Date()).length,
            pastTrips: trips.filter(t => new Date(t.endDate) < new Date()).length
        };
    } catch (error) {
        console.error('Error getting user statistics:', error);
        throw error;
    }
}
