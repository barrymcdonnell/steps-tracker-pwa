// main.js
import { openDatabase, saveDailyData, STEPS_STORE_NAME, WATER_STORE_NAME } from './db.js';
import { formatDate } from './utils.js';
import { displayProgress } from './display.js';

document.addEventListener('DOMContentLoaded', async () => {
    const stepsInput = document.getElementById('stepsInput');
    const waterInput = document.getElementById('waterInput');
    const saveDailyDataBtn = document.getElementById('saveDailyDataBtn');
    const stepsList = document.getElementById('stepsList');
    const waterList = document.getElementById('waterList');
    const stepsChartCanvas = document.getElementById('stepsChart');
    const waterChartCanvas = document.getElementById('waterChart');
    const appVersionSpan = document.getElementById('appVersion');

    // Set the app version
    appVersionSpan.textContent = '1.1.0'; // Updated version for refactor

    try {
        await openDatabase(); // Initialize the database
        // Pass DOM elements to displayProgress
        await displayProgress(stepsList, waterList, stepsChartCanvas, waterChartCanvas);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Display a general error if database cannot be opened or initial data cannot be loaded
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.innerHTML = '<p class="text-center text-red-500 text-lg font-semibold mt-8">Failed to load the app. Please check your browser console for details.</p>';
        }
    }

    // Event listener for the save button
    saveDailyDataBtn.addEventListener('click', async () => {
        const stepsValue = stepsInput.value;
        const waterValue = waterInput.value;
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
            const errorMessage = document.createElement('li');
            errorMessage.className = 'text-center text-red-500';
            errorMessage.textContent = 'Please enter valid steps or water intake to save.';
            stepsList.prepend(errorMessage);
            setTimeout(() => errorMessage.remove(), 5000);
            return;
        }

        try {
            if (stepsToSave !== null) {
                await saveDailyData(STEPS_STORE_NAME, today, stepsToSave);
                stepsInput.value = '';
            }

            if (waterToSave !== null) {
                await saveDailyData(WATER_STORE_NAME, today, waterToSave);
                waterInput.value = '';
            }

            // Re-render all data and charts after saving
            await displayProgress(stepsList, waterList, stepsChartCanvas, waterChartCanvas);

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
