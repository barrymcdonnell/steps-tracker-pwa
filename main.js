// main.js
import { displayProgress, displayDashboardSummary } from './display.js';
import { saveDailyData, STEPS_STORE_NAME, WATER_STORE_NAME, CALORIES_STORE_NAME } from './db.js';
import { formatDate } from './utils.js';

// --- DOM Element References ---
const views = {
    dashboard: document.getElementById('dashboardView'),
    tracking: document.getElementById('trackingView'),
    workouts: document.getElementById('workoutsView'),
    plans: document.getElementById('workoutPlansView'),
    more: document.getElementById('moreView'),
    exercises: document.getElementById('exercisesView'),
    achievements: document.getElementById('achievementsView')
};

const navLinks = {
    dashboard: document.getElementById('navDashboard'),
    tracking: document.getElementById('navTracking'),
    workouts: document.getElementById('navWorkouts'),
    plans: document.getElementById('navPlans'),
    more: document.getElementById('navMore')
};

// Dashboard Elements
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
const stepsListElement = document.getElementById('stepsList');
const waterListElement = document.getElementById('waterList');
const caloriesListElement = document.getElementById('caloriesList');
const stepsChartCanvasElement = document.getElementById('stepsChart');
const waterChartCanvasElement = document.getElementById('waterChart');
const caloriesChartCanvasElement = document.getElementById('caloriesChart');

// More View Elements
const showAchievementsFromMoreBtn = document.getElementById('showAchievementsFromMoreBtn');
const showExercisesFromMoreBtn = document.getElementById('showExercisesFromMoreBtn');

// Toast Notification Element
const toastNotification = document.getElementById('toastNotification');

/**
 * Shows a toast notification with a given message.
 * @param {string} message - The message to display.
 */
function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    // Hide the toast after 3 seconds
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

/**
 * Hides all main content views.
 */
function hideAllViews() {
    Object.values(views).forEach(view => view.classList.add('hidden'));
}

/**
 * Deactivates all navigation links.
 */
function deactivateAllNavLinks() {
    Object.values(navLinks).forEach(link => link.classList.remove('active-nav-link'));
}

/**
 * Handles the logic for switching between different views of the app.
 * @param {string} viewName - The name of the view to switch to (e.g., 'dashboard', 'tracking').
 */
function handleNavigation(viewName) {
    hideAllViews();
    deactivateAllNavLinks();
    
    // Show the requested view
    const targetView = views[viewName];
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // Activate the corresponding nav link
    const targetNavLink = navLinks[viewName];
    if (targetNavLink) {
        targetNavLink.classList.add('active-nav-link');
    }

    // Load data specific to the view
    if (viewName === 'tracking') {
        displayProgress(stepsListElement, waterListElement, stepsChartCanvasElement, waterChartCanvasElement, caloriesListElement, caloriesChartCanvasElement);
    }
}

/**
 * Initializes the application state.
 */
function initializeApp() {
    // Determine the initial view based on the URL hash
    const initialHash = window.location.hash.substring(1) || 'dashboard';
    handleNavigation(initialHash);

    // Initial display of dashboard summary
    displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);
}

// --- Event Listeners ---
window.addEventListener('DOMContentLoaded', initializeApp);

window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.substring(1) || 'dashboard';
    handleNavigation(newHash);
});

// Event listener for saving daily data
saveDailyDataBtn.addEventListener('click', async () => {
    const steps = parseInt(stepsInput.value);
    const water = parseInt(waterInput.value);
    const calories = parseInt(caloriesInput.value);

    const today = formatDate(new Date());

    if (!isNaN(steps) && steps > 0) {
        await saveDailyData(STEPS_STORE_NAME, { date: today, value: steps });
        showToast('Steps data saved!');
    }
    if (!isNaN(water) && water > 0) {
        await saveDailyData(WATER_STORE_NAME, { date: today, value: water });
        showToast('Water data saved!');
    }
    if (!isNaN(calories) && calories > 0) {
        await saveDailyData(CALORIES_STORE_NAME, { date: today, value: calories });
        showToast('Calories data saved!');
    }

    // Refresh the dashboard summary display
    displayDashboardSummary(todayStepsElement, todayWaterElement, todayCaloriesElement, todayStepsGoalElement, todayWaterGoalElement, todayCaloriesGoalElement);

    // Clear input fields after saving
    stepsInput.value = '';
    waterInput.value = '';
    caloriesInput.value = '';
});

// Event listener for "View Achievements" button in More view
showAchievementsFromMoreBtn.addEventListener('click', () => {
    window.location.hash = '#achievements';
});

// Event listener for "View Exercises" button in More view
showExercisesFromMoreBtn.addEventListener('click', () => {
    window.location.hash = '#exercises';
});

