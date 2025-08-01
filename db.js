// db.js
const DB_NAME = 'dailyHabitsDB';
const DB_VERSION = 3; // Increment version to trigger onupgradeneeded for new store
export const STEPS_STORE_NAME = 'dailySteps';
export const WATER_STORE_NAME = 'dailyWater';
export const CALORIES_STORE_NAME = 'dailyCalories'; // New object store name

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
 * @param {string} storeName - The name of the object store ('dailySteps', 'dailyWater', or 'dailyCalories').
 * @param {string} date - The date in YYYY-MM-DD format.
 * @param {number} value - The number of steps, water intake, or calories.
 * @returns {Promise<void>} A promise that resolves when the data is saved.
 */
export function saveDailyData(storeName, date, value) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('IndexedDB: Database not open.');
            return reject(new Error('Database not open.'));
        }
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const request = store.put({ date: date, value: value });

        request.onsuccess = () => {
            console.log(`IndexedDB: ${storeName} for ${date} saved: ${value}`);
            resolve();
        };

        request.onerror = (event) => {
            console.error(`IndexedDB: Error saving ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retrieves all daily data from IndexedDB for a specific store, sorted by date.
 * @param {string} storeName - The name of the object store ('dailySteps', 'dailyWater', or 'dailyCalories').
 * @returns {Promise<Array<{date: string, value: number}>>} A promise that resolves with an array of entries.
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
            const sortedData = request.result.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(sortedData);
        };

        request.onerror = (event) => {
            console.error(`IndexedDB: Error retrieving ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}
