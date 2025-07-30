document.addEventListener('DOMContentLoaded', () => {
    const stepsInput = document.getElementById('stepsInput');
    const saveStepsBtn = document.getElementById('saveStepsBtn');
    const stepsList = document.getElementById('stepsList');

    // IndexedDB constants
    const DB_NAME = 'stepTrackerDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'dailySteps';
    let db; // Variable to hold the IndexedDB instance

    /**
     * Opens the IndexedDB database. If it doesn't exist, it creates it
     * and sets up the object store.
     * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
     */
    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                // This event is fired when the database is created or its version is upgraded.
                db = event.target.result;
                // Create an object store to hold information about daily steps.
                // The 'date' will be the keyPath, ensuring unique entries per day.
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'date' });
                    console.log('IndexedDB: Object store created.');
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
     * Saves or updates daily steps in IndexedDB.
     * @param {string} date - The date in YYYY-MM-DD format.
     * @param {number} steps - The number of steps.
     * @returns {Promise<void>} A promise that resolves when the data is saved.
     */
    function saveDailySteps(date, steps) {
        return new Promise((resolve, reject) => {
            if (!db) {
                console.error('IndexedDB: Database not open.');
                return reject(new Error('Database not open.'));
            }
            // Start a read-write transaction
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Put (add or update) the data
            const request = store.put({ date: date, steps: steps });

            request.onsuccess = () => {
                console.log(`IndexedDB: Steps for ${date} saved: ${steps}`);
                resolve();
            };

            request.onerror = (event) => {
                console.error('IndexedDB: Error saving steps:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Retrieves all daily steps from IndexedDB, sorted by date.
     * @returns {Promise<Array<{date: string, steps: number}>>} A promise that resolves with an array of step entries.
     */
    function getAllDailySteps() {
        return new Promise((resolve, reject) => {
            if (!db) {
                console.error('IndexedDB: Database not open.');
                return reject(new Error('Database not open.'));
            }
            // Start a read-only transaction
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll(); // Get all records

            request.onsuccess = () => {
                // Sort the results by date in descending order (most recent first)
                const sortedSteps = request.result.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(sortedSteps);
            };

            request.onerror = (event) => {
                console.error('IndexedDB: Error retrieving steps:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Formats a Date object into YYYY-MM-DD string.
     * @param {Date} date - The date object.
     * @returns {string} The formatted date string.
     */
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Displays the steps data in the UI.
     * @param {Array<{date: string, steps: number}>} stepsData - An array of step entries.
     */
    function displaySteps(stepsData) {
        stepsList.innerHTML = ''; // Clear existing list items

        if (stepsData.length === 0) {
            stepsList.innerHTML = '<li class="text-center text-gray-500">No steps recorded yet.</li>';
            return;
        }

        // Display only the last 7 days for simplicity, or all if less than 7
        const displayCount = Math.min(stepsData.length, 7);
        for (let i = 0; i < displayCount; i++) {
            const entry = stepsData[i];
            const listItem = document.createElement('li');
            listItem.className = 'bg-indigo-50 p-3 rounded-lg flex justify-between items-center';
            listItem.innerHTML = `
                <span class="font-medium text-indigo-800">${entry.date}</span>
                <span class="text-sm text-indigo-600">${entry.steps} steps</span>
            `;
            stepsList.appendChild(listItem);
        }
    }

    // Initialize the database and load existing steps when the page loads
    openDatabase()
        .then(() => {
            return getAllDailySteps();
        })
        .then((steps) => {
            displaySteps(steps);
        })
        .catch((error) => {
            console.error('Failed to initialize app:', error);
            stepsList.innerHTML = '<li class="text-center text-red-500">Error loading data. Please try again.</li>';
        });

    // Event listener for the save button
    saveStepsBtn.addEventListener('click', async () => {
        const steps = parseInt(stepsInput.value, 10);
        const today = formatDate(new Date());

        if (isNaN(steps) || steps <= 0) {
            // Simple validation: use a temporary message in the UI instead of alert()
            stepsInput.value = ''; // Clear input
            stepsInput.placeholder = 'Please enter a valid number of steps!';
            setTimeout(() => {
                stepsInput.placeholder = 'e.g., 7500';
            }, 3000); // Clear message after 3 seconds
            return;
        }

        try {
            await saveDailySteps(today, steps);
            stepsInput.value = ''; // Clear input after saving
            const updatedSteps = await getAllDailySteps();
            displaySteps(updatedSteps);
        } catch (error) {
            console.error('Error saving steps:', error);
            // Display error message to the user
            const errorMessage = document.createElement('li');
            errorMessage.className = 'text-center text-red-500';
            errorMessage.textContent = 'Failed to save steps. Please try again.';
            stepsList.prepend(errorMessage); // Add to top of list
            setTimeout(() => errorMessage.remove(), 5000); // Remove after 5 seconds
        }
    });
});
