document.addEventListener('DOMContentLoaded', () => {
    const stepsInput = document.getElementById('stepsInput');
    const waterInput = document.getElementById('waterInput'); // New water input
    const saveDailyDataBtn = document.getElementById('saveDailyDataBtn'); // Renamed button
    const stepsList = document.getElementById('stepsList');
    const waterList = document.getElementById('waterList'); // New water list
    const stepsChartCanvas = document.getElementById('stepsChart');
    const waterChartCanvas = document.getElementById('waterChart'); // New water chart
    const appVersionSpan = document.getElementById('appVersion');

    // IndexedDB constants
    const DB_NAME = 'dailyHabitsDB'; // Renamed database for broader scope
    const DB_VERSION = 2; // Increment version to trigger onupgradeneeded for new store
    const STEPS_STORE_NAME = 'dailySteps';
    const WATER_STORE_NAME = 'dailyWater'; // New object store name
    let db; // Variable to hold the IndexedDB instance
    let stepsChartInstance; // Variable to hold the Chart.js instance for steps
    let waterChartInstance; // Variable to hold the Chart.js instance for water

    // Hardcoded goals
    const STEP_GOAL = 8000;
    const WATER_GOAL = 2000; // ml

    // Set the app version
    appVersionSpan.textContent = '1.1.0'; // Updated version

    /**
     * Opens the IndexedDB database. If it doesn't exist, it creates it
     * and sets up the object stores.
     * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
     */
    function openDatabase() {
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
     * @param {string} storeName - The name of the object store ('dailySteps' or 'dailyWater').
     * @param {string} date - The date in YYYY-MM-DD format.
     * @param {number} value - The number of steps or water intake.
     * @returns {Promise<void>} A promise that resolves when the data is saved.
     */
    function saveDailyData(storeName, date, value) {
        return new Promise((resolve, reject) => {
            if (!db) {
                console.error('IndexedDB: Database not open.');
                return reject(new Error('Database not open.'));
            }
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.put({ date: date, value: value }); // Changed 'steps' to 'value' for generic use

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
     * @param {string} storeName - The name of the object store ('dailySteps' or 'dailyWater').
     * @returns {Promise<Array<{date: string, value: number}>>} A promise that resolves with an array of entries.
     */
    function getAllDailyData(storeName) {
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
     * Displays the progress data in the UI lists and updates the charts.
     */
    async function displayProgress() {
        try {
            const stepsData = await getAllDailyData(STEPS_STORE_NAME);
            const waterData = await getAllDailyData(WATER_STORE_NAME);

            // Display Steps List
            stepsList.innerHTML = '';
            if (stepsData.length === 0) {
                stepsList.innerHTML = '<li class="text-center text-gray-500">No steps recorded yet.</li>';
            } else {
                const displayCount = Math.min(stepsData.length, 7);
                for (let i = 0; i < displayCount; i++) {
                    const entry = stepsData[i];
                    const listItem = document.createElement('li');
                    let goalStatusClass = '';
                    let goalStatusText = '';

                    if (entry.value >= STEP_GOAL) {
                        goalStatusClass = 'bg-green-100 text-green-800';
                        goalStatusText = '✅ Goal Met!';
                    } else {
                        goalStatusClass = 'bg-red-100 text-red-800';
                        goalStatusText = '❌ Goal Not Met';
                    }

                    listItem.className = `p-3 rounded-lg flex justify-between items-center ${goalStatusClass}`;
                    listItem.innerHTML = `
                        <span class="font-medium">${entry.date}</span>
                        <span class="text-sm">${entry.value} steps (${goalStatusText})</span>
                    `;
                    stepsList.appendChild(listItem);
                }
            }

            // Display Water List
            waterList.innerHTML = '';
            if (waterData.length === 0) {
                waterList.innerHTML = '<li class="text-center text-gray-500">No water recorded yet.</li>';
            } else {
                const displayCount = Math.min(waterData.length, 7);
                for (let i = 0; i < displayCount; i++) {
                    const entry = waterData[i];
                    const listItem = document.createElement('li');
                    let goalStatusClass = '';
                    let goalStatusText = '';

                    if (entry.value >= WATER_GOAL) {
                        goalStatusClass = 'bg-green-100 text-green-800';
                        goalStatusText = '✅ Goal Met!';
                    } else {
                        goalStatusClass = 'bg-red-100 text-red-800';
                        goalStatusText = '❌ Goal Not Met';
                    }

                    listItem.className = `p-3 rounded-lg flex justify-between items-center ${goalStatusClass}`;
                    listItem.innerHTML = `
                        <span class="font-medium">${entry.date}</span>
                        <span class="text-sm">${entry.value} ml (${goalStatusText})</span>
                    `;
                    waterList.appendChild(listItem);
                }
            }

            // Render Charts
            renderStepsChart(stepsData.slice(0, Math.min(stepsData.length, 7)).reverse());
            renderWaterChart(waterData.slice(0, Math.min(waterData.length, 7)).reverse());

        } catch (error) {
            console.error('Failed to display progress:', error);
            stepsList.innerHTML = '<li class="text-center text-red-500">Error loading steps data.</li>';
            waterList.innerHTML = '<li class="text-center text-red-500">Error loading water data.</li>';
            if (stepsChartInstance) { stepsChartInstance.destroy(); stepsChartInstance = null; }
            if (waterChartInstance) { waterChartInstance.destroy(); waterChartInstance = null; }
            stepsChartCanvas.style.display = 'none';
            waterChartCanvas.style.display = 'none';
        }
    }

    /**
     * Renders or updates the Chart.js graph for steps with a goal line.
     * @param {Array<{date: string, value: number}>} stepsData - The steps data to plot.
     */
    function renderStepsChart(stepsData) {
        const labels = stepsData.map(entry => entry.date);
        const steps = stepsData.map(entry => entry.value);
        const goalLine = Array(stepsData.length).fill(STEP_GOAL);

        if (stepsChartInstance) {
            stepsChartInstance.data.labels = labels;
            stepsChartInstance.data.datasets[0].data = steps;
            stepsChartInstance.data.datasets[1].data = goalLine;
            stepsChartInstance.update();
        } else {
            stepsChartInstance = new Chart(stepsChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Daily Steps',
                            data: steps,
                            backgroundColor: 'rgba(79, 70, 229, 0.8)',
                            borderColor: 'rgb(79, 70, 229)',
                            borderWidth: 1,
                            yAxisID: 'y',
                            categoryPercentage: 0.7,
                            barPercentage: 0.8,
                            borderRadius: 5,
                            order: 1,
                        },
                        {
                            label: `Goal (${STEP_GOAL} steps)`,
                            data: goalLine,
                            type: 'line',
                            borderColor: 'rgb(239, 68, 68)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            tension: 0,
                            fill: false,
                            yAxisID: 'y',
                            order: 2,
                            borderWidth: 2,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Daily Steps vs. Goal',
                            font: { size: 16 },
                            color: '#374151'
                        },
                        legend: {
                            labels: { color: '#4B5563' }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Date', color: '#4B5563' },
                            ticks: { color: '#6B7280' },
                            grid: { display: false }
                        },
                        y: {
                            title: { display: true, text: 'Steps', color: '#4B5563' },
                            ticks: { color: '#6B7280' },
                            grid: { color: '#E5E7EB' },
                            beginAtZero: true,
                            suggestedMax: STEP_GOAL * 1.2
                        }
                    }
                }
            });
        }
    }

    /**
     * Renders or updates the Chart.js graph for water with a goal line.
     * @param {Array<{date: string, value: number}>} waterData - The water data to plot.
     */
    function renderWaterChart(waterData) {
        const labels = waterData.map(entry => entry.date);
        const water = waterData.map(entry => entry.value);
        const goalLine = Array(waterData.length).fill(WATER_GOAL);

        if (waterChartInstance) {
            waterChartInstance.data.labels = labels;
            waterChartInstance.data.datasets[0].data = water;
            waterChartInstance.data.datasets[1].data = goalLine;
            waterChartInstance.update();
        } else {
            waterChartInstance = new Chart(waterChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Daily Water (ml)',
                            data: water,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)', // Tailwind blue-500 with opacity
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1,
                            yAxisID: 'y',
                            categoryPercentage: 0.7,
                            barPercentage: 0.8,
                            borderRadius: 5,
                            order: 1,
                        },
                        {
                            label: `Goal (${WATER_GOAL} ml)`,
                            data: goalLine,
                            type: 'line',
                            borderColor: 'rgb(239, 68, 68)', // Tailwind red-500
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            tension: 0,
                            fill: false,
                            yAxisID: 'y',
                            order: 2,
                            borderWidth: 2,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Daily Water Intake vs. Goal',
                            font: { size: 16 },
                            color: '#374151'
                        },
                        legend: {
                            labels: { color: '#4B5563' }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Date', color: '#4B5563' },
                            ticks: { color: '#6B7280' },
                            grid: { display: false }
                        },
                        y: {
                            title: { display: true, text: 'Water (ml)', color: '#4B5563' },
                            ticks: { color: '#6B7280' },
                            grid: { color: '#E5E7EB' },
                            beginAtZero: true,
                            suggestedMax: WATER_GOAL * 1.2
                        }
                    }
                }
            });
        }
    }

    // Initialize the database and load existing data when the page loads
    openDatabase()
        .then(() => {
            return displayProgress(); // Call the unified display function
        })
        .catch((error) => {
            console.error('Failed to initialize app:', error);
            // Error messages already handled in displayProgress
        });

    // Event listener for the save button
    saveDailyDataBtn.addEventListener('click', async () => {
        const stepsValue = stepsInput.value; // Get raw string value
        const waterValue = waterInput.value; // Get raw string value
        const today = formatDate(new Date());

        let stepsToSave = null;
        let waterToSave = null;
        let anyDataToSave = false;

        // Validate and parse steps
        if (stepsValue !== '') {
            const parsedSteps = parseInt(stepsValue, 10);
            if (isNaN(parsedSteps) || parsedSteps < 0) {
                stepsInput.value = '';
                stepsInput.placeholder = 'Invalid steps!';
                setTimeout(() => { stepsInput.placeholder = 'e.g., 7500'; }, 3000);
            } else {
                stepsToSave = parsedSteps;
                anyDataToSave = true;
            }
        }

        // Validate and parse water
        if (waterValue !== '') {
            const parsedWater = parseInt(waterValue, 10);
            if (isNaN(parsedWater) || parsedWater < 0) {
                waterInput.value = '';
                waterInput.placeholder = 'Invalid water!';
                setTimeout(() => { waterInput.placeholder = 'e.g., 2000'; }, 3000);
            } else {
                waterToSave = parsedWater;
                anyDataToSave = true;
            }
        }

        if (!anyDataToSave) {
            // Only show this message if both fields were either empty or invalid
            const errorMessage = document.createElement('li');
            errorMessage.className = 'text-center text-red-500';
            errorMessage.textContent = 'Please enter valid steps or water intake to save.';
            stepsList.prepend(errorMessage);
            setTimeout(() => errorMessage.remove(), 5000);
            return; // Exit if nothing valid to save
        }

        try {
            if (stepsToSave !== null) {
                await saveDailyData(STEPS_STORE_NAME, today, stepsToSave);
                stepsInput.value = ''; // Clear input after saving
            }

            if (waterToSave !== null) {
                await saveDailyData(WATER_STORE_NAME, today, waterToSave);
                waterInput.value = ''; // Clear input after saving
            }

            displayProgress(); // Re-render all data and charts

        } catch (error) {
            console.error('Error saving daily data:', error);
            const errorMessage = document.createElement('li');
            errorMessage.className = 'text-center text-red-500';
            errorMessage.textContent = 'Failed to save data. Please try again.';
            stepsList.prepend(errorMessage);
            setTimeout(() => errorMessage.remove(), 5000);
        }
    });
});
