document.addEventListener('DOMContentLoaded', () => {
    const stepsInput = document.getElementById('stepsInput');
    const saveStepsBtn = document.getElementById('saveStepsBtn');
    const stepsList = document.getElementById('stepsList');
    const stepsChartCanvas = document.getElementById('stepsChart');
    const appVersionSpan = document.getElementById('appVersion'); // Get the app version span

    // IndexedDB constants
    const DB_NAME = 'stepTrackerDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'dailySteps';
    let db; // Variable to hold the IndexedDB instance
    let stepsChartInstance; // Variable to hold the Chart.js instance

    // Hardcoded step goal
    const STEP_GOAL = 8000;

    // Set the app version
    appVersionSpan.textContent = '1.0.1'; // You can update this manually

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
     * Displays the steps data in the UI list and updates the chart.
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
            let goalStatusClass = '';
            let goalStatusText = '';

            if (entry.steps >= STEP_GOAL) {
                goalStatusClass = 'bg-green-100 text-green-800'; // Goal met
                goalStatusText = '✅ Goal Met!';
            } else {
                goalStatusClass = 'bg-red-100 text-red-800'; // Goal not met
                goalStatusText = '❌ Goal Not Met';
            }

            listItem.className = `p-3 rounded-lg flex justify-between items-center ${goalStatusClass}`;
            listItem.innerHTML = `
                <span class="font-medium">${entry.date}</span>
                <span class="text-sm">${entry.steps} steps (${goalStatusText})</span>
            `;
            stepsList.appendChild(listItem);
        }

        // Render the chart with the updated data
        renderStepsChart(stepsData.slice(0, displayCount).reverse()); // Reverse to show oldest first on chart
    }

    /**
     * Renders or updates the Chart.js graph with steps data and a goal line.
     * @param {Array<{date: string, steps: number}>} stepsData - The steps data to plot.
     */
    function renderStepsChart(stepsData) {
        const labels = stepsData.map(entry => entry.date);
        const steps = stepsData.map(entry => entry.steps);
        // Create an array for the goal line, ensuring it spans all data points
        const goalLine = Array(stepsData.length).fill(STEP_GOAL);

        if (stepsChartInstance) {
            // If chart already exists, update its data
            stepsChartInstance.data.labels = labels;
            stepsChartInstance.data.datasets[0].data = steps;
            stepsChartInstance.data.datasets[1].data = goalLine;
            stepsChartInstance.update();
        } else {
            // Create a new chart instance
            stepsChartInstance = new Chart(stepsChartCanvas, {
                type: 'bar', // Changed to bar chart
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Daily Steps',
                            data: steps,
                            backgroundColor: 'rgba(79, 70, 229, 0.8)', // Tailwind indigo-600 with opacity
                            borderColor: 'rgb(79, 70, 229)',
                            borderWidth: 1,
                            yAxisID: 'y', // Explicitly assign to 'y' axis
                            categoryPercentage: 0.7, // Controls the space between categories (bars)
                            barPercentage: 0.8,      // Controls the width of the bar within its category
                            borderRadius: 5,         // Added for rounded bar tops
                        },
                        {
                            label: `Goal (${STEP_GOAL} steps)`,
                            data: goalLine,
                            type: 'line', // Explicitly set type to line for overlay
                            borderColor: 'rgb(239, 68, 68)', // Tailwind red-500
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', // More transparent for line
                            borderDash: [5, 5], // Dashed line for goal
                            pointRadius: 0, // No points for goal line
                            tension: 0, // Straight line for goal
                            fill: false,
                            yAxisID: 'y', // Explicitly assign to 'y' axis
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
                            font: {
                                size: 16
                            },
                            color: '#374151' // Tailwind gray-700
                        },
                        legend: {
                            labels: {
                                color: '#4B5563' // Tailwind gray-600
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date',
                                color: '#4B5563'
                            },
                            ticks: {
                                color: '#6B7280' // Tailwind gray-500
                            },
                            grid: {
                                display: false // Hide grid lines for a cleaner bar chart look
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Steps',
                                color: '#4B5563'
                            },
                            ticks: {
                                color: '#6B7280'
                            },
                            grid: {
                                color: '#E5E7EB' // Tailwind gray-200
                            },
                            beginAtZero: true,
                            // Ensure the y-axis extends past the goal if needed
                            suggestedMax: STEP_GOAL * 1.2 // Add some padding above the goal
                        }
                    }
                }
            });
        }
    }

    // Initialize the database and load existing steps when the page loads
    openDatabase()
        .then(() => {
            return getAllDailySteps();
        })
        .then((steps) => {
            displaySteps(steps); // This will also call renderStepsChart
        })
        .catch((error) => {
            console.error('Failed to initialize app:', error);
            stepsList.innerHTML = '<li class="text-center text-red-500">Error loading data. Please try again.</li>';
            // Also clear or hide the chart if there's an error
            if (stepsChartInstance) {
                stepsChartInstance.destroy();
                stepsChartInstance = null;
            }
            stepsChartCanvas.style.display = 'none'; // Hide canvas on error
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
            displaySteps(updatedSteps); // This will also call renderStepsChart
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
