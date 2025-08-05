// db.js
const DB_NAME = 'dailyHabitsDB';
const DB_VERSION = 4; // Increment version to trigger onupgradeneeded for new stores
export const STEPS_STORE_NAME = 'dailySteps';
export const WATER_STORE_NAME = 'dailyWater';
export const CALORIES_STORE_NAME = 'dailyCalories';
export const EXERCISES_STORE_NAME = 'exercises'; // New object store for individual exercises
export const WORKOUTS_STORE_NAME = 'workouts'; // New object store for workout routines

let db; // Variable to hold the IndexedDB instance

/**
 * Opens the IndexedDB database. If it doesn't exist, it creates it
 * and sets up the object stores.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            // This event is fired when the database is created or its version is upgraded.
            db = event.target.result;

            // Create steps object store if it doesn't exist
            if (!db.objectStoreNames.contains(STEPS_STORE_NAME)) {
                db.createObjectStore(STEPS_STORE_NAME, { keyPath: 'date' });
                console.log('IndexedDB: Steps object store created.');
            }

            // Create water object store if it doesn't exist
            if (!db.objectStoreNames.contains(WATER_STORE_NAME)) {
                db.createObjectStore(WATER_STORE_NAME, { keyPath: 'date' });
                console.log('IndexedDB: Water object store created.');
            }

            // Create calories object store if it doesn't exist
            if (!db.objectStoreNames.contains(CALORIES_STORE_NAME)) {
                db.createObjectStore(CALORIES_STORE_NAME, { keyPath: 'date' });
                console.log('IndexedDB: Calories object store created.');
            }

            // New: Create exercises object store
            if (!db.objectStoreNames.contains(EXERCISES_STORE_NAME)) {
                // Exercises will be stored by a unique ID, which we'll generate
                db.createObjectStore(EXERCISES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                console.log('IndexedDB: Exercises object store created.');
            }

            // New: Create workouts object store
            if (!db.objectStoreNames.contains(WORKOUTS_STORE_NAME)) {
                // Workouts will also be stored by a unique ID
                db.createObjectStore(WORKOUTS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                console.log('IndexedDB: Workouts object store created.');
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB: Database opened successfully.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB: Database error:', event.target.errorCode);
            reject(event.target.error);
        };
    });
}

/**
 * Saves or updates daily data in IndexedDB for a specific store.
 * This function is now more generic to handle exercises and workouts too.
 * @param {string} storeName - The name of the object store.
 * @param {string | object} data - The data to save. If storeName is dailySteps, dailyWater, or dailyCalories, it's a {date: string, value: number}. For exercises/workouts, it's an object with an 'id' (or will be auto-incremented).
 * @returns {Promise<void>} A promise that resolves when the data is saved.
 */
export function saveDailyData(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('IndexedDB: Database not open.');
            return reject(new Error('Database not open.'));
        }
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        // For daily tracking, 'data' is already the object { date: date, value: value }
        // For exercises/workouts, 'data' is the exercise/workout object
        const request = store.put(data);

        request.onsuccess = () => {
            console.log(`IndexedDB: ${storeName} saved:`, data);
            resolve();
        };

        request.onerror = (event) => {
            console.error(`IndexedDB: Error saving ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retrieves all data from IndexedDB for a specific store, sorted by date if applicable.
 * @param {string} storeName - The name of the object store.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of entries.
 */
export function getAllDailyData(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('IndexedDB: Database not open.');
            return reject(new Error('Database not open.'));
        }
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            // Only sort if it's a daily tracking store (assuming 'date' keyPath)
            if ([STEPS_STORE_NAME, WATER_STORE_NAME, CALORIES_STORE_NAME].includes(storeName)) {
                const sortedData = request.result.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(sortedData);
            } else {
                // For exercises/workouts, return as is or sort by name/ID if needed later
                resolve(request.result);
            }
        };

        request.onerror = (event) => {
            console.error(`IndexedDB: Error retrieving ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retrieves a single item by its ID from a specific store.
 * Useful for exercises and workouts.
 * @param {string} storeName - The name of the object store.
 * @param {IDBValidKey} id - The ID of the item to retrieve.
 * @returns {Promise<object | undefined>} A promise that resolves with the item or undefined if not found.
 */
export function getItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('IndexedDB: Database not open.');
            return reject(new Error('Database not open.'));
        }
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`IndexedDB: Error retrieving item from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Deletes an item by its ID from a specific store.
 * Useful for exercises and workouts.
 * @param {string} storeName - The name of the object store.
 * @param {IDBValidKey} id - The ID of the item to delete.
 * @returns {Promise<void>} A promise that resolves when the item is deleted.
 */
export function deleteItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('IndexedDB: Database not open.');
            return reject(new Error('Database not open.'));
        }
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`IndexedDB: Item with ID ${id} deleted from ${storeName}.`);
            resolve();
        };

        request.onerror = (event) => {
            console.error(`IndexedDB: Error deleting item from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}
