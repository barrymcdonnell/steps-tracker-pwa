// db.js
const DB_NAME = 'dailyHabitsDB';
const DB_VERSION = 7; // Increment database version for schema changes

// Define store names
export const STEPS_STORE_NAME = 'steps';
export const WATER_STORE_NAME = 'water';
export const CALORIES_STORE_NAME = 'calories';
export const EXERCISES_STORE_NAME = 'exercises'; // For individual exercises
export const WORKOUTS_STORE_NAME = 'workouts'; // For workout routines (collections of exercises)
export const WORKOUT_SESSIONS_STORE_NAME = 'workout_sessions'; // For completed workout instances
export const WORKOUT_PLANS_STORE_NAME = 'workout_plans'; // For scheduled workout plans
export const ACHIEVEMENTS_STORE_NAME = 'achievements'; // New store for achievements

let db;

/**
 * Opens the IndexedDB database and creates/upgrades object stores.
 * This must be called and awaited before any other database operations.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('IndexedDB upgrade needed. Old version:', event.oldVersion, 'New version:', event.newVersion);

            // Define all object stores and their keyPaths
            const objectStores = [
                { name: STEPS_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } },
                { name: WATER_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } },
                { name: CALORIES_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } },
                { name: EXERCISES_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } },
                { name: WORKOUTS_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } },
                { name: WORKOUT_SESSIONS_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } },
                { name: WORKOUT_PLANS_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } },
                { name: ACHIEVEMENTS_STORE_NAME, options: { keyPath: 'id', autoIncrement: true } } // New: Achievements store
            ];

            objectStores.forEach(store => {
                // Only create the object store if it doesn't already exist
                if (!db.objectStoreNames.contains(store.name)) {
                    const objectStore = db.createObjectStore(store.name, store.options);
                    // Create indexes if necessary for certain stores
                    if (store.name === STEPS_STORE_NAME || store.name === WATER_STORE_NAME || store.name === CALORIES_STORE_NAME) {
                        objectStore.createIndex('date', 'date', { unique: false });
                    }
                    if (store.name === WORKOUT_SESSIONS_STORE_NAME) {
                        objectStore.createIndex('date', 'date', { unique: false });
                        objectStore.createIndex('workoutId', 'workoutId', { unique: false });
                    }
                    if (store.name === WORKOUT_PLANS_STORE_NAME) {
                        objectStore.createIndex('startDate', 'startDate', { unique: false });
                    }
                }
            });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened successfully.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
            reject(new Error('Failed to open IndexedDB.'));
        };
    });
}

/**
 * Saves a daily data entry to the specified object store.
 * If an entry for the date already exists, it updates the value by adding to it.
 * Otherwise, it adds a new record. This is specific to tracking daily habits.
 * @param {string} storeName - The name of the object store (e.g., STEPS_STORE_NAME).
 * @param {object} data - The data object to save, must have a 'date' and 'value' property.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export function saveDailyData(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not open.'));
            return;
        }

        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('date');
        const getRequest = index.get(data.date);

        getRequest.onerror = (event) => {
            console.error(`Error getting data for date ${data.date}:`, event.target.error);
            reject(event.target.error);
        };

        getRequest.onsuccess = () => {
            const existingData = getRequest.result;
            let finalData;

            if (existingData) {
                // Update existing record by adding the new value
                finalData = { ...existingData, value: existingData.value + data.value };
                const putRequest = store.put(finalData);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = (event) => reject(event.target.error);
            } else {
                // Add new record
                const addRequest = store.add(data);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = (event) => reject(event.target.error);
            }
        };
    });
}

/**
 * Retrieves all data from a specified object store, sorted by date in descending order.
 * @param {string} storeName - The name of the object store.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of all items.
 */
export function getAllDailyData(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not open.'));
            return;
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const data = event.target.result;
            // Sort by date in descending order
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(data);
        };

        request.onerror = (event) => {
            console.error(`Error getting all data from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retrieves a single item by its ID from a specified object store.
 * @param {string} storeName - The name of the object store.
 * @param {number} id - The ID of the item to retrieve.
 * @returns {Promise<object|undefined>} A promise that resolves with the item or undefined if not found.
 */
export function getItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not open.'));
            return;
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error(`Error getting item by ID from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Deletes an item by its ID from a specified object store.
 * @param {string} storeName - The name of the object store.
 * @param {number} id - The ID of the item to delete.
 * @returns {Promise<void>} A promise that resolves when the item is deleted.
 */
export function deleteItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not open.'));
            return;
        }

        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error deleting item from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}
