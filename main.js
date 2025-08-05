// main.js
import { openDatabase, saveDailyData, STEPS_STORE_NAME, WATER_STORE_NAME, CALORIES_STORE_NAME } from './db.js';
import { formatDate } from './utils.js';
import { displayProgress, displayDashboardSummary } from './display.js'; // Import displayDashboardSummary

document.addEventListener('DOMContentLoaded', async () => {
    const stepsInput = document.getElementById('stepsInput');
    const waterInput = document.getElementById('waterInput');
    const caloriesInput = document.getElementById('caloriesInput');
    const saveDailyDataBtn = document.getElementById('saveDailyDataBtn');

    // Dashboard Summary Elements
    const todayStepsElement = document.getElementById('todaySteps');
    const todayWaterElement = document.getElementById('todayWater');
    const todayCaloriesElement = document.getElementById('todayCalories');
    const todayStepsGoalElement = document.getElementById('todayStepsGoal');
    const todayWaterGoalElement = document.getElementById('todayWaterGoal');
    const todayCaloriesGoalElement = document.getElementById('todayCaloriesGoal');

    // Tracking View Elements
    const stepsList = document.getElementById('stepsList');
    const waterList = document.getElementById('waterList');
    const caloriesList = document.getElementById('caloriesList');
    const stepsChartCanvas = document.getElementById('stepsChart');
    const waterChartCanvas = document.getElementById('waterChart');
    const caloriesChartCanvas = document.getElementById('caloriesChart');
    const appVersionSpan = document.getElementById('appVersion');

    // View Containers
    const dashboardView = document.getElementById('dashboardView');
    const trackingView = document.getElementById('trackingView');

    // Navigation Links
    const navDashboard = document.getElementById('navDashboard');
    const navTracking = document.getElementById('navTracking');
    const navWorkouts = document.getElementById('navWorkouts');
    const navMore = document.getElementById('navMore');

    // Set the app version
    appVersionSpan.textContent = '1.3.0'; // Updated version for new feature

    // Function to show a specific view and update active nav link
    function showView(viewToShow, activeNavLink) {
        dashboardView.classList.add('hidden');
        trackingView.classList.add('hidden');
        // Add more views here as you add them

        viewToShow.classList.remove('hidden');

        // Remove active class from all nav links
        document.querySelectorAll('.active-nav-link').forEach(link => {
            link.classList.remove('active-nav-link');
            link.classList.remove('bg-indigo-600'); // Remove active background
        });
        // Add active class to the clicked nav link
        if (activeNavLink) {
            activeNavLink.classList.add('active-nav-link');
            activeNavLink.classList.add('bg-indigo-600'); // Add active background
        }
    }

    // Initial load logic
    try {
        await openDatabase(); // Initialize the database
        // Display dashboard summary on initial load
        await displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);
        showView(dashboardView, navDashboard); // Show dashboard by default
    } catch (error) {
        console.error('Failed to initialize app:', error);
        const mainContentWrapper = document.getElementById('mainContentWrapper');
        if (mainContentWrapper) {
            mainContentWrapper.innerHTML = '<p class="text-center text-red-500 text-lg font-semibold mt-8">Failed to load the app. Please check your browser console for details.</p>';
        }
    }

    // Navigation Link Event Listeners
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showView(dashboardView, navDashboard);
        // Re-render dashboard summary if needed (e.g., if data changed while on another tab)
        displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);
    });

    navTracking.addEventListener('click', (e) => {
        e.preventDefault();
        showView(trackingView, navTracking);
        // Re-render tracking details when navigating to it
        displayProgress(stepsList, waterList, stepsChartCanvas, waterChartCanvas, caloriesList, caloriesChartCanvas);
    });

    // Event listener for the save button
    saveDailyDataBtn.addEventListener('click', async () => {
        const stepsValue = stepsInput.value;
        const waterValue = waterInput.value;
        const caloriesValue = caloriesInput.value;
        const today = formatDate(new Date());

        let stepsToSave = null;
        let waterToSave = null;
        let caloriesToSave = null;
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

        // Validate and parse calories
        if (caloriesValue !== '') {
            const parsedCalories = parseInt(caloriesValue, 10);
            if (isNaN(parsedCalories) || parsedCalories < 0) {
                caloriesInput.value = '';
                caloriesInput.placeholder = 'Invalid calories!';
                setTimeout(() => { caloriesInput.placeholder = 'e.g., 1730'; }, 3000);
            } else {
                caloriesToSave = parsedCalories;
                anyDataToSave = true;
            }
        }

        if (!anyDataToSave) {
            const errorMessage = document.createElement('li');
            errorMessage.className = 'text-center text-red-500';
            errorMessage.textContent = 'Please enter valid data for steps, water, or calories to save.';
            // Prepend to stepsList (now in tracking view, but can be a general message area)
            // For dashboard, we need a different error display. Let's use a general message div.
            const dashboardErrorDiv = document.getElementById('dashboardView').querySelector('.mb-6'); // Target an existing div near the inputs
            const currentError = dashboardErrorDiv.querySelector('.temp-error-message');
            if (currentError) currentError.remove(); // Remove previous error if exists

            const tempError = document.createElement('p');
            tempError.className = 'text-center text-red-500 text-sm mt-2 temp-error-message';
            tempError.textContent = 'Please enter valid data for steps, water, or calories to save.';
            dashboardErrorDiv.parentNode.insertBefore(tempError, dashboardErrorDiv.nextSibling); // Insert after the save button div
            setTimeout(() => tempError.remove(), 5000);
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

            if (caloriesToSave !== null) {
                await saveDailyData(CALORIES_STORE_NAME, today, caloriesToSave);
                caloriesInput.value = '';
            }

            // Re-render dashboard summary after saving
            await displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);
            // If currently on tracking view, also update it
            if (!trackingView.classList.contains('hidden')) {
                await displayProgress(stepsList, waterList, stepsChartCanvas, waterChartCanvas, caloriesList, caloriesChartCanvas);
            }

        } catch (error) {
                console.error('Error saving daily data:', error);
                const dashboardErrorDiv = document.getElementById('dashboardView').querySelector('.mb-6');
                const currentError = dashboardErrorDiv.querySelector('.temp-error-message');
                if (currentError) currentError.remove();

                const tempError = document.createElement('p');
                tempError.className = 'text-center text-red-500 text-sm mt-2 temp-error-message';
                tempError.textContent = 'Failed to save data. Please try again.';
                dashboardErrorDiv.parentNode.insertBefore(tempError, dashboardErrorDiv.nextSibling);
                setTimeout(() => tempError.remove(), 5000);
        }
    });
});
